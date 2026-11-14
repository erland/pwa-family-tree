import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { addIndividual } from "../individualsSlice";
import { addRelationship, updateRelationship } from "../relationshipsSlice";
import type { Individual } from "@core/domain";
import type { Relationship } from "@core/domain";

type ParentChildRel = Extract<Relationship, { type: "parent-child" }>;
const isParentChild = (r: Relationship): r is ParentChildRel => r.type === "parent-child";

export function useParentChildBase() {
  const dispatch = useAppDispatch();
  const individuals = useAppSelector((s) => s.individuals.items);
  const relationships = useAppSelector((s) => s.relationships.items);

  const individualsRef = useRef(individuals);
  const relationshipsRef = useRef(relationships);
  useEffect(() => void (individualsRef.current = individuals), [individuals]);
  useEffect(() => void (relationshipsRef.current = relationships), [relationships]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Individual>();
    for (const i of individuals) m.set(i.id, i);
    return m;
  }, [individuals]);

  const alreadyLinked = useCallback((parentId: string, childId: string) => {
    const rels = relationshipsRef.current;
    return rels.some(
      (r): r is ParentChildRel =>
        isParentChild(r) && r.childId === childId && (r.parentIds ?? []).includes(parentId)
    );
  }, []);

  /** Canonical link guard: parentId≠childId, both exist, not already linked */
  const canLink = useCallback(
    (parentId: string, childId: string) => {
      if (!parentId || !childId || parentId === childId) return false;
      const p = individualsRef.current.find((i) => i.id === parentId);
      const c = individualsRef.current.find((i) => i.id === childId);
      if (!p || !c) return false;
      return !alreadyLinked(parentId, childId);
    },
    [alreadyLinked]
  );

  /** Merge a single parent into child’s relation (create if none). */
  const linkParentIntoChild = useCallback(
    async (parentId: string, childId: string) => {
      setError(null);
      setLoading(true);
      try {
        // Guard: both must exist and must NOT be already linked
        if (!canLink(parentId, childId)) {
          const msg = "Ogiltig länk: saknad person eller redan länkad.";
          setError(msg);
          throw new Error(msg);
        }
        const rels = relationshipsRef.current;
        const existing = rels.find(
          (r): r is ParentChildRel => isParentChild(r) && r.childId === childId
        );
        if (existing) {
          const merged = Array.from(new Set([...(existing.parentIds ?? []), parentId]));
          await dispatch(updateRelationship({ ...existing, parentIds: merged } as Relationship)).unwrap();
        } else {
          await dispatch(
            addRelationship({ type: "parent-child", parentIds: [parentId], childId } as Relationship)
          ).unwrap();
        }
      } catch (e: any) {
        setError(e?.message ?? "Kunde inte länka relationen.");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  /** Create a new Individual and return its id. */
  const createIndividual = useCallback(
    async (data: Partial<Individual>) => {
      setError(null);
      setLoading(true);
      try {
        // ensure slice generates a real id
        // (drop any incoming id e.g., "TEMP")
        const { id: _drop, ...payload } = (data || {}) as any;
        const created = await dispatch(addIndividual(payload)).unwrap();
        return created.id as string;
      } catch (e: any) {
        setError(e?.message ?? "Kunde inte skapa personen.");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  return { loading, error, byId, canLink, linkParentIntoChild, createIndividual };
}