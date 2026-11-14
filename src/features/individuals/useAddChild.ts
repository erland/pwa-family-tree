import { useCallback } from "react";
import type { Individual } from "@core/domain";
import { useParentChildBase } from "./useParentChildBase";

/** Parent-centric wrapper API kept intact for callers/tests. */
export function useAddChild() {
  const { loading, error, byId, canLink, linkParentIntoChild, createIndividual } =
    useParentChildBase();

  const addExistingChild = useCallback(
    async (parentId: string, childId: string) => {
      await linkParentIntoChild(parentId, childId);
    },
    [linkParentIntoChild]
  );

  const addNewChild = useCallback(
    async (parentId: string, data: Partial<Individual>) => {
      const childId = await createIndividual(data);
      await linkParentIntoChild(parentId, childId);
      return childId;
    },
    [createIndividual, linkParentIntoChild]
  );

  return { loading, error, canLink, addExistingChild, addNewChild, byId };
}