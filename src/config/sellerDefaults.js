// Built-in sellers — available on every device.
// signature: path to a PNG in /public, or a data: URL (uploaded via Edit), or "" for none.
export const BUILTIN_SELLERS = [
  {
    id: "seller-16496351-canada",
    mvdaRegNumber: "5873807",
    name: "16496351 Canada Inc.",
    address: "3725 Lake Shore Blvd W",
    cityProvPC: "Etobicoke, Ontario, M8W 1P9",
    telephone: "647-608-4135",
    fax: "",
    salespersonRegistration: "5770995",
    salespersonName: "DEEPIT SAJAN OOMMEN",
    hstRegistration: "700404957RT0001",
    signature: "/signatures/deepit-sajan-oommen.png",
  },
  {
    id: "seller-asyed-auto-sales",
    mvdaRegNumber: "5866991",
    name: "ASYED AUTO SALES LTD",
    address: "109-2829 DERRY RD E",
    cityProvPC: "Mississauga, Ontario, L4T 1A5",
    telephone: "647-762-6291",
    fax: "",
    salespersonRegistration: "5920756",
    salespersonName: "RAJDEVINDER SINGH VAROWAL",
    hstRegistration: "752404822RT0001",
    signature: "/signatures/rajdevinder-singh-varowal.png",
  },
  {
    id: "seller-msr-motors",
    mvdaRegNumber: "5911805",
    name: "MSR MOTORS INC",
    address: "SUITE 1600-2300 YONGE ST",
    cityProvPC: "TORONTO ON M4P 1E4",
    telephone: "",
    fax: "",
    salespersonRegistration: "5911797",
    salespersonName: "RAHUL MEHTA",
    hstRegistration: "785706631",
    signature: "/signatures/rahul-mehta.png",
  },
];

export const DEFAULT_SELLER = BUILTIN_SELLERS[0];

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
  signature: "",
};

export const HST_RATE = 0.13;

export const VIN_YEAR_MAP = {
  "5": 2005, "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};
