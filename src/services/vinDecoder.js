// NHTSA vPIC VIN decoder — free public API, no key required.
// Docs: https://vpic.nhtsa.dot.gov/api/
const NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";

// Valid VIN: 17 chars, no I, O or Q
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function cleanVin(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 17);
}

// Map NHTSA fuel / electrification info to the form's fuel options
function mapFuelType(r) {
  const primary = (r.FuelTypePrimary || "").toLowerCase();
  const secondary = (r.FuelTypeSecondary || "").toLowerCase();
  const elec = (r.ElectrificationLevel || "").toUpperCase();

  if (elec.includes("BEV") && !elec.includes("PHEV")) return "ELECTRIC";
  if (elec.includes("HEV") || elec.includes("HYBRID")) return "HYBRID";
  if (primary.includes("electric") && secondary && !secondary.includes("electric")) return "HYBRID";
  if (secondary.includes("electric") && primary && !primary.includes("electric")) return "HYBRID";
  if (primary.includes("electric")) return "ELECTRIC";
  if (primary.includes("diesel")) return "DIESEL";
  if (primary.includes("gasoline") || primary.includes("flex") || primary.includes("ethanol")) return "GAS";
  return "";
}

const clean = (v) => {
  const s = String(v ?? "").trim();
  return s && s.toLowerCase() !== "not applicable" ? s : "";
};

export async function decodeVin(vin, { signal } = {}) {
  const v = cleanVin(vin);
  if (!VIN_REGEX.test(v)) {
    throw new Error("VIN must be 17 characters (letters I, O, Q are not allowed).");
  }

  const res = await fetch(`${NHTSA_URL}/${v}?format=json`, { signal });
  if (!res.ok) throw new Error(`NHTSA service error (${res.status})`);
  const data = await res.json();
  const r = data?.Results?.[0];
  if (!r) throw new Error("No data returned from NHTSA.");

  // ErrorCode "0" = clean decode. Others may still contain partial data.
  const errorCodes = String(r.ErrorCode || "0")
    .split(",")
    .map((c) => c.trim());
  const isClean = errorCodes.length === 1 && errorCodes[0] === "0";

  const make = clean(r.Make);
  const model = clean(r.Model);
  const year = clean(r.ModelYear);

  if (!make && !model && !year) {
    throw new Error(clean(r.ErrorText) || "VIN could not be decoded.");
  }

  const displacement = clean(r.DisplacementL)
    ? `${parseFloat(r.DisplacementL).toFixed(1)}L`
    : "";
  const cyl = clean(r.EngineCylinders) ? `${r.EngineCylinders}-cyl` : "";

  return {
    vin: v,
    isClean,
    warning: isClean ? "" : clean(r.ErrorText),
    // Fields that fill the form
    year,
    make: make.toUpperCase(),
    model: model.toUpperCase(),
    trimLevel: (clean(r.Trim) || clean(r.Series) || "").toUpperCase(),
    fuelType: mapFuelType(r),
    // Extra info shown to the user
    details: {
      "Body": clean(r.BodyClass),
      "Series": clean(r.Series),
      "Trim 2": clean(r.Trim2),
      "Engine": [displacement, cyl, clean(r.EngineModel)].filter(Boolean).join(" "),
      "Fuel": [clean(r.FuelTypePrimary), clean(r.FuelTypeSecondary)].filter(Boolean).join(" / "),
      "Drive": clean(r.DriveType),
      "Transmission": clean(r.TransmissionStyle),
      "Doors": clean(r.Doors),
      "Manufacturer": clean(r.Manufacturer),
      "Built in": [clean(r.PlantCity), clean(r.PlantCountry)].filter(Boolean).join(", "),
    },
  };
}
