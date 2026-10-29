import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography, Paper, Grid, Stack, Divider } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useDashboardViewModel } from "./useDashboardViewModel";
import { ResetDatabaseButton } from "../../components/ResetDatabaseButton";

export default function DashboardPage() {
  const {
    individualCount, marriageCount, familyCount,
    handleImportExcel, handleImportGedcom,
    handleExportExcel, handleExportGedcom, handleResetDatabase,
  } = useDashboardViewModel();
  const isEmpty = individualCount === 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 3 }}>
      {isEmpty ? (
        <Paper elevation={1} sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
          <AccountTreeIcon color="primary" sx={{ fontSize: 56, mb: 1 }} aria-hidden="true" />
          <Typography variant="h4" component="h1" gutterBottom>
            Börja bygga ditt släktträd
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 540, mx: "auto", mb: 3 }}>
            Lägg till din första person eller importera ett släktträd som du redan har.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button component={RouterLink} to="/individuals" variant="contained" startIcon={<PersonAddIcon />}>
              Lägg till första personen
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportGedcom}>
              Importera GEDCOM
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportExcel}>
              Importera Excel
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>Översikt</Typography>
            <Typography color="text.secondary">Utforska ditt släktträd eller fortsätt arbeta med personer och relationer.</Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { label: "Personer", count: individualCount, icon: <PeopleIcon color="primary" sx={{ fontSize: 34 }} /> },
              { label: "Äktenskap", count: marriageCount, icon: <FavoriteIcon color="error" sx={{ fontSize: 34 }} /> },
              { label: "Familjer", count: familyCount, icon: <FamilyRestroomIcon color="success" sx={{ fontSize: 34 }} /> },
            ].map((item) => (
              <Grid item xs={12} sm={4} key={item.label}>
                <Paper elevation={1} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  {item.icon}
                  <Box>
                    <Typography color="text.secondary" variant="body2">{item.label}</Typography>
                    <Typography variant="h5" fontWeight={600}>{item.count}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={RouterLink} to="/tree" variant="contained" startIcon={<AccountTreeIcon />}>
              Visa släktträdet
            </Button>
            <Button component={RouterLink} to="/individuals" variant="outlined" startIcon={<PeopleIcon />}>
              Hantera personer
            </Button>
          </Stack>
        </>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>Import och export</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Uppgifterna lagras lokalt i din webbläsare. Exportera regelbundet en säkerhetskopia.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
          {!isEmpty && (
            <>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportGedcom}>Importera GEDCOM</Button>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportExcel}>Importera Excel</Button>
            </>
          )}
          {!isEmpty && (
            <>
              <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={handleExportGedcom}>Exportera GEDCOM</Button>
              <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={handleExportExcel}>Exportera Excel</Button>
            </>
          )}
          {isEmpty && <Typography variant="body2" color="text.secondary">Importera ovan, eller skapa en person för att komma igång.</Typography>}
        </Stack>
      </Paper>
      {!isEmpty && (
        <Box sx={{ alignSelf: "flex-start" }}>
          <Divider sx={{ mb: 2 }} />
          <ResetDatabaseButton onConfirm={handleResetDatabase} />
        </Box>
      )}
    </Box>
  );
}
