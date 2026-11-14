// src/features/individuals/__tests__/useAddChildFlow.test.ts

// --- Mocks must come first ---
jest.mock("../useParentChildFlow", () => ({
  useParentChildFlow: jest.fn(),
}));

// --- Imports after mocks ---
import { renderHook } from "@testing-library/react";
import { useAddChildFlow } from "../useAddChildFlow";

const { useParentChildFlow } = require("../useParentChildFlow") as {
  useParentChildFlow: jest.Mock;
};

describe("useAddChildFlow (thin wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exposes loading and error from parent-child flow", () => {
    const linkExistingParents = jest.fn();
    const createChildAndLink = jest.fn();

    useParentChildFlow.mockReturnValue({
      loading: true,
      error: "boom",
      linkExistingParents,
      createChildAndLink,
    });

    const { result } = renderHook(() => useAddChildFlow());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("boom");
  });

  test("linkExisting delegates to linkExistingParents(childId, parentIds)", async () => {
    const linkExistingParents = jest.fn().mockResolvedValue(undefined);
    const createChildAndLink = jest.fn();

    useParentChildFlow.mockReturnValue({
      loading: false,
      error: null,
      linkExistingParents,
      createChildAndLink,
    });

    const { result } = renderHook(() => useAddChildFlow());

    await result.current.linkExisting({ parentIds: ["p1", "p2"], childId: "c1" });

    expect(linkExistingParents).toHaveBeenCalledTimes(1);
    expect(linkExistingParents).toHaveBeenCalledWith("c1", ["p1", "p2"]);
  });

  test("createAndLink delegates to createChildAndLink(primaryParentId, form, otherParentId)", async () => {
    const linkExistingParents = jest.fn();
    const createChildAndLink = jest.fn().mockResolvedValue("child-123");

    useParentChildFlow.mockReturnValue({
      loading: false,
      error: null,
      linkExistingParents,
      createChildAndLink,
    });

    const { result } = renderHook(() => useAddChildFlow());

    const id = await result.current.createAndLink({
      primaryParentId: "p1",
      otherParentId: "p2",
      form: { givenName: "Ada" },
    });

    expect(createChildAndLink).toHaveBeenCalledTimes(1);
    expect(createChildAndLink).toHaveBeenCalledWith("p1", { givenName: "Ada" }, "p2");
    expect(id).toBe("child-123");
  });

  test("returns memoized callbacks while deps are stable", () => {
    const linkExistingParents = jest.fn();
    const createChildAndLink = jest.fn();

    // First render with refs A
    useParentChildFlow
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents,
        createChildAndLink,
      })
      // Second render with the SAME refs (deps unchanged)
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents,
        createChildAndLink,
      });

    const { result, rerender } = renderHook(() => useAddChildFlow());

    const first_linkExisting = result.current.linkExisting;
    const first_createAndLink = result.current.createAndLink;

    rerender();

    expect(result.current.linkExisting).toBe(first_linkExisting);
    expect(result.current.createAndLink).toBe(first_createAndLink);
  });

  test("produces new memoized callbacks when deps change", () => {
    const linkExistingParents_v1 = jest.fn();
    const createChildAndLink_v1 = jest.fn();

    const linkExistingParents_v2 = jest.fn();
    const createChildAndLink_v2 = jest.fn();

    useParentChildFlow
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents: linkExistingParents_v1,
        createChildAndLink: createChildAndLink_v1,
      })
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents: linkExistingParents_v2, // changed dep
        createChildAndLink: createChildAndLink_v2, // changed dep
      });

    const { result, rerender } = renderHook(() => useAddChildFlow());

    const first_linkExisting = result.current.linkExisting;
    const first_createAndLink = result.current.createAndLink;

    rerender();

    expect(result.current.linkExisting).not.toBe(first_linkExisting);
    expect(result.current.createAndLink).not.toBe(first_createAndLink);
  });
});