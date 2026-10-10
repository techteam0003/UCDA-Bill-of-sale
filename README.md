# UCDA Wholesale Bill of Sale — Dreamfleet Inc.

A React web app that generates UCDA Wholesale Bill of Sale PDFs. Seller details are pre-filled for Dreamfleet Inc. Users fill in purchaser info, vehicle details, pricing, and disclosures through a clean multi-step form, then generate a properly filled PDF for preview and download.

## How It Works

The app uses **pdf-lib** to fill the **actual fillable form fields** embedded in the UCDA template PDF — no coordinate-based text overlay. This ensures clean, non-overlapping text that matches the official format.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# → http://localhost:5173
```

## Project Structure

```
public/
  UCDA_blank_template.pdf    ← Blank UCDA template with 74 fillable fields
src/
  config/sellerDefaults.js   ← Dreamfleet Inc. pre-filled data
  services/pdfGenerator.js   ← Core PDF filling logic (pdf-lib)
  components/BillForm.jsx    ← Multi-step form UI
  App.jsx                    ← Main app layout
  App.css                    ← All styles
```

## Key Features

- **Pre-filled seller**: Dreamfleet Inc. details auto-filled on every bill
- **5-step form**: Purchaser → Vehicle → Pricing → Disclosures → Searches
- **Auto-calculated**: HST (13%) and Total computed in real-time
- **VIN year detection**: Auto-detects model year from VIN's 10th character
- **Proper PDF filling**: Uses form field IDs, not coordinate overlay
- **Preview & Download**: In-browser PDF preview with one-click download
- **Responsive**: Works on desktop and mobile

## Deploy to Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # Set public dir to "dist"
npm run build
firebase deploy
```

## Tech Stack

- React + Vite
- pdf-lib (PDF form filling)
- No other dependencies needed


## Seller Profiles

The seller banner at the top of the form now has a dropdown plus **Edit**, **+ Add Seller** and **Delete** buttons.

- Dreamfleet Inc. is the built-in default (it can be edited but not deleted).
- Each seller can have its own signature image (PNG/JPG, under 500 KB). Sellers without a signature get an unsigned PDF.
- Sellers are saved in the browser's localStorage, so they persist on that computer/browser only.

## NHTSA VIN Decoder

When a full 17-character VIN is entered, the app calls the free NHTSA vPIC API
(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{VIN}?format=json`)
and fills in Year, Make, Model, Trim and Fuel Type. Body, engine, drive and plant info are shown for reference.
Colour is not encoded in a VIN and must be entered manually. If NHTSA can't be reached, the year is still
derived from the 10th VIN character. Logic lives in `src/services/vinDecoder.js`.
