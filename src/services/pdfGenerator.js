import { PDFDocument, rgb } from "pdf-lib";

export async function generateBillOfSale(formData, seller) {
  // 1. Load blank template
  const templateBytes = await fetch("/UCDA_blank_template.pdf").then((res) =>
    res.arrayBuffer()
  );
  const pdfDoc = await PDFDocument.load(templateBytes);

  // 2. Get the form
  const form = pdfDoc.getForm();

  // Helper: safely set text field
  // Explicit font sizes (pt) for the vehicle / dealer / pricing block.
  // Without these, the template auto-sizes text to fill the tall boxes, so it prints huge.
  const FONT_SIZES = {
    STOCK: 9, YEAR: 9, MAKE: 9, MODEL: 9, COLOUR: 9, "TRIM LEVEL": 9, FUEL: 9,
    "SERIAL OR VIN": 11,
    ODOM: 9,
    PRICE: 10, HST: 10, LIC: 10, TOTAL: 10,
    "Salespersons Registration": 9, "Salespersons Name": 9, "HST Registration": 9,
    "Salespersons Registration_2": 9, "Salespersons Name_2": 9, "HST Registration_2": 9,
  };

  const setText = (fieldId, value) => {
    try {
      const field = form.getTextField(fieldId);
      if (FONT_SIZES[fieldId]) field.setFontSize(FONT_SIZES[fieldId]);
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
  // Leading spaces = left padding so text doesn't touch the cell border line
  const pad = (v) => (v ? `  ${v}` : "");
  setText("MAKE", pad(formData.make));
  setText("MODEL", pad(formData.model));
  setText("COLOUR", formData.colour);
  setText("TRIM LEVEL", formData.trimLevel);
  setText("FUEL", formData.fuelType);
  setText("SERIAL OR VIN", formData.vinNumber);
  setText("ODOM", formData.distanceTravelled);

  // ========== PRICING ==========
  setText("PRICE", `$${Number(formData.price || 0).toFixed(2)}`);
  // HST / Deposit / Total: the template's small printed "$" is covered later (after flatten)
  // and we print our own "$" so it lines up with the amount, same as PRICE.
  setText("HST", ` $${Number(formData.hst || 0).toFixed(2)}`);
  setText("LIC", formData.deposit ? ` $${Number(formData.deposit).toFixed(2)}` : " $");
  setText("TOTAL", ` $${Number(formData.total || 0).toFixed(2)}`);

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
  // Remember where the HST / Deposit / Total boxes are before flattening
  const dollarBoxes = ["HST", "LIC", "TOTAL"]
    .map((id) => {
      try {
        return form.getTextField(id).acroField.getWidgets()[0].getRectangle();
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  form.flatten();

  // Cover the template's misaligned printed "$" in those boxes with white
  {
    const page = pdfDoc.getPages()[0];
    for (const r of dollarBoxes) {
      page.drawRectangle({
        x: r.x - 7,
        y: r.y + 1,
        width: 9,
        height: r.height - 2,
        color: rgb(1, 1, 1),
      });
    }
  }

  // ========== DRAW SELLER SIGNATURE IMAGE ==========
  // The signature field (/Sig type) can't be filled via form API,
  // so we draw it as an image directly on the page after flattening.
  if (seller.signature) {
    try {
      let sigImage;
      if (seller.signature.startsWith("data:")) {
        // Uploaded signature stored as a data URL (PNG or JPEG)
        const [meta, b64] = seller.signature.split(",");
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        sigImage = meta.includes("image/png")
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);
      } else {
        // Signature file: /public/signatures/... or a Supabase storage link
        const bytes = new Uint8Array(
          await fetch(seller.signature).then((r) => {
            if (!r.ok) throw new Error(`Signature not found (${r.status})`);
            return r.arrayBuffer();
          })
        );
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        sigImage = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      }

      const page = pdfDoc.getPages()[0];

      // Signature field rect: [18, 453.48, 216.12, 470.16]
      // Fit the image into the signature box above the "Signature" line
      const maxW = 150;
      const maxH = 30;
      const scale = Math.min(maxW / sigImage.width, maxH / sigImage.height);
      const sigWidth = sigImage.width * scale;
      const sigHeight = sigImage.height * scale;
      page.drawImage(sigImage, {
        x: 85,
        y: 455,
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
