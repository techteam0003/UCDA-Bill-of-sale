// Default seller — always available, cannot be deleted.
// signature: "builtin" → uses the embedded Bikramjeet signature in pdfGenerator.js
export const SELLER_CONFIG = {
  id: "dreamfleet-default",
  mvdaRegNumber: "4963427",
  name: "Dreamfleet Inc.",
  address: "108 Cannifton Road North",
  cityProvPC: "Cannifton, ON K0K 1K0",
  telephone: "6139617477",
  fax: "",
  salespersonRegistration: "5712963",
  salespersonName: "Bikramjeet Bhagtana",
  hstRegistration: "829092873RT0001",
  signature: "builtin",
};

export const EMPTY_SELLER = {
  id: "",
  mvdaRegNumber: "",
  name: "",
  address: "",
  cityProvPC: "",
  telephone: "",
  fax: "",
  salespersonRegistration: "",
  salespersonName: "",
  hstRegistration: "",
  signature: "", // "" = none, "builtin", or a data:image/png|jpeg URL
};

export const HST_RATE = 0.13;

export const VIN_YEAR_MAP = {
  "5": 2005, "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};
