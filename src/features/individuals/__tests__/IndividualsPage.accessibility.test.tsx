import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IndividualsPage from "../IndividualsPage";

jest.mock("../../../store", () => ({
  useAppDispatch: jest.fn(() => jest.fn()),
  useAppSelector: jest.fn(),
}));
jest.mock("../../individualsSlice", () => ({
  fetchIndividuals: jest.fn(() => ({ type: "fetch" })),
  deleteIndividual: jest.fn((id: string) => ({ type: "delete", payload: id })),
}));
jest.mock("../../../components/SearchBar", () => ({
  __esModule: true,
  default: () => <input aria-label="Sök personer" />,
}));
jest.mock("../IndividualDetails", () => ({
  __esModule: true,
  default: ({ individualId }: { individualId: string }) => <div>Detaljer: {individualId}</div>,
}));
jest.mock("../IndividualFormDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../utils/exportAllIndividualsPdf", () => ({
  exportAllIndividualsPdf: jest.fn(),
}));

const { useAppSelector } = require("../../../store") as { useAppSelector: jest.Mock };

describe("Individuals list accessibility", () => {
  beforeEach(() => {
    useAppSelector.mockImplementation((selector: any) => selector({
      individuals: { items: [
        { id: "1", givenName: "Anna", familyName: "Andersson" },
      ] },
      relationships: { items: [] },
    }));
  });
  it("exposes named buttons and accessible person selection", () => {
    render(<IndividualsPage />);
    expect(screen.getByRole("button", { name: "Lägg till person" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Exportera alla personer till PDF" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redigera Anna Andersson" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ta bort Anna Andersson" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Visa detaljer för Anna Andersson" }));
    expect(screen.getByText("Detaljer: 1")).toBeTruthy();
  });
  it("provides an explicit first-person action in an empty database", () => {
    useAppSelector.mockImplementation((selector: any) => selector({
      individuals: { items: [] }, relationships: { items: [] },
    }));
    render(<IndividualsPage />);
    expect(screen.getByText("Inga personer registrerade ännu.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lägg till första personen" })).toBeTruthy();
  });
});
