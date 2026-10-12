// Built-in sellers — always available in the seller dropdown, cannot be deleted.
// The first one is selected by default.
export const BUILTIN_SELLERS = [
  {
    id: "16496351-canada-inc",
    mvdaRegNumber: "5873807",
    name: "16496351 Canada Inc.",
    address: "3725 Lake Shore Blvd W",
    cityProvPC: "Etobicoke, Ontario, M8W 1P9",
    telephone: "647-608-4135",
    fax: "",
    salespersonRegistration: "5770995",
    salespersonName: "DEEPIT SAJAN OOMMEN",
    hstRegistration: "700404957RT0001",
    signature: "",
  },
  {
    id: "asyed-auto-sales",
    mvdaRegNumber: "5866991",
    name: "ASYED AUTO SALES LTD",
    address: "109–2829 DERRY RD E",
    cityProvPC: "Mississauga, Ontario, L4T 1A5",
    telephone: "647-762-6291",
    fax: "",
    salespersonRegistration: "5920756",
    salespersonName: "RAJDEVINDER SINGH VAROWAL",
    hstRegistration: "752404822RT0001",
    signature: "",
  },
];

export const DEFAULT_SELLER_ID = BUILTIN_SELLERS[0].id;

export const isBuiltinSeller = (id) => BUILTIN_SELLERS.some((s) => s.id === id);

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
  signature: "", // "" = none, or a data:image/png|jpeg URL
};

export const HST_RATE = 0.13;

export const VIN_YEAR_MAP = {
  "5": 2005, "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};
