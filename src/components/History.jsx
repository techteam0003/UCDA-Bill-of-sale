import { useEffect, useState, useCallback } from "react";
import { listBills, getBillPdfUrl, deleteBill } from "../services/db";

const money = (n) =>
  "$" + Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function History({ sellers, onUseAsTemplate }) {
  const [search, setSearch] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [bills, setBills] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  const load = useCallback(async (s, sid) => {
    setState({ loading: true, error: "" });
    try {
      setBills(await listBills({ search: s, sellerId: sid }));
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: e.message });
    }
  }, []);

  // Reload when filters change (search is debounced)
  useEffect(() => {
    const t = setTimeout(() => load(search, sellerId), 300);
    return () => clearTimeout(t);
  }, [search, sellerId, load]);

  const fileName = (b) =>
    `BOS_${b.stock_number || "STOCK"}_${(b.purchaser_name || "Bill").replace(/\s+/g, "_")}.pdf`;

  const openPdf = async (b, download) => {
    try {
      const url = await getBillPdfUrl(b.pdf_path, download ? fileName(b) : undefined);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.click();
      } else {
        window.open(url, "_blank", "noopener");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete this bill for "${b.purchaser_name || "—"}"? This cannot be undone.`)) return;
    try {
      await deleteBill(b);
      setBills((prev) => prev.filter((x) => x.id !== b.id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">Bill of Sale History</h3>

      <div className="history-filters">
        <input
          className="field-input"
          placeholder="Search purchaser, VIN, stock #, make or model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-input"
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
        >
          <option value="">All sellers</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {state.error && <div className="form-error">{state.error}</div>}
      {state.loading && <p className="field-hint">Loading…</p>}
      {!state.loading && !state.error && bills.length === 0 && (
        <p className="field-hint">No bills found. Bills are saved here when you click “Save & Download PDF”.</p>
      )}

      {bills.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Seller</th>
                <th>Purchaser</th>
                <th>Vehicle</th>
                <th>VIN / Stock</th>
                <th className="num">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.sale_date || b.created_at.slice(0, 10)}
                    {b.created_by_email && <div className="muted">{b.created_by_email}</div>}
                  </td>
                  <td>{b.seller_name}</td>
                  <td>{b.purchaser_name || "—"}</td>
                  <td>{[b.year, b.make, b.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="mono-sm">
                    {b.vin || "—"}
                    {b.stock_number && <div className="muted">#{b.stock_number}</div>}
                  </td>
                  <td className="num">{money(b.total)}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openPdf(b, false)}>
                      View
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openPdf(b, true)}>
                      ⬇
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Start a new bill pre-filled with this one's details"
                      onClick={() => onUseAsTemplate(b)}
                    >
                      Copy
                    </button>
                    <button className="btn btn-secondary btn-sm danger-text" onClick={() => handleDelete(b)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
