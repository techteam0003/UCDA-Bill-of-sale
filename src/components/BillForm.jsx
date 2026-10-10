import { useState, useCallback, useEffect, useRef } from "react";
import { HST_RATE, VIN_YEAR_MAP } from "../config/sellerDefaults";
import { generateBillOfSale } from "../services/pdfGenerator";
import { decodeVin, cleanVin, VIN_REGEX } from "../services/vinDecoder";
import SellerPanel from "./SellerPanel";

const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

const INITIAL_STATE = {
  // Date
  date: today,
  // Purchaser
  purchaserMvdaReg: "",
  purchaserName: "",
  purchaserAddress: "",
  purchaserCityProvPC: "",
  purchaserTel: "",
  purchaserFax: "",
  // Vehicle
  stockNumber: "",
  year: "",
  make: "",
  model: "",
  colour: "",
  trimLevel: "",
  fuelType: "GAS",
  vinNumber: "",
  distanceTravelled: "",
  distanceUnit: "KMS",
  // Purchasing dealer
  purchaserSalespersonReg: "",
  purchaserSalespersonName: "",
  purchaserHstReg: "",
  // Pricing
  price: "",
  hst: 0,
  deposit: "",
  total: 0,
  // MTO Brand
  mtoBrand: "NONE",
  // Disclosure checkboxes
  odomFaulty: false,
  odomFaultyOpt: "",
  odomPrevReading: "",
  odomDateOfReading: "",
  odomPrevUnit: "KM",
  outOfProvince: true,
  usVehicle: false,
  provinceState1: "PREVIOUS QUEBEC",
  provinceState2: "",
  provinceState3: "",
  dailyRental: false,
  fireDamaged: false,
  waterDamaged: false,
  policeCruiser: false,
  emergServices: false,
  taxiLimo: false,
  absInoperable: "",
  airbagsInoperable: "",
  pollutionControl: false,
  totalLoss: false,
  theftRecovery: false,
  warrantyCancelled: false,
  bodyPanels: false,
  repairsSuspension: false,
  structuralDamage: false,
  damageExceeding3000: false,
  badgesSpecsChanged: false,
  otherDisclosures: "",
  detailsLine1: "",
  detailsLine2: "",
  detailsLine3: "",
  noDisclosures: false,
  // Searches
  searchLien: false,
  searchAutoCheck: false,
  searchCarfax: false,
  searchOopLien: false,
  searchOntarioHistory: false,
  searchCanCheck: false,
};

