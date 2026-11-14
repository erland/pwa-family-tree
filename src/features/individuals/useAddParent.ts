import { useCallback } from "react";
import type { Individual } from "@core/domain";
import { useParentChildBase } from "./useParentChildBase";

/** Child-centric wrapper API kept intact for callers/tests. */
export function useAddParent() {
  const { loading, error, byId, canLink: canLinkBase, linkParentIntoChild, createIndividual } =
    useParentChildBase();

  // Expect signature (childId, parentId) externally
  const canLink = useCallback(
    (childId: string, parentId: string) => canLinkBase(parentId, childId),
    [canLinkBase]
  );

  const addExistingParent = useCallback(
    async (childId: string, parentId: string) => {
      await linkParentIntoChild(parentId, childId);
    },
    [linkParentIntoChild]
  );

  const addNewParent = useCallback(
    async (childId: string, data: Partial<Individual>) => {
      const parentId = await createIndividual(data);
      await linkParentIntoChild(parentId, childId);
      return parentId;
    },
    [createIndividual, linkParentIntoChild]
  );

  return { loading, error, canLink, addExistingParent, addNewParent, byId };
}