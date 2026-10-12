import { useState, useEffect } from "react";
import BillForm from "./components/BillForm";
import { DEFAULT_SELLER_ID, isBuiltinSeller } from "./config/sellerDefaults";
import {
  loadSellers,
  saveSellers,
  loadSelectedId,
  saveSelectedId,
} from "./services/sellerStore";
import "./App.css";

function App() {
  const [sellers, setSellers] = useState(loadSellers);
  const [selectedId, setSelectedId] = useState(loadSelectedId);

  const seller = sellers.find((s) => s.id === selectedId) || sellers[0];

  useEffect(() => saveSelectedId(seller.id), [seller.id]);

  const handleSave = (updated) => {
    setSellers((prev) => {
      const exists = prev.some((s) => s.id === updated.id);
      const next = exists
        ? prev.map((s) => (s.id === updated.id ? updated : s))
        : [...prev, updated];
      saveSellers(next);
      return next;
    });
    setSelectedId(updated.id);
  };

  const handleDelete = (id) => {
    if (isBuiltinSeller(id)) return;
    setSellers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSellers(next);
      return next;
    });
    setSelectedId(DEFAULT_SELLER_ID);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-ucda">UCDA</span>
            <span className="logo-text">Wholesale Bill of Sale</span>
          </div>
          <div className="header-badge">{seller.name}</div>
        </div>
      </header>
      <main className="app-main">
        <BillForm
          seller={seller}
          sellers={sellers}
          onSelectSeller={setSelectedId}
          onSaveSeller={handleSave}
          onDeleteSeller={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
