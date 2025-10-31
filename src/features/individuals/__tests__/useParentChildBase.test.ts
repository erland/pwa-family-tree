// src/features/individuals/__tests__/useParentChildBase.test.ts

// --- Mocks must come first ---
jest.mock("../../../store", () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

jest.mock("../../individualsSlice", () => ({
  addIndividual: jest.fn((payload: any) => ({ __kind: "addIndividual", payload })),
}));

jest.mock("../../relationshipsSlice", () => ({
  addRelationship: jest.fn((rel: any) => ({ __kind: "addRelationship", rel })),
  updateRelationship: jest.fn((rel: any) => ({ __kind: "updateRelationship", rel })),
}));

// --- Imports after mocks ---
import { renderHook, act, waitFor } from "@testing-library/react";
import { useParentChildBase } from "../useParentChildBase";

const { useAppSelector, useAppDispatch } = require("../../../store") as {
  useAppSelector: jest.Mock;
  useAppDispatch: jest.Mock;
};

const { addIndividual } = require("../../individualsSlice") as {
  addIndividual: jest.Mock;
};

const { addRelationship, updateRelationship } = require("../../relationshipsSlice") as {
  addRelationship: jest.Mock;
  updateRelationship: jest.Mock;
};

describe("useParentChildBase", () => {
  let dispatch: jest.Mock;
  let idCounter = 0;

  const withState = (state: {
    individuals: Array<{ id: string } & any>;
    relationships: Array<{ id: string; type: string } & any>;
  }) => {
    useAppSelector.mockImplementation((selector: any) =>
      selector({
        individuals: { items: state.individuals },
        relationships: { items: state.relationships },
      })
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    idCounter = 0;

    // default state (overridden per-test)
    withState({
      individuals: [],
      relationships: [],
    });

    // mock dispatch returning an RTK-like promise with unwrap()
    dispatch = jest.fn((actionLike: any) => {
      if (actionLike?.__kind === "addIndividual") {
        const created = { id: `gen-${++idCounter}`, ...actionLike.payload };
        return { unwrap: () => Promise.resolve(created) };
      }
      // relationship thunks don't need to return anything specific
      return { unwrap: () => Promise.resolve(undefined) };
    });
    useAppDispatch.mockReturnValue(dispatch);
  });

  test("builds byId map from individuals", () => {
    withState({
      individuals: [{ id: "p1", givenName: "A" }, { id: "c1", givenName: "B" }],
      relationships: [],
    });

    const { result } = renderHook(() => useParentChildBase());
    expect(result.current.byId.get("p1")?.givenName).toBe("A");
    expect(result.current.byId.get("c1")?.givenName).toBe("B");
  });

  test("canLink: true when both exist and not already linked", () => {
    withState({
      individuals: [{ id: "p1" }, { id: "c1" }],
      relationships: [], // no links yet
    });
    const { result } = renderHook(() => useParentChildBase());
    expect(result.current.canLink("p1", "c1")).toBe(true);
  });

  test("canLink: false when same id, missing person, or duplicate", () => {
    // same id
    withState({
      individuals: [{ id: "x" }],
      relationships: [],
    });
    let { result, unmount } = renderHook(() => useParentChildBase());
    expect(result.current.canLink("x", "x")).toBe(false);
    unmount();

    // missing parent
    withState({
      individuals: [{ id: "c1" }],
      relationships: [],
    });
    ({ result, unmount } = renderHook(() => useParentChildBase()));
    expect(result.current.canLink("p1", "c1")).toBe(false);
    unmount();

    // duplicate link
    withState({
      individuals: [{ id: "p1" }, { id: "c1" }],
      relationships: [
        { id: "r1", type: "parent-child", childId: "c1", parentIds: ["p1"] },
      ],
    });
    ({ result } = renderHook(() => useParentChildBase()));
    expect(result.current.canLink("p1", "c1")).toBe(false);
  });

  test("linkParentIntoChild: creates new relation when none exists", async () => {
    withState({
      individuals: [{ id: "p1" }, { id: "c1" }],
      relationships: [],
    });

    const { result } = renderHook(() => useParentChildBase());

    await act(async () => {
      await result.current.linkParentIntoChild("p1", "c1");
    });

    // Should use addRelationship with correct payload
    expect(addRelationship).toHaveBeenCalledTimes(1);
    const relArg = addRelationship.mock.calls[0][0];
    expect(relArg).toMatchObject({
      type: "parent-child",
      parentIds: ["p1"],
      childId: "c1",
    });

    // updateRelationship should not be used in this path
    expect(updateRelationship).not.toHaveBeenCalled();
  });

  test("linkParentIntoChild: merges into existing relation", async () => {
    withState({
      individuals: [{ id: "p2" }, { id: "c1" }],
      relationships: [
        { id: "r1", type: "parent-child", childId: "c1", parentIds: ["p1"] },
      ],
    });

    const { result } = renderHook(() => useParentChildBase());

    await act(async () => {
      await result.current.linkParentIntoChild("p2", "c1");
    });

    // Should use updateRelationship with merged parentIds
    expect(updateRelationship).toHaveBeenCalledTimes(1);
    const updateArg = updateRelationship.mock.calls[0][0];
    expect(updateArg).toMatchObject({
      id: "r1",
      type: "parent-child",
      childId: "c1",
      parentIds: expect.arrayContaining(["p1", "p2"]),
    });

    // addRelationship not used here
    expect(addRelationship).not.toHaveBeenCalled();
  });

  test("linkParentIntoChild: rejects and sets error for invalid link", async () => {
    // Already linked pair
    withState({
      individuals: [{ id: "p1" }, { id: "c1" }],
      relationships: [
        { id: "r1", type: "parent-child", childId: "c1", parentIds: ["p1"] },
      ],
    });

    const { result } = renderHook(() => useParentChildBase());

    await act(async () => {
      await expect(
        result.current.linkParentIntoChild("p1", "c1")
      ).rejects.toThrow(/Ogiltig länk/i);
    });

    expect(addRelationship).not.toHaveBeenCalled();
    expect(updateRelationship).not.toHaveBeenCalled();

    // error should be set (wait for state to flush)
    await waitFor(() => {
      expect(result.current.error).toMatch(/Ogiltig länk/i);
    });        
    
  });

  test("createIndividual: drops incoming id and returns generated id", async () => {
    withState({
      individuals: [],
      relationships: [],
    });

    const { result } = renderHook(() => useParentChildBase());

    let createdId = "";
    await act(async () => {
      createdId = await result.current.createIndividual({
        id: "TEMP",
        givenName: "Ada",
      } as any);
    });

    // Verify we called addIndividual WITHOUT the id property
    expect(addIndividual).toHaveBeenCalledTimes(1);
    const payload = addIndividual.mock.calls[0][0];
    expect(payload).toMatchObject({ givenName: "Ada" });
    expect("id" in payload).toBe(false);

    // And we returned a generated id from dispatch().unwrap()
    expect(createdId).toBe("gen-1");
  });
});