import { supabase } from "../lib/supabase";

const SIGNED_URL_SECONDS = 60 * 60 * 8; // signature preview links valid for 8 hours

// ---------- helpers ----------
const fail = (error, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

const isStaticPath = (p) => typeof p === "string" && p.startsWith("/");

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// ---------- SELLERS ----------
function rowToSeller(row, signedUrl = "") {
  return {
    id: row.id,
    name: row.name || "",
    mvdaRegNumber: row.mvda_reg_number || "",
    address: row.address || "",
    cityProvPC: row.city_prov_pc || "",
    telephone: row.telephone || "",
    fax: row.fax || "",
    salespersonRegistration: row.salesperson_registration || "",
    salespersonName: row.salesperson_name || "",
    hstRegistration: row.hst_registration || "",
    signaturePath: row.signature_path || "",
    // What the app/PDF uses: static path, signed storage URL, or "" for none
    signature: isStaticPath(row.signature_path) ? row.signature_path : signedUrl,
  };
}

export async function loadSellers() {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .order("created_at", { ascending: true });
  fail(error, "Loading sellers");

  const storagePaths = data
    .map((r) => r.signature_path)
    .filter((p) => p && !isStaticPath(p));

  let urlMap = {};
  if (storagePaths.length) {
    const { data: signed, error: sErr } = await supabase.storage
      .from("signatures")
      .createSignedUrls(storagePaths, SIGNED_URL_SECONDS);
    fail(sErr, "Loading signatures");
    urlMap = Object.fromEntries(signed.map((s) => [s.path, s.signedUrl]));
  }

  return data.map((r) => rowToSeller(r, urlMap[r.signature_path] || ""));
}

export async function saveSeller(seller) {
  // Work out the signature path to store
  let signaturePath = seller.signaturePath || "";
  if (!seller.signature) {
    signaturePath = "";
  } else if (seller.signature.startsWith("data:")) {
    // Newly uploaded image → put it in the "signatures" bucket
    const blob = dataUrlToBlob(seller.signature);
    const ext = blob.type === "image/jpeg" ? "jpg" : "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("signatures")
      .upload(path, blob, { contentType: blob.type });
    fail(error, "Uploading signature");
    signaturePath = path;
  } else if (isStaticPath(seller.signature)) {
    signaturePath = seller.signature;
  }

  const row = {
    name: seller.name,
    mvda_reg_number: seller.mvdaRegNumber || "",
    address: seller.address || "",
    city_prov_pc: seller.cityProvPC || "",
    telephone: seller.telephone || "",
    fax: seller.fax || "",
    salesperson_registration: seller.salespersonRegistration || "",
    salesperson_name: seller.salespersonName || "",
    hst_registration: seller.hstRegistration || "",
    signature_path: signaturePath,
  };

  const query = seller.id
    ? supabase.from("sellers").update(row).eq("id", seller.id).select().single()
    : supabase.from("sellers").insert(row).select().single();
  const { data, error } = await query;
  fail(error, "Saving seller");
  return data.id;
}

export async function deleteSeller(id) {
  const { error } = await supabase.from("sellers").delete().eq("id", id);
  fail(error, "Deleting seller");
}

// ---------- BILLS ----------
export async function saveBill({ form, seller, pdfBlob, userEmail }) {
  const id = crypto.randomUUID();
  const now = new Date();
  const pdfPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${id}.pdf`;

  const { error: upErr } = await supabase.storage
    .from("bills")
    .upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
  fail(upErr, "Uploading PDF");

  // Don't store signature image data inside the snapshot
  // eslint-disable-next-line no-unused-vars
  const { signature, ...sellerSnapshot } = seller;

  const { error } = await supabase.from("bills").insert({
    id,
    created_by_email: userEmail || "",
    seller_id: seller.id || null,
    seller_name: seller.name || "",
    sale_date: form.date || null,
    purchaser_name: form.purchaserName || "",
    stock_number: form.stockNumber || "",
    vin: form.vinNumber || "",
    year: form.year || "",
    make: form.make || "",
    model: form.model || "",
    price: parseFloat(form.price) || 0,
    total: Number(form.total) || 0,
    form_data: form,
    seller_snapshot: sellerSnapshot,
    pdf_path: pdfPath,
  });
  if (error) {
    await supabase.storage.from("bills").remove([pdfPath]); // clean up orphan PDF
    fail(error, "Saving bill");
  }
  return id;
}

export async function listBills({ search = "", sellerId = "" } = {}) {
  let q = supabase
    .from("bills")
    .select(
      "id, created_at, created_by_email, seller_id, seller_name, sale_date, purchaser_name, stock_number, vin, year, make, model, price, total, pdf_path, form_data"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (sellerId) q = q.eq("seller_id", sellerId);

  const term = search.trim().replace(/[,()%*]/g, " ").trim();
  if (term) {
    const like = `%${term}%`;
    q = q.or(
      ["purchaser_name", "vin", "stock_number", "make", "model"]
        .map((c) => `${c}.ilike.${like}`)
        .join(",")
    );
  }

  const { data, error } = await q;
  fail(error, "Loading bills");
  return data;
}

export async function getBillPdfUrl(pdfPath, downloadName) {
  const { data, error } = await supabase.storage
    .from("bills")
    .createSignedUrl(pdfPath, 120, downloadName ? { download: downloadName } : undefined);
  fail(error, "Getting PDF link");
  return data.signedUrl;
}

export async function deleteBill(bill) {
  if (bill.pdf_path) await supabase.storage.from("bills").remove([bill.pdf_path]);
  const { error } = await supabase.from("bills").delete().eq("id", bill.id);
  fail(error, "Deleting bill");
}

// Previous purchasers (from past bills) for quick auto-fill
const PURCHASER_KEYS = [
  "purchaserName", "purchaserMvdaReg", "purchaserAddress", "purchaserCityProvPC",
  "purchaserTel", "purchaserFax", "purchaserSalespersonName",
  "purchaserSalespersonReg", "purchaserHstReg",
];

export async function loadPreviousPurchasers() {
  const { data, error } = await supabase
    .from("bills")
    .select("purchaser_name, form_data")
    .neq("purchaser_name", "")
    .order("created_at", { ascending: false })
    .limit(500);
  fail(error, "Loading purchasers");

  const seen = new Map();
  for (const row of data) {
    const key = row.purchaser_name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    const p = {};
    for (const k of PURCHASER_KEYS) p[k] = row.form_data?.[k] || "";
    seen.set(key, p);
  }
  return [...seen.values()].sort((a, b) => a.purchaserName.localeCompare(b.purchaserName));
}
