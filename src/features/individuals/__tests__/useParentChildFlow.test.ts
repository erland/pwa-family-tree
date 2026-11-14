// src/features/individuals/__tests__/useParentChildFlow.test.ts

// --- Mocks must come first ---
jest.mock("../../../store", () => ({
  useAppSelector: jest.fn(),
  // not used directly here, but keeping parity with other tests
  useAppDispatch: jest.fn(() => jest.fn()),
}));

// Inner hooks used by the flow — we fully mock both so no real base logic runs
jest.mock("../useAddChild", () => ({
  useAddChild: jest.fn(),
}));
jest.mock("../useAddParent", () => ({
  useAddParent: jest.fn(),
}));

// Keep REAL types/exports but override canAddParentChild only.
// We'll spy on IndividualSchema.safeParse later.
jest.mock("@core/domain", () => {
  const actual = jest.requireActual("@core/domain");
  return {
    ...actual,
    canAddParentChild: jest.fn(actual.canAddParentChild),
  };
});

// --- Imports after mocks ---
import { renderHook, act } from "@testing-library/react";
import { useParentChildFlow } from "../useParentChildFlow";

// Mocks we declared above
const { useAppSelector } = require("../../../store") as {
  useAppSelector: jest.Mock;
};

const { useAddChild } = require("../useAddChild") as {
  useAddChild: jest.Mock;
};
const { useAddParent } = require("../useAddParent") as {
  useAddParent: jest.Mock;
};

// Access the partially mocked core module
const core = require("@core/domain") as typeof import("@core/domain");
const canAddParentChild = core.canAddParentChild as unknown as jest.Mock;

