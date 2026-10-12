# UCDA Wholesale Bill of Sale

A React web app that generates UCDA Wholesale Bill of Sale PDFs. Seller details come from saved seller profiles. Users fill in purchaser info, vehicle details, pricing, and disclosures through a clean multi-step form, then generate a properly filled PDF for preview and download.

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
  lib/supabase.js            ← Supabase client
  services/db.js             ← All database / storage calls
  services/pdfGenerator.js   ← Core PDF filling logic (pdf-lib)
  components/BillForm.jsx    ← Multi-step form UI
  App.jsx                    ← Main app layout
  App.css                    ← All styles
```

## Key Features

- **Seller profiles**: pick a seller; their details and signature are filled on every bill
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


## Database (Supabase)

Sellers, bill history, signature images and saved PDFs live in Supabase.
Users must sign in. **Setup instructions: see `SUPABASE_SETUP.md`.**

- **Bill Form** – pick a seller, fill the form, *Generate*, then *Save & Download PDF* (saves to History).
- **Previous Purchaser** dropdown auto-fills purchaser details from past bills.
- **History** – search by purchaser / VIN / stock / make / model, filter by seller, view or download PDFs,
  *Copy* a past bill into a new one, or delete.

## NHTSA VIN Decoder

Entering a full 17-character VIN calls the free NHTSA vPIC API and fills Year, Make, Model, Trim and Fuel Type.
Colour is not in a VIN and must be entered manually.
