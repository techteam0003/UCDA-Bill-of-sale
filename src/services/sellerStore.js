import { SELLER_CONFIG } from "../config/sellerDefaults";

// Sellers are saved in this browser's localStorage so they survive reloads.
const SELLERS_KEY = "ucda.sellers.v1";
const SELECTED_KEY = "ucda.selectedSellerId.v1";

export function loadSellers() {
  try {
    const raw = localStorage.getItem(SELLERS_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return [SELLER_CONFIG];
    // Default seller is always first; a saved edit of it overrides the config.
    const savedDefault = saved.find((s) => s.id === SELLER_CONFIG.id);
    const others = saved.filter((s) => s.id !== SELLER_CONFIG.id);
    return [savedDefault ? { ...SELLER_CONFIG, ...savedDefault } : SELLER_CONFIG, ...others];
  } catch {
    return [SELLER_CONFIG];
  }
}

export function saveSellers(sellers) {
  try {
    localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers));
  } catch (e) {
    console.warn("Could not save sellers:", e.message);
    alert("Could not save seller (storage full?). Try a smaller signature image.");
  }
}

export function loadSelectedId() {
  try {
    return localStorage.getItem(SELECTED_KEY) || SELLER_CONFIG.id;
  } catch {
    return SELLER_CONFIG.id;
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
