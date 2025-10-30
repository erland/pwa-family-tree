import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Autocomplete,
  Typography,
  Chip,
} from "@mui/material";
import { useAppSelector } from "../../store";
import { Individual, Relationship } from "@core/domain";
import { fullName } from "@core/domain";
import IndividualFormFields from "./IndividualFormFields";
import { useAddChildFlow } from "./useAddChildFlow";
import { useAddParentFlow } from "./useAddParentFlow";

type BaseProps = {
  open: boolean;
  onClose: () => void;
};

type AddChildVariant = BaseProps & {
  variant: "add-child";
  parentId: string;
};

type AddParentVariant = BaseProps & {
  variant: "add-parent";
  childId: string;
};

type Props = AddChildVariant | AddParentVariant;

export default function AddRelationDialog(props: Props) {
  const { open, onClose } = props;
  const individuals = useAppSelector((s) => s.individuals.items);
  const relationships = useAppSelector((s) => s.relationships.items);

  // Call both hooks (stable order), use the one we need.
  const childFlow = useAddChildFlow();
  const parentFlow = useAddParentFlow();
  const variant = props.variant;

  const contextPerson = useMemo(() => {
    if (variant === "add-child") {
      return individuals.find((i) => i.id === props.parentId) || null;
    } else {
      return individuals.find((i) => i.id === props.childId) || null;
    }
  }, [variant, individuals, (props as any).parentId, (props as any).childId]);

  const titles = variant === "add-parent"
    ? {
        dialogTitle: "Lägg till förälder",
        contextLabel: "Barn",
        toggleNew: "Skapa ny förälder",
        toggleExisting: "Koppla befintlig förälder",
        existingSelectLabel: "Förälder (befintlig person)",
        otherParentLabel: "Andra förälder (valfritt)",
      }
    : {
        dialogTitle: "Lägg till barn",
        contextLabel: "Förälder",
        toggleNew: "Skapa nytt barn",
        toggleExisting: "Koppla befintligt barn",
        existingSelectLabel: "Barn (befintlig person)",
        otherParentLabel: "Andra föräldern (valfritt)",
      };

  // For add-parent: show existing parents & use first as default “other parent”
  const existingParents: Individual[] = useMemo(() => {
    if (variant !== "add-parent") return [];
    const childId = (props as AddParentVariant).childId;
    const rels = relationships.filter(
      (r: Relationship) => r.type === "parent-child" && r.childId === childId
    );
    const pids = Array.from(new Set(rels.flatMap((r) => r.parentIds)));
    return pids
      .map((pid) => individuals.find((i) => i.id === pid))
      .filter(Boolean) as Individual[];
  }, [variant, relationships, individuals, (props as any).childId]);

  // Shared UI state
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);
  const [otherParentId, setOtherParentId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Individual>>({ gender: "unknown" });

  const existingOptions: Individual[] = useMemo(() => {
    if (variant === "add-parent") {
      const childId = (props as AddParentVariant).childId;
      return individuals.filter((i) => i.id !== childId);
    }
    // add-child: allow any person as existing child (matches current behavior)
    return individuals;
  }, [variant, individuals, (props as any).childId]);

  const otherParentOptions: Individual[] = useMemo(() => {
    if (variant === "add-child") {
      const parentId = (props as AddChildVariant).parentId;
      return individuals.filter((i) => i.id !== parentId);
    }
    const childId = (props as AddParentVariant).childId;
    return individuals.filter((i) => i.id !== childId);
  }, [variant, individuals, (props as any).parentId, (props as any).childId]);

  const { loading, error } = variant === "add-child" ? childFlow : parentFlow;

  const reset = () => {
    setMode("new");
    setSelectedExistingId(null);
    setForm({ gender: "unknown" });
    if (variant === "add-parent") {
      setOtherParentId(existingParents[0]?.id ?? null);
    } else {
      setOtherParentId(null);
    }
  };

  const handleSave = async () => {
    try {
      if (mode === "existing") {
        if (!selectedExistingId) {
          alert(
            variant === "add-parent"
              ? "Välj en befintlig förälder."
              : "Välj ett befintligt barn."
          );
          return;
        }
        if (variant === "add-child") {
          const parentId = (props as AddChildVariant).parentId;
          const parentIds = Array.from(
            new Set([parentId, otherParentId || undefined].filter(Boolean) as string[])
          );
          await childFlow.linkExisting({ parentIds, childId: selectedExistingId });
        } else {
          const childId = (props as AddParentVariant).childId;
          const parentIds = Array.from(
            new Set([selectedExistingId, otherParentId || undefined].filter(Boolean) as string[])
          );
          await parentFlow.linkExisting({ childId, parentIds });
        }
      } else {
        if (variant === "add-child") {
          const parentId = (props as AddChildVariant).parentId;
          await childFlow.createAndLink({
            primaryParentId: parentId,
            otherParentId,
            form,
          });
        } else {
          const childId = (props as AddParentVariant).childId;
          await parentFlow.createAndLink({
            childId,
            withOtherParentId: otherParentId,
            form,
          });
        }
      }
      reset();
      onClose();
    } catch (e: any) {
      if (e?.message) alert(e.message);
    }
  };

  React.useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{titles.dialogTitle}</DialogTitle>
      <DialogContent>
        {contextPerson && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {titles.contextLabel}: <strong>{fullName(contextPerson)}</strong>
          </Typography>
        )}

        {variant === "add-parent" && existingParents.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Nuvarande registrerade föräldrar:
            </Typography>
            {existingParents.map((p) => (
              <Chip key={p.id} label={fullName(p)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="new">{titles.toggleNew}</ToggleButton>
          <ToggleButton value="existing">{titles.toggleExisting}</ToggleButton>
        </ToggleButtonGroup>

        {mode === "existing" ? (
          <Autocomplete
            options={existingOptions}
            value={existingOptions.find((i) => i.id === selectedExistingId) ?? null}
            onChange={(_, v) => setSelectedExistingId(v?.id ?? null)}
            getOptionLabel={(o) => fullName(o)}
            renderInput={(p) => <TextField {...p} label={titles.existingSelectLabel} />}
            sx={{ mb: 2 }}
          />
        ) : (
          <Box sx={{ mb: 2 }}>
            <IndividualFormFields value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
          </Box>
        )}

        <Autocomplete
          options={otherParentOptions}
          value={individuals.find((i) => i.id === otherParentId) ?? null}
          onChange={(_, v) => setOtherParentId(v?.id ?? null)}
          getOptionLabel={(o) => fullName(o)}
          renderInput={(p) => <TextField {...p} label={titles.otherParentLabel} />}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            reset();
            onClose();
          }}
          disabled={loading}
        >
          Avbryt
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {mode === "new" ? "Skapa & länka" : "Länka"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}