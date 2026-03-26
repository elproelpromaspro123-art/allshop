import { beforeEach, describe, expect, it } from "vitest";
import { useSearchHistoryStore } from "./search-history";

describe("search history store", () => {
  beforeEach(() => {
    useSearchHistoryStore.setState({ terms: [] });
  });

  it("adds normalized terms to history", () => {
    useSearchHistoryStore.getState().addTerm("auriculares");
    expect(useSearchHistoryStore.getState().terms).toEqual(["auriculares"]);
  });

  it("deduplicates repeated terms and moves them to the front", () => {
    useSearchHistoryStore.getState().addTerm("auriculares");
    useSearchHistoryStore.getState().addTerm("cargador");
    useSearchHistoryStore.getState().addTerm("Auriculares");
    expect(useSearchHistoryStore.getState().terms).toEqual([
      "Auriculares",
      "cargador",
    ]);
  });

  it("keeps only the latest six terms", () => {
    const store = useSearchHistoryStore.getState();
    store.addTerm("uno");
    store.addTerm("dos");
    store.addTerm("tres");
    store.addTerm("cuatro");
    store.addTerm("cinco");
    store.addTerm("seis");
    store.addTerm("siete");

    expect(useSearchHistoryStore.getState().terms).toEqual([
      "siete",
      "seis",
      "cinco",
      "cuatro",
      "tres",
      "dos",
    ]);
  });

  it("clears saved terms", () => {
    useSearchHistoryStore.getState().addTerm("smartwatch");
    useSearchHistoryStore.getState().clearTerms();
    expect(useSearchHistoryStore.getState().terms).toEqual([]);
  });

  it("removes a term without affecting the rest of the history", () => {
    useSearchHistoryStore.getState().addTerm("auriculares");
    useSearchHistoryStore.getState().addTerm("cargador");
    useSearchHistoryStore.getState().addTerm("camara");

    useSearchHistoryStore.getState().removeTerm("CARGADOR");

    expect(useSearchHistoryStore.getState().terms).toEqual([
      "camara",
      "auriculares",
    ]);
  });
});