export default function BillForm({
  seller,
  sellers,
  onSelectSeller,
  onSaveSeller,
  onDeleteSeller,
}) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [vinStatus, setVinStatus] = useState({ state: "idle" }); // idle | loading | done | error
  const lastDecodedVin = useRef("");
  const decodeAbort = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  // Update field
  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle input change
  const onChange = useCallback(
    (field) => (e) => {
      const val =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      set(field, val);
    },
    [set]
  );

  // Auto-calc HST + Total
  useEffect(() => {
    const p = parseFloat(form.price) || 0;
    const d = parseFloat(form.deposit) || 0;
    const hst = parseFloat((p * HST_RATE).toFixed(2));
    const total = parseFloat((p + hst - d).toFixed(2));
    setForm((prev) => ({ ...prev, hst, total }));
  }, [form.price, form.deposit]);

  // ---------- NHTSA VIN decode ----------
  const runVinDecode = useCallback(async (vin, { force = false } = {}) => {
    if (!VIN_REGEX.test(vin)) return;
    if (!force && lastDecodedVin.current === vin) return;
    lastDecodedVin.current = vin;

    decodeAbort.current?.abort();
    const controller = new AbortController();
    decodeAbort.current = controller;

    setVinStatus({ state: "loading" });
    try {
      const result = await decodeVin(vin, { signal: controller.signal });
      setForm((prev) => {
        if (prev.vinNumber !== vin) return prev; // VIN changed while loading
        return {
          ...prev,
          year: result.year || prev.year,
          make: result.make || prev.make,
          model: result.model || prev.model,
          trimLevel: result.trimLevel || prev.trimLevel,
          fuelType: result.fuelType || prev.fuelType,
        };
      });
      setVinStatus({ state: "done", result });
    } catch (err) {
      if (err.name === "AbortError") return;
      // Fallback: at least get the year from the 10th character
      const yr = VIN_YEAR_MAP[vin[9]];
      if (yr) set("year", String(yr));
      setVinStatus({
        state: "error",
        message:
          err.message === "Failed to fetch"
            ? "Couldn't reach NHTSA (check internet connection)."
            : err.message,
        fallbackYear: yr,
      });
    }
  }, [set]);

  // VIN input: clean it, and auto-decode as soon as a full valid VIN is entered
  const handleVinChange = (e) => {
    const vin = cleanVin(e.target.value);
    set("vinNumber", vin);
    if (vin.length < 17) {
      decodeAbort.current?.abort();
      lastDecodedVin.current = "";
      setVinStatus({ state: "idle" });
    } else {
      runVinDecode(vin);
    }
  };

  useEffect(() => () => decodeAbort.current?.abort(), []);

  // Generate PDF
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const bytes = await generateBillOfSale(form, seller);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setPdfBlob(blob);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF: " + err.message);
    }
    setLoading(false);
  };

  // Download PDF
  const handleDownload = () => {
    if (!pdfBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(pdfBlob);
    const name = form.purchaserName || "Bill";
    const stock = form.stockNumber || "STOCK";
    link.download = `BOS_${stock}_${name.replace(/\s+/g, "_")}.pdf`;
    link.click();
  };

  // Back to form from preview
  const handleBack = () => {
    setPdfUrl(null);
    setPdfBlob(null);
  };

  // ========================= RENDER =========================

  // If PDF is generated, show preview
  if (pdfUrl) {
    return (
      <div className="preview-container">
        <div className="preview-header">
          <h2>Bill of Sale Preview</h2>
          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={handleBack}>
              ← Edit Form
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇ Download PDF
            </button>
          </div>
        </div>
        <iframe
          src={pdfUrl}
          className="pdf-iframe"
          title="Bill of Sale Preview"
        />
      </div>
    );
  }

  const sections = [
    "Purchaser",
    "Vehicle",
    "Dealer & Pricing",
    "Disclosures",
    "Searches",
  ];

  return (
    <div className="form-container">
      {/* Seller info — select / add / edit */}
      <SellerPanel
        sellers={sellers}
        selectedId={seller.id}
        onSelect={onSelectSeller}
        onSave={onSaveSeller}
        onDelete={onDeleteSeller}
      />

      {/* Section tabs */}
      <div className="section-tabs">
        {sections.map((s, i) => (
          <button
            key={s}
            className={`tab ${activeSection === i ? "tab-active" : ""}`}
            onClick={() => setActiveSection(i)}
          >
            <span className="tab-num">{i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      {/* Date */}
      <div className="field-row" style={{ marginBottom: 16 }}>
        <label className="field-label">Date of Sale</label>
        <input
          type="date"
          className="field-input"
          value={form.date}
          onChange={onChange("date")}
          style={{ maxWidth: 200 }}
        />
      </div>

      {/* === Section 0: Purchaser === */}
      {activeSection === 0 && (
        <div className="section">
          <h3 className="section-title">Purchaser Information</h3>
          <div className="field-grid">
            <div className="field-row full">
              <label className="field-label">
                Purchaser / Dealer Name <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.purchaserName}
                onChange={onChange("purchaserName")}
                placeholder="e.g. CARREFOUR 40-640 VOLKSWAGEN"
              />
            </div>
            <div className="field-row">
              <label className="field-label">MVDA Reg #</label>
              <input
                className="field-input"
                value={form.purchaserMvdaReg}
                onChange={onChange("purchaserMvdaReg")}
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Telephone <span className="req">*</span>
              </label>
              <input
                className="field-input"
                type="tel"
                value={form.purchaserTel}
                onChange={onChange("purchaserTel")}
                placeholder="e.g. 4505818946"
              />
            </div>
            <div className="field-row full">
              <label className="field-label">
                Address <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.purchaserAddress}
                onChange={onChange("purchaserAddress")}
                placeholder="e.g. 90 CHEMIN DES QUARANTE - ARPENTS"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                City / Province / Postal Code <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.purchaserCityProvPC}
                onChange={onChange("purchaserCityProvPC")}
                placeholder="e.g. CHARLEMAGNE, QC J5Z 0B5"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Fax</label>
              <input
                className="field-input"
                value={form.purchaserFax}
                onChange={onChange("purchaserFax")}
              />
            </div>
          </div>
          <div className="section-nav">
            <div />
            <button
              className="btn btn-primary"
              onClick={() => setActiveSection(1)}
            >
              Next: Vehicle →
            </button>
          </div>
        </div>
      )}

      {/* === Section 1: Vehicle === */}
      {activeSection === 1 && (
        <div className="section">
          <h3 className="section-title">Vehicle Information</h3>
          <div className="field-grid">
            <div className="field-row full">
              <label className="field-label">
                VIN (17 characters) <span className="req">*</span>
              </label>
              <div className="vin-input-row">
                <input
                  className="field-input mono"
                  value={form.vinNumber}
                  onChange={handleVinChange}
                  maxLength={17}
                  placeholder="e.g. 5TDBRCHN9NS077640"
                  style={{ letterSpacing: 2 }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn btn-primary vin-btn"
                  disabled={!VIN_REGEX.test(form.vinNumber) || vinStatus.state === "loading"}
                  onClick={() => runVinDecode(form.vinNumber, { force: true })}
                  title="Decode VIN with NHTSA"
                >
                  {vinStatus.state === "loading" ? "Decoding…" : "Decode VIN"}
                </button>
              </div>
              {form.vinNumber.length > 0 && form.vinNumber.length < 17 && (
                <span className="field-hint">
                  {17 - form.vinNumber.length} characters remaining
                </span>
              )}
              {vinStatus.state === "loading" && (
                <span className="field-hint">Looking up VIN with NHTSA…</span>
              )}
              {vinStatus.state === "error" && (
                <span className="field-hint error">
                  {vinStatus.message}
                  {vinStatus.fallbackYear
                    ? ` Year set from VIN: ${vinStatus.fallbackYear}.`
                    : ""}
                </span>
              )}
              {vinStatus.state === "done" && (
                <div className="vin-result">
                  <div className="vin-result-head">
                    <span className="vin-result-title">
                      ✓ {[vinStatus.result.year, vinStatus.result.make, vinStatus.result.model, vinStatus.result.trimLevel]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className="vin-result-src">NHTSA vPIC</span>
                  </div>
                  <div className="vin-result-grid">
                    {Object.entries(vinStatus.result.details)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k}>
                          <span className="vin-k">{k}</span>
                          <span className="vin-v">{v}</span>
                        </div>
                      ))}
                  </div>
                  {vinStatus.result.warning && (
                    <div className="vin-warning">⚠ {vinStatus.result.warning}</div>
                  )}
                  <div className="field-hint">
                    Year, make, model, trim & fuel filled in — please verify. Colour
                    isn't encoded in a VIN, so enter it manually.
                  </div>
                </div>
              )}
            </div>
            <div className="field-row">
              <label className="field-label">
                Stock # <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.stockNumber}
                onChange={onChange("stockNumber")}
                placeholder="e.g. EX25113"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Year <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.year}
                onChange={onChange("year")}
                placeholder="Auto from VIN or enter"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Make <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.make}
                onChange={onChange("make")}
                placeholder="e.g. TOYOTA"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Model <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.model}
                onChange={onChange("model")}
                placeholder="e.g. HIGHLANDER"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Colour <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.colour}
                onChange={onChange("colour")}
                placeholder="e.g. WHITE"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Trim Level <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.trimLevel}
                onChange={onChange("trimLevel")}
                placeholder="e.g. LIMITED"
              />
            </div>
            <div className="field-row">
              <label className="field-label">
                Fuel Type <span className="req">*</span>
              </label>
              <select
                className="field-input"
                value={form.fuelType}
                onChange={onChange("fuelType")}
              >
                <option value="GAS">GAS</option>
                <option value="DIESEL">DIESEL</option>
                <option value="HYBRID">HYBRID</option>
                <option value="ELECTRIC">ELECTRIC</option>
              </select>
            </div>
            <div className="field-row">
              <label className="field-label">
                Distance Travelled <span className="req">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                value={form.distanceTravelled}
                onChange={onChange("distanceTravelled")}
                placeholder="e.g. 65088"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Unit</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="distanceUnit"
                    value="KMS"
                    checked={form.distanceUnit === "KMS"}
                    onChange={onChange("distanceUnit")}
                  />
                  KMS
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="distanceUnit"
                    value="MILES"
                    checked={form.distanceUnit === "MILES"}
                    onChange={onChange("distanceUnit")}
                  />
                  MILES
                </label>
              </div>
            </div>
          </div>
          <div className="section-nav">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveSection(0)}
            >
              ← Purchaser
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveSection(2)}
            >
              Next: Dealer & Pricing →
            </button>
          </div>
        </div>
      )}

      {/* === Section 2: Dealer & Pricing === */}
      {activeSection === 2 && (
        <div className="section">
          <h3 className="section-title">Purchasing Dealer & Pricing</h3>
          <div className="field-grid">
            <div className="field-row">
              <label className="field-label">
                Salesperson Name <span className="req">*</span>
              </label>
              <input
                className="field-input"
                value={form.purchaserSalespersonName}
                onChange={onChange("purchaserSalespersonName")}
                placeholder="e.g. Philippe Bilodeau"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Salesperson Reg #</label>
              <input
                className="field-input"
                value={form.purchaserSalespersonReg}
                onChange={onChange("purchaserSalespersonReg")}
              />
            </div>
            <div className="field-row full">
              <label className="field-label">HST Registration #</label>
              <input
                className="field-input"
                value={form.purchaserHstReg}
                onChange={onChange("purchaserHstReg")}
                placeholder="e.g. 835968801RT0001"
              />
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: 24 }}>
            Pricing
          </h3>
          <div className="pricing-grid">
            <div className="price-row">
              <label className="field-label">
                Price ($) <span className="req">*</span>
              </label>
              <input
                className="field-input price-input"
                type="number"
                step="0.01"
                value={form.price}
                onChange={onChange("price")}
                placeholder="47495.00"
              />
            </div>
            <div className="price-row computed">
              <label className="field-label">HST (13%)</label>
              <div className="price-display">${form.hst.toFixed(2)}</div>
            </div>
            <div className="price-row">
              <label className="field-label">Deposit ($)</label>
              <input
                className="field-input price-input"
                type="number"
                step="0.01"
                value={form.deposit}
                onChange={onChange("deposit")}
                placeholder="0.00"
              />
            </div>
            <div className="price-row total">
              <label className="field-label">TOTAL</label>
              <div className="price-display total-display">
                ${form.total.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="section-nav">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveSection(1)}
            >
              ← Vehicle
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveSection(3)}
            >
              Next: Disclosures →
            </button>
          </div>
        </div>
      )}

      {/* === Section 3: Disclosures === */}
      {activeSection === 3 && (
        <div className="section">
          <h3 className="section-title">
            Mandatory Disclosure Statement (MVDA 2002)
          </h3>

          {/* MTO Brand */}
          <div className="field-row full" style={{ marginBottom: 16 }}>
            <label className="field-label">MTO Registration Brand</label>
            <div className="radio-group">
              {["IRREPARABLE", "REBUILT", "SALVAGE", "NONE"].map((b) => (
                <label key={b} className="radio-label">
                  <input
                    type="radio"
                    name="mtoBrand"
                    value={b}
                    checked={form.mtoBrand === b}
                    onChange={onChange("mtoBrand")}
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {/* Odometer */}
          <div className="disclosure-group">
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.odomFaulty}
                onChange={onChange("odomFaulty")}
              />
              Is Odometer Faulty, Broken, Replaced or Rolled Back
            </label>
            {form.odomFaulty && (
              <div className="conditional-fields">
                <div className="radio-group" style={{ marginBottom: 8 }}>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="odomFaultyOpt"
                      value="1A"
                      checked={form.odomFaultyOpt === "1A"}
                      onChange={onChange("odomFaultyOpt")}
                    />
                    1A
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="odomFaultyOpt"
                      value="1B"
                      checked={form.odomFaultyOpt === "1B"}
                      onChange={onChange("odomFaultyOpt")}
                    />
                    1B
                  </label>
                </div>
                {form.odomFaultyOpt === "1A" && (
                  <div className="field-grid">
                    <div className="field-row">
                      <label className="field-label">
                        Previous Odometer Reading
                      </label>
                      <input
                        className="field-input"
                        value={form.odomPrevReading}
                        onChange={onChange("odomPrevReading")}
                      />
                    </div>
                    <div className="field-row">
                      <label className="field-label">Date of Reading</label>
                      <input
                        className="field-input"
                        type="date"
                        value={form.odomDateOfReading}
                        onChange={onChange("odomDateOfReading")}
                      />
                    </div>
                    <div className="field-row">
                      <label className="field-label">Unit</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="odomPrevUnit"
                            value="KM"
                            checked={form.odomPrevUnit === "KM"}
                            onChange={onChange("odomPrevUnit")}
                          />
                          KM
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="odomPrevUnit"
                            value="MILES"
                            checked={form.odomPrevUnit === "MILES"}
                            onChange={onChange("odomPrevUnit")}
                          />
                          Miles
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Province / US */}
          <div className="disclosure-group">
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.outOfProvince}
                onChange={onChange("outOfProvince")}
              />
              Out-of-Province Vehicle
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.usVehicle}
                onChange={onChange("usVehicle")}
              />
              U.S. Vehicle
            </label>
            {(form.outOfProvince || form.usVehicle) && (
              <div className="conditional-fields">
                <label className="field-label">
                  Identify Province(s) and/or State(s):
                </label>
                <input
                  className="field-input"
                  value={form.provinceState1}
                  onChange={onChange("provinceState1")}
                  placeholder="Line 1"
                  style={{ marginBottom: 4 }}
                />
                <input
                  className="field-input"
                  value={form.provinceState2}
                  onChange={onChange("provinceState2")}
                  placeholder="Line 2"
                  style={{ marginBottom: 4 }}
                />
                <input
                  className="field-input"
                  value={form.provinceState3}
                  onChange={onChange("provinceState3")}
                  placeholder="Line 3"
                />
              </div>
            )}
          </div>

          {/* Simple checkboxes */}
          <div className="disclosure-group">
            <h4 className="disclosure-heading">Vehicle History</h4>
            {[
              ["dailyRental", "Daily Rental"],
              ["fireDamaged", "Fire Damaged"],
              ["waterDamaged", "Water Damaged"],
              ["policeCruiser", "Police Cruiser"],
              ["emergServices", "Emergency Services Vehicle"],
              ["taxiLimo", "Taxi or Limo"],
            ].map(([key, label]) => (
              <label key={key} className="check-label">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={onChange(key)}
                />
                {label}
              </label>
            ))}
          </div>

          {/* ABS / Airbags */}
          <div className="disclosure-group">
            <h4 className="disclosure-heading">Safety Systems</h4>
            <div className="field-row" style={{ marginBottom: 8 }}>
              <label className="field-label">
                Anti-Lock Brakes Inoperable
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="absInoperable"
                    value="YES"
                    checked={form.absInoperable === "YES"}
                    onChange={onChange("absInoperable")}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="absInoperable"
                    value="NA"
                    checked={form.absInoperable === "NA"}
                    onChange={onChange("absInoperable")}
                  />
                  Not Applicable
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="absInoperable"
                    value=""
                    checked={form.absInoperable === ""}
                    onChange={onChange("absInoperable")}
                  />
                  N/A
                </label>
              </div>
            </div>
            <div className="field-row">
              <label className="field-label">
                Air Bags Missing / Inoperable
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="airbagsInoperable"
                    value="YES"
                    checked={form.airbagsInoperable === "YES"}
                    onChange={onChange("airbagsInoperable")}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="airbagsInoperable"
                    value="NA"
                    checked={form.airbagsInoperable === "NA"}
                    onChange={onChange("airbagsInoperable")}
                  />
                  Not Applicable
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="airbagsInoperable"
                    value=""
                    checked={form.airbagsInoperable === ""}
                    onChange={onChange("airbagsInoperable")}
                  />
                  N/A
                </label>
              </div>
            </div>
          </div>

          {/* More checkboxes */}
          <div className="disclosure-group">
            <h4 className="disclosure-heading">Damage & Condition</h4>
            {[
              ["pollutionControl", "Pollution Control Inoperable"],
              ["repairsSuspension", "Requires Repairs to Suspension/Subframe"],
              ["structuralDamage", "Structural Parts Damaged, Altered or Repaired"],
              ["damageExceeding3000", "Previous Damage Repaired Exceeding $3,000"],
              ["totalLoss", "Total Loss by an Insurer"],
              ["theftRecovery", "Theft Recovery"],
              ["warrantyCancelled", "Manufacturer's Warranty Cancelled"],
              ["bodyPanels", "Body Panels Painted or Replaced"],
              ["badgesSpecsChanged", "Manufacturer's Badges/Decals or Specs Changed"],
            ].map(([key, label]) => (
              <label key={key} className="check-label">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={onChange(key)}
                />
                {label}
              </label>
            ))}
          </div>

          {/* Other disclosures */}
          <div className="disclosure-group">
            <h4 className="disclosure-heading">Additional</h4>
            <div className="field-row full">
              <label className="field-label">Any Other Disclosures</label>
              <input
                className="field-input"
                value={form.otherDisclosures}
                onChange={onChange("otherDisclosures")}
              />
            </div>
            <div className="field-row full">
              <label className="field-label">
                If Yes to Any Above, Give Details
              </label>
              <input
                className="field-input"
                value={form.detailsLine1}
                onChange={onChange("detailsLine1")}
                placeholder="Details line 1"
                style={{ marginBottom: 4 }}
              />
              <input
                className="field-input"
                value={form.detailsLine2}
                onChange={onChange("detailsLine2")}
                placeholder="Details line 2"
                style={{ marginBottom: 4 }}
              />
              <input
                className="field-input"
                value={form.detailsLine3}
                onChange={onChange("detailsLine3")}
                placeholder="Details line 3"
              />
            </div>
            <label className="check-label" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={form.noDisclosures}
                onChange={onChange("noDisclosures")}
              />
              <strong>
                No Disclosures Are Required to Be Made for This Vehicle
              </strong>
            </label>
          </div>

          <div className="section-nav">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveSection(2)}
            >
              ← Pricing
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveSection(4)}
            >
              Next: Searches →
            </button>
          </div>
        </div>
      )}

      {/* === Section 4: Searches === */}
      {activeSection === 4 && (
        <div className="section">
          <h3 className="section-title">Searches Provided</h3>
          <div className="searches-grid">
            {[
              ["searchLien", "UCDA Lien Search & Kwik Check™"],
              ["searchAutoCheck", "Auto Check™"],
              ["searchCarfax", "CARFAX™"],
              ["searchOopLien", "Out-of-Province Lien Search"],
              ["searchOntarioHistory", "Ontario Vehicle History Search"],
              ["searchCanCheck", "CAN Check™"],
            ].map(([key, label]) => (
              <label key={key} className="check-label search-check">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={onChange(key)}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="section-nav">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveSection(3)}
            >
              ← Disclosures
            </button>
            <button
              className="btn btn-generate"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Bill of Sale"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
