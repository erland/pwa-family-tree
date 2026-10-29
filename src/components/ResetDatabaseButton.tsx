import React, { useState } from "react";
import { Alert, Button, Checkbox, FormControlLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from "@mui/material";

type Props = {
  onConfirm: () => Promise<void> | void;
  onExport?: () => Promise<void> | void;
  disabled?: boolean;
};

export function ResetDatabaseButton({ onConfirm, onExport, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (working) return;
    setOpen(false);
    setAcknowledged(false);
    setError("");
  };

  const confirm = async () => {
    if (!acknowledged || working) return;
    setWorking(true);
    setError("");
    try {
      await onConfirm();
      closeAfterSuccess();
    } catch {
      setError("Databasen kunde inte rensas. Dina uppgifter kan finnas kvar.");
    } finally {
      setWorking(false);
    }
  };
  const closeAfterSuccess = () => {
    setOpen(false);
    setAcknowledged(false);
  };

  return (
    <>
      <Button variant="outlined" color="error" disabled={disabled} onClick={() => setOpen(true)}>Rensa databas</Button>
      <Dialog open={open} onClose={close} aria-labelledby="reset-dialog-title">
        <DialogTitle id="reset-dialog-title">Radera alla släktuppgifter?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>Alla personer och relationer tas bort permanent från den här webbläsaren. Åtgärden kan inte ångras.</DialogContentText>
            <Alert severity="warning">Exportera en säkerhetskopia innan du fortsätter.</Alert>
            {onExport && <Button variant="outlined" disabled={working} onClick={onExport}>Exportera GEDCOM-säkerhetskopia</Button>}
            <FormControlLabel
              control={<Checkbox checked={acknowledged} disabled={working} onChange={(_, checked) => setAcknowledged(checked)} />}
              label="Jag förstår att uppgifterna raderas permanent."
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={working}>Avbryt</Button>
          <Button color="error" variant="contained" disabled={!acknowledged || working} onClick={confirm}>Radera allt</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
