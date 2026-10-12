import { useState, useEffect, useCallback } from "react";
import BillForm from "./components/BillForm";
import History from "./components/History";
import Login from "./components/Login";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  loadSellers,
  saveSeller,
  deleteSeller,
  saveBill,
  loadPreviousPurchasers,
} from "./services/db";
import "./App.css";

const SELECTED_KEY = "ucda.selectedSellerId.v2";
const readSelected = () => {
  try {
    return localStorage.getItem(SELECTED_KEY) || "";
  } catch {
    return "";
  }
};

function App() {
  // undefined = still checking, null = signed out
  const [session, setSession] = useState(isSupabaseConfigured ? undefined : null);
  const [sellers, setSellers] = useState([]);
  const [selectedId, setSelectedId] = useState(readSelected);
  const [purchasers, setPurchasers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("form"); // form | history
  const [formSeed, setFormSeed] = useState({ key: 0, data: null });

  // ---------- auth ----------
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---------- data ----------
  const refreshSellers = useCallback(async () => {
    const list = await loadSellers();
    setSellers(list);
    return list;
  }, []);

  const refreshPurchasers = useCallback(async () => {
    try {
      setPurchasers(await loadPreviousPurchasers());
    } catch (e) {
      console.warn(e.message);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshSellers();
        if (!cancelled) setLoadError("");
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      }
      if (!cancelled) setLoading(false);
      refreshPurchasers();
    })();
    return () => {
      cancelled = true;
    };
  }, [session, refreshSellers, refreshPurchasers]);

  const seller = sellers.find((s) => s.id === selectedId) || sellers[0];

  useEffect(() => {
    if (!seller) return;
    try {
      localStorage.setItem(SELECTED_KEY, seller.id);
    } catch {
      /* ignore */
    }
  }, [seller]);

  // ---------- handlers ----------
  const handleSaveSeller = async (s) => {
    const id = await saveSeller(s); // throws on error → shown in modal
    await refreshSellers();
    setSelectedId(id);
  };

  const handleDeleteSeller = async (id) => {
    try {
      await deleteSeller(id);
      const list = await refreshSellers();
      setSelectedId(list[0]?.id || "");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSaveBill = async (form, pdfBlob) => {
    const id = await saveBill({ form, seller, pdfBlob, userEmail: session?.user?.email });
    refreshPurchasers();
    return id;
  };

  const handleUseAsTemplate = (bill) => {
    if (bill.seller_id && sellers.some((s) => s.id === bill.seller_id)) {
      setSelectedId(bill.seller_id);
    }
    setFormSeed((p) => ({ key: p.key + 1, data: bill.form_data }));
    setView("form");
  };

  const handleNewBill = () => {
    setFormSeed((p) => ({ key: p.key + 1, data: null }));
    setView("form");
  };

  const signOut = () => supabase.auth.signOut();

  // ---------- render ----------
  let body;
  if (session === undefined) {
    body = <p className="field-hint">Loading…</p>;
  } else if (!session) {
    body = <Login />;
  } else if (loading) {
    body = <p className="field-hint">Loading sellers…</p>;
  } else if (loadError) {
    body = (
      <div className="form-error">
        {loadError}
        <br />
        Did you run <code>supabase/setup.sql</code> in the Supabase SQL Editor?
      </div>
    );
  } else if (!seller) {
    body = (
      <div className="form-error">
        No sellers in the database yet. Run <code>supabase/setup.sql</code> to add the starting sellers.
      </div>
    );
  } else if (view === "history") {
    body = <History sellers={sellers} onUseAsTemplate={handleUseAsTemplate} />;
  } else {
    body = (
      <BillForm
        key={formSeed.key}
        initialData={formSeed.data}
        seller={seller}
        sellers={sellers}
        previousPurchasers={purchasers}
        onSelectSeller={setSelectedId}
        onSaveSeller={handleSaveSeller}
        onDeleteSeller={handleDeleteSeller}
        onSaveBill={handleSaveBill}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-ucda">UCDA</span>
            <span className="logo-text">Wholesale Bill of Sale</span>
          </div>
          {session && (
            <nav className="header-nav">
              <button
                className={`nav-btn ${view === "form" ? "nav-active" : ""}`}
                onClick={view === "form" ? handleNewBill : () => setView("form")}
                title={view === "form" ? "Start a blank bill" : ""}
              >
                {view === "form" ? "+ New Bill" : "Bill Form"}
              </button>
              <button
                className={`nav-btn ${view === "history" ? "nav-active" : ""}`}
                onClick={() => setView("history")}
              >
                History
              </button>
              <span className="header-user" title={session.user.email}>
                {session.user.email}
              </span>
              <button className="nav-btn" onClick={signOut}>
                Sign out
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="app-main">{body}</main>
    </div>
  );
}

export default App;
