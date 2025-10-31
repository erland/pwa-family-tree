import { useMemo } from "react";
import { useParentChildFlow } from "./useParentChildFlow";

export function useAddChildFlow() {
  const { loading, error, linkExistingParents, createChildAndLink } = useParentChildFlow();
  return useMemo(
    () => ({
      loading,
      error,
      linkExisting: ({ parentIds, childId }: { parentIds: string[]; childId: string }) =>
        linkExistingParents(childId, parentIds),
      createAndLink: ({
        primaryParentId,
        otherParentId,
        form,
      }: {
        primaryParentId: string;
        otherParentId?: string | null;
        form: any;
      }) => createChildAndLink(primaryParentId, form, otherParentId),
    }),
    [loading, error, linkExistingParents, createChildAndLink]
  );
}