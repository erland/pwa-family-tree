// src/features/ages/AgesPage.tsx

import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAppSelector } from "../../store";
import { Individual } from "@core/domain";

import { useAgeStats } from "./useAgeStats";
import { AgeStatsSummary } from "./AgeStatsSummary";
import { AgeHistogram } from "./AgeHistogram";
import { AgeBucketPeopleList } from "./AgeBucketPeopleList";
import { peopleInAgeRange } from "./logic";

// Reuse your existing dialogs/components
import IndividualDetails from "../individuals/IndividualDetails";
import IndividualFormDialog from "../individuals/IndividualFormDialog";

export default function AgesPage() {
  // Pull all individuals
  const individuals = useAppSelector(
    (s) => s.individuals.items
  ) as Individual[];

  // Local UI state
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(
    null
  );
  const [showUnknown, setShowUnknown] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Individual | null>(null);

  const [genderFilter, setGenderFilter] = useState<
    "all" | "male" | "female"
  >("all");

  // Form/dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Individual | null>(null);

  const handleOpenForm = (ind?: Individual) => {
    setEditing(ind || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  // Compute stats for chart + avg/median/etc.
  const { ageData, average, median } = useAgeStats(individuals, genderFilter);

  // Derive which people to show for the currently selected bin (pure helper)
  const peopleInRange = useMemo(
    () =>
      peopleInAgeRange(
        individuals,
        selectedRange,
        showUnknown,
        genderFilter
      ),
    [individuals, selectedRange, showUnknown, genderFilter]
  );
  
  // handle clicks from histogram
  const handleSelectRange = (range: [number, number] | "unknown") => {
    if (range === "unknown") {
      setShowUnknown(true);
      setSelectedRange(null);
    } else {
      setSelectedRange(range);
      setShowUnknown(false);
    }
    setSelectedPerson(null);
  };

  return (
    <Box sx={{ display: "flex", height: "100%", p: 2, position: "relative" }}>
      {/* Left side: chart + list */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "margin-right 0.3s ease, width 0.3s ease",
          mr: selectedPerson ? "300px" : 0,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Åldersfördelning
        </Typography>

        <AgeStatsSummary
          genderFilter={genderFilter}
          onChangeGender={setGenderFilter}
          average={average}
          median={median}
        />

        <AgeHistogram
          ageData={ageData}
          genderFilter={genderFilter}
          onSelectRange={handleSelectRange}
        />

        <AgeBucketPeopleList
          showUnknown={showUnknown}
          selectedRange={selectedRange}
          peopleInRange={peopleInRange}
          selectedPerson={selectedPerson}
          onSelectPerson={(ind) => {
            setSelectedPerson(ind);
          }}
        />
      </Box>

      {/* Right-side details panel */}
      {selectedPerson && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 300,
            borderLeft: "1px solid #ddd",
            p: 2,
            bgcolor: "#fafafa",
            overflowY: "auto",
            zIndex: 2,
          }}
        >
          <IndividualDetails
            individualId={selectedPerson.id}
            onClose={() => setSelectedPerson(null)}
            onEdit={(ind) => handleOpenForm(ind)}
          />
        </Box>
      )}

      {/* Edit dialog */}
      <IndividualFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        individual={editing}
      />
    </Box>
  );
}