import { useState } from "react";
import { EMPTY_SELLER, BUILTIN_SELLERS, isBuiltinSeller } from "../config/sellerDefaults";
import { newSellerId } from "../services/sellerStore";

const FIELDS = [
  ["name", "Company Name", true, "full"],
  ["mvdaRegNumber", "MVDA Reg #", false],
  ["telephone", "Telephone", false],
  ["address", "Address", true, "full"],
  ["cityProvPC", "City / Province / Postal Code", true],
  ["fax", "Fax", false],
  ["salespersonName", "Salesperson Name", true],
  ["salespersonRegistration", "Salesperson Reg #", false],
  ["hstRegistration", "HST Registration #", false, "full"],
];

function SellerModal({ initial, isNew, onSave, onClose }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const onSignatureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setError("Signature must be a PNG or JPG image.");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("Signature image must be under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      setDraft((d) => ({ ...d, signature: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const missing = FIELDS.filter(([k, , req]) => req && !String(draft[k] || "").trim());
    if (missing.length) {
      setError("Please fill in: " + missing.map(([, l]) => l).join(", "));
      return;
    }
    onSave({ ...draft, id: draft.id || newSellerId() });
  };

  const originalSignature = BUILTIN_SELLERS.find((b) => b.id === draft.id)?.signature || "";

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNew ? "Add Seller" : "Edit Seller"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="field-grid">
            {FIELDS.map(([key, label, req, width]) => (
              <div key={key} className={`field-row ${width === "full" ? "full" : ""}`}>
                <label className="field-label">
                  {label} {req && <span className="req">*</span>}
                </label>
                <input
                  className="field-input"
                  value={draft[key] || ""}
                  onChange={set(key)}
                />
              </div>
            ))}

            <div className="field-row full">
              <label className="field-label">Seller Signature (optional)</label>
              <div className="sig-row">
                <div className="sig-preview">
                  {draft.signature ? (
                    <img src={draft.signature} alt="Signature" />
                  ) : (
                    <span className="field-hint">No signature — the PDF will be left unsigned</span>
                  )}
                </div>
                <div className="sig-actions">
                  <label className="btn btn-secondary btn-sm">
                    Upload PNG/JPG
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={onSignatureFile}
                      hidden
                    />
                  </label>
                  {originalSignature && draft.signature !== originalSignature && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDraft((d) => ({ ...d, signature: originalSignature }))}
                    >
                      Use original
                    </button>
                  )}
                  {draft.signature && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDraft((d) => ({ ...d, signature: "" }))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <span className="field-hint">
                Tip: a PNG with a transparent background looks best.
              </span>
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isNew ? "Add Seller" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerPanel({ sellers, selectedId, onSelect, onSave, onDelete }) {
  const [modal, setModal] = useState(null); // { seller, isNew }
  const seller = sellers.find((s) => s.id === selectedId) || sellers[0];
  const isDefault = isBuiltinSeller(seller.id);

  const handleDelete = () => {
    if (window.confirm(`Delete seller "${seller.name}"?`)) onDelete(seller.id);
  };

  return (
    <div className="seller-banner">
      <div className="seller-toolbar">
        <div className="seller-badge">SELLER</div>
        <div className="seller-controls">
          <select
            className="seller-select"
            value={seller.id}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Select seller"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.salespersonName ? ` — ${s.salespersonName}` : ""}
              </option>
            ))}
          </select>
          <button
            className="seller-btn"
            onClick={() => setModal({ seller: { ...seller }, isNew: false })}
          >
            ✎ Edit
          </button>
          <button
            className="seller-btn seller-btn-add"
            onClick={() => setModal({ seller: { ...EMPTY_SELLER }, isNew: true })}
          >
            + Add Seller
          </button>
          {!isDefault && (
            <button className="seller-btn seller-btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="seller-grid">
        <div>
          <span className="seller-label">Company</span>
          <span className="seller-value">{seller.name || "—"}</span>
        </div>
        <div>
          <span className="seller-label">MVDA Reg #</span>
          <span className="seller-value">{seller.mvdaRegNumber || "—"}</span>
        </div>
        <div>
          <span className="seller-label">Address</span>
          <span className="seller-value">
            {[seller.address, seller.cityProvPC].filter(Boolean).join(", ") || "—"}
          </span>
        </div>
        <div>
          <span className="seller-label">Tel</span>
          <span className="seller-value">{seller.telephone || "—"}</span>
        </div>
        <div>
          <span className="seller-label">Salesperson</span>
          <span className="seller-value">
            {seller.salespersonName || "—"}
            {seller.salespersonRegistration ? ` (#${seller.salespersonRegistration})` : ""}
          </span>
        </div>
        <div>
          <span className="seller-label">HST Reg</span>
          <span className="seller-value">{seller.hstRegistration || "—"}</span>
        </div>
        <div>
          <span className="seller-label">Signature</span>
          <span className="seller-value">{seller.signature ? "✓ On file" : "None"}</span>
        </div>
      </div>

      {modal && (
        <SellerModal
          initial={modal.seller}
          isNew={modal.isNew}
          onClose={() => setModal(null)}
          onSave={(s) => {
            onSave(s);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
