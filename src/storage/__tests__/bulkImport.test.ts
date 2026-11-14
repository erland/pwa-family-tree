import { mergeImportedData } from "../index";

describe("bulk import storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("saves imported persons and relationships with one storage write", async () => {
    const spy = jest.spyOn(Storage.prototype, "setItem");
    const persons = Array.from({ length: 1200 }, (_, i) => ({ id: String(i), givenName: "Person" + i }));
    const result = await mergeImportedData(persons, [{ id: "rel1", type: "spouse", person1Id: "0", person2Id: "1" }]);
    expect(result).toEqual({ count: 1200, relCount: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem("genealogy-db")!).individuals).toHaveLength(1200);
    spy.mockRestore();
  });

  it("updates matching IDs while preserving existing fields", async () => {
    await mergeImportedData([{ id: "one", givenName: "Old", birthCity: "Luleå" }], []);
    await mergeImportedData([{ id: "one", givenName: "New" }], []);
    expect(JSON.parse(localStorage.getItem("genealogy-db")!).individuals).toEqual([
      { id: "one", givenName: "New", birthCity: "Luleå" },
    ]);
  });
});
