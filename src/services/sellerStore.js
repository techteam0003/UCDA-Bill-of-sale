import { BUILTIN_SELLERS, DEFAULT_SELLER_ID, isBuiltinSeller } from "../config/sellerDefaults";

// Sellers are saved in this browser's localStorage so they survive reloads.
// v2 keys: data saved by older versions of the app is discarded.
const SELLERS_KEY = "ucda.sellers.v2";
const SELECTED_KEY = "ucda.selectedSellerId.v2";
const LEGACY_KEYS = ["ucda.sellers.v1", "ucda.selectedSellerId.v1"];

try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
} catch {
  /* ignore */
}

export function loadSellers() {
  try {
    const raw = localStorage.getItem(SELLERS_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return [...BUILTIN_SELLERS];
    // Built-in sellers always come first; a saved edit of one overrides its config.
    const builtins = BUILTIN_SELLERS.map((b) => {
      const edit = saved.find((s) => s.id === b.id);
      return edit ? { ...b, ...edit } : b;
    });
    const others = saved.filter((s) => !isBuiltinSeller(s.id));
    return [...builtins, ...others];
  } catch {
    return [...BUILTIN_SELLERS];
  }
}

export function saveSellers(sellers) {
  try {
    localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers));
  } catch (e) {
    console.warn("Could not save seller:", e.message);
    alert("Could not save seller (storage full?). Try a smaller signature image.");
  }
}

export function loadSelectedId() {
  try {
    return localStorage.getItem(SELECTED_KEY) || DEFAULT_SELLER_ID;
  } catch {
    return DEFAULT_SELLER_ID;
  }
}

export function saveSelectedId(id) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {
    /* ignore */
  }
}

export function newSellerId() {
  return "seller-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
