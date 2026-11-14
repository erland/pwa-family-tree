// src/features/ages/logic.ts
import { Individual, ageInYears } from "@core/domain";
import { genderMatchesFilter } from "./genderUtils";

export function peopleInAgeRange(
  individuals: Individual[],
  selectedRange: [number, number] | null,
  showUnknown: boolean,
  genderFilter: "all" | "male" | "female"
): Individual[] {
  if (showUnknown) {
    return individuals.filter(
      (ind) =>
        (!ind.dateOfBirth || !ind.dateOfDeath) &&
        genderMatchesFilter(ind.gender || "", genderFilter)
    );
  }

  if (!selectedRange) return [];

  const [min, max] = selectedRange;
  return individuals.filter((ind) => {
    if (!ind.dateOfBirth || !ind.dateOfDeath) return false;
    const years = ageInYears(ind.dateOfBirth, ind.dateOfDeath);
    if (years == null) return false;
    return (
      years >= min &&
      years <= max &&
      genderMatchesFilter(ind.gender || "", genderFilter)
    );
  });
}