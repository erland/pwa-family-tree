// src/features/ages/__tests__/logic.test.ts
import { peopleInAgeRange } from "../logic";
import type { Individual } from "@core/domain";

const mk = (p: Partial<Individual>): Individual =>
  ({ id: "x", firstName: "A", lastName: "B", ...p } as any);

test("filters by years and gender", () => {
  const people = [
    mk({ dateOfBirth: "1900-01-01", dateOfDeath: "1970-01-01", gender: "male" }),
    mk({ dateOfBirth: "1900-01-01", dateOfDeath: "1985-01-01", gender: "female" }),
    mk({ dateOfBirth: undefined, dateOfDeath: "1950-01-01", gender: "male" }),
  ];
  const res = peopleInAgeRange(people, [80, 89], false, "all");
  expect(res.map(p => p.gender)).toEqual(["female"]);
});