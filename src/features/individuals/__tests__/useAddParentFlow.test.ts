// src/features/individuals/__tests__/useAddParentFlow.test.ts

// --- Mocks must come first ---
jest.mock("../useParentChildFlow", () => ({
  useParentChildFlow: jest.fn(),
}));

// --- Imports after mocks ---
import { renderHook } from "@testing-library/react";
import { useAddParentFlow } from "../useAddParentFlow";

const { useParentChildFlow } = require("../useParentChildFlow") as {
  useParentChildFlow: jest.Mock;
};

describe("useAddParentFlow (thin wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exposes loading and error from parent-child flow", () => {
    const linkExistingParents = jest.fn();
    const createParentAndLink = jest.fn();

    useParentChildFlow.mockReturnValue({
      loading: true,
      error: "boom",
      linkExistingParents,
      createParentAndLink,
    });

    const { result } = renderHook(() => useAddParentFlow());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("boom");
  });

  test("linkExisting delegates to linkExistingParents with correct args", async () => {
    const linkExistingParents = jest.fn().mockResolvedValue(undefined);
    const createParentAndLink = jest.fn();

    useParentChildFlow.mockReturnValue({
      loading: false,
      error: null,
      linkExistingParents,
      createParentAndLink,
    });

    const { result } = renderHook(() => useAddParentFlow());

    await result.current.linkExisting({ childId: "c1", parentIds: ["p1", "p2"] });

    expect(linkExistingParents).toHaveBeenCalledTimes(1);
    expect(linkExistingParents).toHaveBeenCalledWith("c1", ["p1", "p2"]);
  });

  test("createAndLink delegates to createParentAndLink with correct arg order", async () => {
    const linkExistingParents = jest.fn();
    const createParentAndLink = jest.fn().mockResolvedValue("parent-123");

    useParentChildFlow.mockReturnValue({
      loading: false,
      error: null,
      linkExistingParents,
      createParentAndLink,
    });

    const { result } = renderHook(() => useAddParentFlow());

    const id = await result.current.createAndLink({
      childId: "c1",
      withOtherParentId: "p2",
      form: { givenName: "Ada" },
    });

    expect(createParentAndLink).toHaveBeenCalledTimes(1);
    expect(createParentAndLink).toHaveBeenCalledWith("c1", { givenName: "Ada" }, "p2");
    expect(id).toBe("parent-123");
  });

  test("returns memoized callbacks while deps are stable", () => {
    const linkExistingParents = jest.fn();
    const createParentAndLink = jest.fn();

    // First render returns these exact function references
    useParentChildFlow
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents,
        createParentAndLink,
      })
      // Second render returns the SAME references (deps unchanged)
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents,
        createParentAndLink,
      });

    const { result, rerender } = renderHook(() => useAddParentFlow());

    const first_linkExisting = result.current.linkExisting;
    const first_createAndLink = result.current.createAndLink;

    rerender();

    expect(result.current.linkExisting).toBe(first_linkExisting);
    expect(result.current.createAndLink).toBe(first_createAndLink);
  });

  test("produces new memoized callbacks when deps change", () => {
    const linkExistingParents_v1 = jest.fn();
    const createParentAndLink_v1 = jest.fn();

    const linkExistingParents_v2 = jest.fn();
    const createParentAndLink_v2 = jest.fn();

    useParentChildFlow
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents: linkExistingParents_v1,
        createParentAndLink: createParentAndLink_v1,
      })
      .mockReturnValueOnce({
        loading: false,
        error: null,
        linkExistingParents: linkExistingParents_v2, // changed dep
        createParentAndLink: createParentAndLink_v2, // changed dep
      });

    const { result, rerender } = renderHook(() => useAddParentFlow());

    const first_linkExisting = result.current.linkExisting;
    const first_createAndLink = result.current.createAndLink;

    rerender();

    expect(result.current.linkExisting).not.toBe(first_linkExisting);
    expect(result.current.createAndLink).not.toBe(first_createAndLink);
  });
});