describe("useParentChildFlow", () => {
  let safeParseSpy: jest.SpyInstance;

  // child-hook stubs
  let child_addExistingChild: jest.Mock;
  let child_addNewChild: jest.Mock;
  let child_canLink: jest.Mock;

  // parent-hook stubs
  let parent_addExistingParent: jest.Mock;
  let parent_addNewParent: jest.Mock;
  let parent_canLink: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // default Redux selector state (relationships only used by validateNoCycles)
    const relationships = [
      { id: "r1", type: "parent-child", parentIds: ["pA"], childId: "cA" },
    ];
    useAppSelector.mockImplementation((selector: any) =>
      selector({
        relationships: { items: relationships },
        individuals: { items: [] },
      })
    );

    // canAddParentChild OK by default
    canAddParentChild.mockReturnValue({ ok: true });

    // spy on REAL schema
    if (safeParseSpy) safeParseSpy.mockRestore();
    safeParseSpy = jest.spyOn(core.IndividualSchema, "safeParse");
    safeParseSpy.mockReturnValue({
      success: true,
      data: {
        // data after normalize() — we only assert a couple of fields
        id: "TEMP",
        givenName: "New",
        birthFamilyName: "",
        familyName: "",
        dateOfBirth: "",
        birthRegion: "",
        birthCongregation: "",
        birthCity: "",
        dateOfDeath: "",
        deathRegion: "",
        deathCongregation: "",
        deathCity: "",
        gender: "unknown",
        story: "",
      },
    });

    // Child hook defaults
    child_addExistingChild = jest.fn().mockResolvedValue(undefined);
    child_addNewChild = jest.fn().mockResolvedValue("child-1");
    child_canLink = jest.fn().mockReturnValue(true);

    useAddChild.mockReturnValue({
      loading: false,
      error: null,
      canLink: child_canLink,
      addExistingChild: child_addExistingChild,
      addNewChild: child_addNewChild,
    });

    // Parent hook defaults
    parent_addExistingParent = jest.fn().mockResolvedValue(undefined);
    parent_addNewParent = jest.fn().mockResolvedValue("parent-1");
    parent_canLink = jest.fn().mockReturnValue(true);

    useAddParent.mockReturnValue({
      loading: false,
      error: null,
      canLink: parent_canLink,
      addExistingParent: parent_addExistingParent,
      addNewParent: parent_addNewParent,
    });
  });

  test("aggregates loading and error from child & parent hooks", () => {
    // child.loading true, parent.loading false → aggregated loading true
    useAddChild.mockReturnValueOnce({
      loading: true,
      error: null,
      canLink: child_canLink,
      addExistingChild: child_addExistingChild,
      addNewChild: child_addNewChild,
    });
    // parent.error wins if child.error is null
    useAddParent.mockReturnValueOnce({
      loading: false,
      error: "Parent error",
      canLink: parent_canLink,
      addExistingParent: parent_addExistingParent,
      addNewParent: parent_addNewParent,
    });

    const { result } = renderHook(() => useParentChildFlow());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("Parent error");
  });

  test("linkExistingParents links only those that pass canLink and cycle check", async () => {
    // allow p1, block p2 via canLink
    parent_canLink.mockImplementation((_childId: string, parentId: string) => parentId === "p1");
    // also ensure cycle check would pass for p1 and fail for p2 (double gate)
    canAddParentChild.mockImplementation((_rels: any, pid: string) =>
      pid === "p1" ? { ok: true } : { ok: false }
    );

    const { result } = renderHook(() => useParentChildFlow());

    await act(async () => {
      await result.current.linkExistingParents("c1", ["p1", "p2"]);
    });

    expect(parent_addExistingParent).toHaveBeenCalledTimes(1);
    expect(parent_addExistingParent).toHaveBeenCalledWith("c1", "p1");
  });

  test("createChildAndLink: creates child and links second parent when allowed", async () => {
    // Second parent passes canLink and cycle checks
    parent_canLink.mockImplementation((_childId: string, parentId: string) => parentId !== "skip");
    canAddParentChild.mockImplementation((_rels: any, pid: string) =>
      pid === "p2" ? { ok: true } : { ok: true }
    );

    const { result } = renderHook(() => useParentChildFlow());

    await act(async () => {
      const id = await result.current.createChildAndLink("p1", { givenName: "Neo" }, "p2");
      expect(id).toBe("child-1");
    });

    // schema consulted
    expect(safeParseSpy).toHaveBeenCalled();

    // child created with normalized payload
    expect(child_addNewChild).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ givenName: "New" }) // because normalize() fills defaults and safeParseSpy returns "New"
    );

    // and second parent linked to returned child
    expect(parent_addExistingParent).toHaveBeenCalledWith("child-1", "p2");
  });

  test("createChildAndLink: no second parent when not provided or not allowed", async () => {
    parent_canLink.mockReturnValue(false); // block link
    const { result } = renderHook(() => useParentChildFlow());

    await act(async () => {
      await result.current.createChildAndLink("p1", { givenName: "Only" });
    });

    expect(child_addNewChild).toHaveBeenCalledTimes(1);
    expect(parent_addExistingParent).not.toHaveBeenCalled();
  });

  test("createChildAndLink: throws when schema validation fails", async () => {
    safeParseSpy.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Bad form" }] },
    } as any);

    const { result } = renderHook(() => useParentChildFlow());

    await expect(
      act(async () => {
        await result.current.createChildAndLink("p1", {});
      })
    ).rejects.toThrow(/Bad form|Ogiltiga fält/i);

    expect(child_addNewChild).not.toHaveBeenCalled();
    expect(parent_addExistingParent).not.toHaveBeenCalled();
  });

  test("createParentAndLink: creates parent and links optional other parent when allowed", async () => {
    // Allow linking to p2 as "other parent"
    parent_canLink.mockImplementation((_childId: string, pid: string) => pid !== "skip");
    canAddParentChild.mockImplementation((_rels: any, pid: string) =>
      pid === "p2" ? { ok: true } : { ok: true }
    );

    const { result } = renderHook(() => useParentChildFlow());

    await act(async () => {
      const pid = await result.current.createParentAndLink("c1", { givenName: "New P" }, "p2");
      expect(pid).toBe("parent-1");
    });

    expect(safeParseSpy).toHaveBeenCalled();
    expect(parent_addNewParent).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ givenName: "New" }) // normalized then parsed to "New"
    );
    expect(parent_addExistingParent).toHaveBeenCalledWith("c1", "p2");
  });

  test("createParentAndLink: throws when schema fails (no creation)", async () => {
    safeParseSpy.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Invalid" }] },
    } as any);

    const { result } = renderHook(() => useParentChildFlow());

    await expect(
      act(async () => {
        await result.current.createParentAndLink("c1", {});
      })
    ).rejects.toThrow(/Invalid|Ogiltiga fält/i);

    expect(parent_addNewParent).not.toHaveBeenCalled();
    expect(parent_addExistingParent).not.toHaveBeenCalled();
  });
});