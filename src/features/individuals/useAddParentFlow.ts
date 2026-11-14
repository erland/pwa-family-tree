import { useMemo } from "react";
import { useParentChildFlow } from "./useParentChildFlow";

export function useAddParentFlow() {
  const { loading, error, linkExistingParents, createParentAndLink } = useParentChildFlow();
  return useMemo(
    () => ({
      loading,
      error,
      linkExisting: ({ childId, parentIds }: { childId: string; parentIds: string[] }) =>
        linkExistingParents(childId, parentIds),
      createAndLink: ({
        childId,
        withOtherParentId,
        form,
      }: {
        childId: string;
        withOtherParentId?: string | null;
        form: any;
      }) => createParentAndLink(childId, form, withOtherParentId),
    }),
    [loading, error, linkExistingParents, createParentAndLink]
  );
}