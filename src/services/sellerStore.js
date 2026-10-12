import { DEFAULT_SELLER, BUILTIN_SELLERS } from "../config/sellerDefaults";

// Custom sellers / edits are saved in this browser's localStorage.
const SELLERS_KEY = "ucda.sellers.v1";
const SELECTED_KEY = "ucda.selectedSellerId.v1";

// Old data from previous versions that should no longer appear
const REMOVED_IDS = new Set(["dreamfleet-default"]);
const REMOVED_NAMES = new Set(["dreamfleet inc.", "dreamfleet inc", "dreamfleet"]);

const norm = (v) => String(v || "").trim().toLowerCase();

// Keep only signature values this version understands
const validSignature = (sig) =>
  typeof sig === "string" && (sig.startsWith("data:image/") || sig.startsWith("/signatures/"))
    ? sig
    : "";

export function loadSellers() {
  let saved = [];
  try {
    const raw = localStorage.getItem(SELLERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    /* ignore */
  }

  saved = saved
    .filter((s) => s && !REMOVED_IDS.has(s.id) && !REMOVED_NAMES.has(norm(s.name)))
    .map((s) => ({ ...s, signature: validSignature(s.signature) }));

  // Built-in sellers first; a saved edit of one overrides the code version.
  const builtins = BUILTIN_SELLERS.map((b) => {
    const edit = saved.find((s) => s.id === b.id);
    return edit ? { ...b, ...edit } : b;
  });

  // Custom sellers — skip any that duplicate a built-in (same company name)
  const builtinNames = new Set(BUILTIN_SELLERS.map((b) => norm(b.name)));
  const custom = saved.filter(
    (s) => !BUILTIN_SELLERS.some((b) => b.id === s.id) && !builtinNames.has(norm(s.name))
  );

  return [...builtins, ...custom];
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
    return localStorage.getItem(SELECTED_KEY) || DEFAULT_SELLER.id;
  } catch {
    return DEFAULT_SELLER.id;
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
