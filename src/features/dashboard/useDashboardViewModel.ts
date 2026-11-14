// src/hooks/useDashboardViewModel.ts
import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchIndividuals,
  clearIndividuals,
} from "../../features/individualsSlice";
import {
  fetchRelationships,
  clearRelationships,
} from "../../features/relationshipsSlice";
import type { Individual, Relationship } from "@core/domain";
import { buildDashboardStats } from "@core/viewModelBuilders/dashboard";

export function useDashboardViewModel() {
  const dispatch = useAppDispatch();

  // Raw data from store
  const individuals = useAppSelector(
    (s) => s.individuals.items
  ) as Individual[];

  const relationships = useAppSelector(
    (s) => s.relationships.items
  ) as Relationship[];

  // Derived counts (pure domain -> UI stats, now moved to builder)
  const { individualCount, marriageCount, familyCount } = useMemo(() => {
    return buildDashboardStats(individuals, relationships);
  }, [individuals, relationships]);

  const [notice, setNotice] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const runOperation = useCallback(async (
    operation: () => Promise<any>,
    successMessage: (result: any) => string,
    afterSuccess?: () => Promise<void>
  ) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await operation();
      // Cancelling a file picker is not an error.
      if (result == null) return;
      if (result.success === false) throw new Error("Åtgärden kunde inte slutföras.");
      if (afterSuccess) await afterSuccess();
      setNotice({ message: successMessage(result), severity: "success" });
    } catch (error) {
      setNotice({
        message: error instanceof Error && error.message
          ? `Åtgärden misslyckades: ${error.message}`
          : "Åtgärden misslyckades. Försök igen.",
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const refresh = useCallback(async () => {
    await dispatch(fetchIndividuals());
    await dispatch(fetchRelationships());
  }, [dispatch]);

  const handleImportExcel = useCallback(() => runOperation(
    () => (window as any).api.importExcel(),
    (result) => `Importerade ${result.count} personer och ${result.relCount} relationer.`,
    refresh
  ), [runOperation, refresh]);

  const handleImportGedcom = useCallback(() => runOperation(
    () => (window as any).api.importGedcom(),
    (result) => `Importerade ${result.count} personer och ${result.relCount} relationer.`,
    refresh
  ), [runOperation, refresh]);

  const handleExportExcel = useCallback(() => runOperation(
    () => (window as any).api.exportIndividualsExcel(),
    () => "Excel-export klar!"
  ), [runOperation]);

  const handleExportGedcom = useCallback(() => runOperation(
    () => (window as any).api.exportGedcom(),
    () => "GEDCOM-export klar!"
  ), [runOperation]);

  // DB RESET helper (used by ResetDatabaseButton)
  const handleResetDatabase = useCallback(async () => {
    // The preload should expose a resetDatabase() that clears persistence.
    await (window as any).api.resetDatabase?.();

    // Clear redux state
    dispatch(clearIndividuals());
    dispatch(clearRelationships());

    // Force a full UI reload to ensure everything reflects empty state
    window.location.reload();
  }, [dispatch]);

  return {
    notice, busy, dismissNotice,
    // stats for UI
    individualCount,
    marriageCount,
    familyCount,

    // actions for UI
    handleImportExcel,
    handleImportGedcom,
    handleExportExcel,
    handleExportGedcom,
    handleResetDatabase,
  };
}