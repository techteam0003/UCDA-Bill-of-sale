import { PDFDocument } from "pdf-lib";
import { SELLER_CONFIG } from "../config/sellerDefaults";

// Bikramjeet's signature as base64 PNG (transparent background)
const SELLER_SIGNATURE_B64 = "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";

export async function generateBillOfSale(formData, seller = SELLER_CONFIG) {
  // 1. Load blank template
  const templateBytes = await fetch("/UCDA_blank_template.pdf").then((res) =>
    res.arrayBuffer()
  );
  const pdfDoc = await PDFDocument.load(templateBytes);

  // 2. Get the form
  const form = pdfDoc.getForm();

  // Helper: safely set text field
  const setText = (fieldId, value) => {
    try {
      const field = form.getTextField(fieldId);
      field.setText(String(value || ""));
    } catch (e) {
      console.warn(`Field "${fieldId}" not found:`, e.message);
    }
  };

  // Helper: safely check checkbox
  const setCheck = (fieldId, isChecked) => {
    if (!isChecked) return;
    try {
      form.getCheckBox(fieldId).check();
    } catch (e) {
      console.warn(`Checkbox "${fieldId}" not found:`, e.message);
    }
  };

  // Helper: safely select radio
  const setRadio = (fieldId, value) => {
    if (!value) return;
    try {
      // PDF option names have no leading "/" (e.g. "BRAND_NONE", not "/BRAND_NONE")
      form.getRadioGroup(fieldId).select(String(value).replace(/^\//, ""));
    } catch (e) {
      console.warn(`Radio "${fieldId}" not found:`, e.message);
    }
  };

  // ========== DATE ==========
  setText("DATE", formData.date);

  // ========== SELLER (selected seller profile) ==========
  setText("MVDA REG", seller.mvdaRegNumber);
  setText("NAME", seller.name);
  setText("ADDRESS", seller.address);
  setText("CITY_PROV", seller.cityProvPC);
  setText("TEL", seller.telephone);
  setText("FAX", seller.fax);
  setText("Salespersons Registration", seller.salespersonRegistration);
  setText("Salespersons Name", seller.salespersonName);
  setText("HST Registration", seller.hstRegistration);

  // ========== PURCHASER (User Input) ==========
  setText("MVDA REG_2", formData.purchaserMvdaReg);
  setText("NAME_2", formData.purchaserName);
  setText("ADDRESS_2", formData.purchaserAddress);
  setText("CITY_PROV_2", formData.purchaserCityProvPC);
  setText("TEL_2", formData.purchaserTel);
  setText("FAX_2", formData.purchaserFax);
  setText("Salespersons Registration_2", formData.purchaserSalespersonReg);
  setText("Salespersons Name_2", formData.purchaserSalespersonName);
  setText("HST Registration_2", formData.purchaserHstReg);

  // ========== VEHICLE ==========
  setText("STOCK", formData.stockNumber);
  setText("YEAR", formData.year);
  setText("MAKE", formData.make);
  setText("MODEL", formData.model);
  setText("COLOUR", formData.colour);
  setText("TRIM LEVEL", formData.trimLevel);
  setText("FUEL", formData.fuelType);
  setText("SERIAL OR VIN", formData.vinNumber);
  setText("ODOM", formData.distanceTravelled);

  // ========== PRICING ==========
  setText("PRICE", `$${Number(formData.price || 0).toFixed(2)}`);
  setText("HST", `$${Number(formData.hst || 0).toFixed(2)}`);
  setText("LIC", formData.deposit ? `$${Number(formData.deposit).toFixed(2)}` : "$");
  setText("TOTAL", `$${Number(formData.total || 0).toFixed(2)}`);

  // ========== RADIO GROUPS ==========
  setRadio(
    "ODOM_TYPE",
    formData.distanceUnit === "MILES" ? "/ODOM_TYPE_MLS" : "/ODOM_TYPE_KMS"
  );

  const brandMap = {
    IRREPARABLE: "/BRAND_IRR",
    REBUILT: "/BRAND_REB",
    SALVAGE: "/BRAND_SAL",
    NONE: "/BRAND_NONE",
  };
  setRadio("BRAND", brandMap[formData.mtoBrand] || "/BRAND_NONE");

  if (formData.outOfProvince) {
    setRadio("OUTOFPROVINCE VEHICLE", "/Yes");
  }
  if (formData.usVehicle) {
    setRadio("OUTOFPROVINCE VEHICLE", "/Yes_2");
  }

  if (formData.odomFaultyOpt === "1A") {
    setRadio("ODOM_FAULTY_OPT", "/ODOM_FAULTY_OPT_1A");
  } else if (formData.odomFaultyOpt === "1B") {
    setRadio("ODOM_FAULTY_OPT", "/ODOM_FAULTY_OPT_1B");
  }

  if (formData.absInoperable === "YES") {
    setRadio("ABS_INOP", "/ABS_INOP_YES");
  } else if (formData.absInoperable === "NA") {
    setRadio("ABS_INOP", "/ABS_INOP_NA");
  }

  if (formData.airbagsInoperable === "YES") {
    setRadio("AB_INOP", "/AB_INOP_YES");
  } else if (formData.airbagsInoperable === "NA") {
    setRadio("AB_INOP", "/AB_INOP_NA");
  }

  // ========== CHECKBOXES ==========
  setCheck("CARFAX", formData.searchCarfax);
  setCheck("LIEN_SEARCH", formData.searchLien);
  setCheck("AUTO_CHECK", formData.searchAutoCheck);
  setCheck("OMHS", formData.searchOntarioHistory);
  setCheck("CAN_CHECK", formData.searchCanCheck);
  setCheck("OOP_LIEN_SEARCH", formData.searchOopLien);

  setCheck("ODOM_FAULTY", formData.odomFaulty);
  setCheck("DAILY_RENTAL", formData.dailyRental);
  setCheck("POLICE", formData.policeCruiser);
  setCheck("EMERG", formData.emergServices);
  setCheck("FIRE_DMG", formData.fireDamaged);
  setCheck("WATER_DMG", formData.waterDamaged);
  setCheck("TAXI", formData.taxiLimo);
  setCheck("REP_SUB", formData.repairsSuspension);
  setCheck("PCU_INOP", formData.pollutionControl);
  setCheck("STRUCT_DMG", formData.structuralDamage);
  setCheck("DMG_EXC", formData.damageExceeding3000);
  setCheck("TOTAL_LOSS", formData.totalLoss);
  setCheck("THFT_REC", formData.theftRecovery);
  setCheck("ORIG_MAN_CHNG", formData.badgesSpecsChanged);
  setCheck("WARR_CANC", formData.warrantyCancelled);
  setCheck("BODY_PNLS", formData.bodyPanels);
  setCheck(
    "NO DISCLOSURES ARE REQUIRED TO BE MADE FOR THIS VEHICLE",
    formData.noDisclosures
  );

  if (formData.odomFaulty && formData.odomFaultyOpt === "1A") {
    // These are single-option radio groups in the template, not checkboxes
    if (formData.odomPrevUnit === "KM") {
      setRadio("ODOM_TKU_KM", "Choice1");
    } else {
      setRadio("ODOM_TKU", "ODOM_TKU_MLS");
    }
  }

  // ========== DISCLOSURE TEXT ==========
  setText("IF YES IDENTIFY PROVINCES ANDOR STATES 1", formData.provinceState1);
  setText("IF YES IDENTIFY PROVINCES ANDOR STATES 2", formData.provinceState2);
  setText("IF YES IDENTIFY PROVINCES ANDOR STATES 3", formData.provinceState3);
  setText("ODOM_PREV_READING", formData.odomPrevReading);
  setText("ODOM_DOR", formData.odomDateOfReading);
  setText("DISC", formData.otherDisclosures);
  setText("DISC_2", formData.detailsLine1);
  setText("DISC_3", formData.detailsLine2);
  setText("DISC_4", formData.detailsLine3);

  // ========== FLATTEN FORM ==========
  form.flatten();

  // ========== DRAW SELLER SIGNATURE IMAGE ==========
  // The signature field (/Sig type) can't be filled via form API,
  // so we draw it as an image directly on the page after flattening.
  if (seller.signature) {
    try {
      let sigImage;
      if (seller.signature === "builtin") {
        const sigBytes = Uint8Array.from(atob(SELLER_SIGNATURE_B64), (c) => c.charCodeAt(0));
        sigImage = await pdfDoc.embedPng(sigBytes);
      } else {
        // Uploaded signature stored as a data URL (PNG or JPEG)
        const [meta, b64] = seller.signature.split(",");
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        sigImage = meta.includes("image/png")
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);
      }

      const page = pdfDoc.getPages()[0];

      // Signature field rect: [18, 453.48, 216.12, 470.16]
      // Fit the image into the signature box above the "Signature" line
      const maxW = 135;
      const maxH = 30;
      const scale = Math.min(maxW / sigImage.width, maxH / sigImage.height);
      const sigWidth = sigImage.width * scale;
      const sigHeight = sigImage.height * scale;
      page.drawImage(sigImage, {
        x: 45,
        y: 458,
        width: sigWidth,
        height: sigHeight,
      });
    } catch (e) {
      console.warn("Could not embed signature:", e.message);
    }
  }

  // ========== SAVE ==========
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
