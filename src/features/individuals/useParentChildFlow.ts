import { useCallback, useMemo } from "react";
import { useAppSelector } from "../../store";
import { Individual, IndividualSchema, canAddParentChild } from "@core/domain";
import { useAddChild } from "./useAddChild";
import { useAddParent } from "./useAddParent";

function normalize(form: Partial<Individual>): Individual {
  // Mirror your current defaulting in both flow files
  return {
    id: "TEMP",
    givenName: form.givenName ?? "",
    birthFamilyName: form.birthFamilyName ?? "",
    familyName: form.familyName ?? "",
    dateOfBirth: form.dateOfBirth ?? "",
    birthRegion: form.birthRegion ?? "",
    birthCongregation: form.birthCongregation ?? "",
    birthCity: form.birthCity ?? "",
    dateOfDeath: form.dateOfDeath ?? "",
    deathRegion: form.deathRegion ?? "",
    deathCongregation: form.deathCongregation ?? "",
    deathCity: form.deathCity ?? "",
    gender: form.gender ?? "unknown",
    story: form.story ?? "",
  } as Individual;
}

export function useParentChildFlow() {
  const relationships = useAppSelector((s) => s.relationships.items);
  const child = useAddChild();
  const parent = useAddParent();

  const loading = child.loading || parent.loading;
  const error = child.error ?? parent.error ?? null;

  const validateNoCycles = useCallback(
    (parentId: string, childId: string) => canAddParentChild(relationships, parentId, childId).ok,
    [relationships]
  );

  /** Link one or more existing parents to a child. */
  const linkExistingParents = useCallback(
    async (childId: string, parentIds: string[]) => {
      for (const pid of parentIds) {
        if (parent.canLink(childId, pid) && validateNoCycles(pid, childId)) {
          await parent.addExistingParent(childId, pid);
        }
      }
    },
    [parent, validateNoCycles]
  );

  /** Create a child and link to one or two parents. */
  const createChildAndLink = useCallback(
    async (primaryParentId: string, form: Partial<Individual>, otherParentId?: string | null) => {
      const parsed = IndividualSchema.safeParse(normalize(form));
      if (!parsed.success) {
        const msg = parsed.error?.issues?.map((i) => i.message).join(", ") || "Ogiltiga fält.";
        throw new Error(msg);
      }
      const childId = await child.addNewChild(primaryParentId, parsed.data);
      if (otherParentId && parent.canLink(childId, otherParentId) && validateNoCycles(otherParentId, childId)) {
        await parent.addExistingParent(childId, otherParentId);
      }
      return childId;
    },
    [child, parent, validateNoCycles]
  );

  /** Create a parent and link to child (plus optional second parent). */
  const createParentAndLink = useCallback(
    async (childId: string, form: Partial<Individual>, withOtherParentId?: string | null) => {
      const parsed = IndividualSchema.safeParse(normalize(form));
      if (!parsed.success) {
        const msg = parsed.error?.issues?.map((i) => i.message).join(", ") || "Ogiltiga fält.";
        throw new Error(msg);
      }
      const parentId = await parent.addNewParent(childId, parsed.data);
      if (withOtherParentId && parent.canLink(childId, withOtherParentId) && validateNoCycles(withOtherParentId, childId)) {
        await parent.addExistingParent(childId, withOtherParentId);
      }
      return parentId;
    },
    [parent, validateNoCycles]
  );

  return { loading, error, linkExistingParents, createChildAndLink, createParentAndLink };
}