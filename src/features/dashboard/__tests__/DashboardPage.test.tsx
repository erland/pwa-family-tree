import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../DashboardPage";

jest.mock("../useDashboardViewModel", () => ({
  useDashboardViewModel: jest.fn(),
}));
const useDashboardViewModel = require("../useDashboardViewModel").useDashboardViewModel as jest.Mock;

const handlers = {
  handleImportExcel: jest.fn(),
  handleImportGedcom: jest.fn(),
  handleExportExcel: jest.fn(),
  handleExportGedcom: jest.fn(),
  handleResetDatabase: jest.fn(),
};
function showDashboard(count: number) {
  useDashboardViewModel.mockReturnValue({
    individualCount: count,
    marriageCount: count ? 2 : 0,
    familyCount: count ? 3 : 0,
    ...handlers,
  });
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

describe("Dashboard first-use UX", () => {
  beforeEach(() => jest.clearAllMocks());

  it("guides users with an empty database without showing destructive actions", () => {
    showDashboard(0);
    expect(screen.getByRole("heading", { name: /Börja bygga ditt släktträd/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Lägg till första personen/i }).getAttribute("href")).toBe("/individuals");
    expect(screen.getByRole("button", { name: /Importera GEDCOM/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Rensa databas/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Exportera GEDCOM/i })).toBeNull();
  });

  it("shows a tree shortcut, statistics and backup actions when data exists", () => {
    showDashboard(12);
    expect(screen.getByRole("heading", { name: "Översikt" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Visa släktträdet/i }).getAttribute("href")).toBe("/tree");
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exportera GEDCOM/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Rensa databas/i })).toBeTruthy();
  });
});
