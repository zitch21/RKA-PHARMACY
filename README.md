# INVENTORY MANAGEMENT SYSTEM FOR CLINIC PHARMACY SUPPLIES WITH AUTOMATED STOCK ALERT AND EXPIRATION TRACKING (FEFO+)

**Client**: R.K.A Pharmacy, San Antonio, Agoo, La Union  
**Owner / Administrator**: Lourdes Gincen L. Cesista  
**Institution**: Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)  
**College**: College of Computer Science, Agoo, La Union  
**Degree**: Bachelor of Science in Computer Science (August 2026 / S.Y. 2026–2027)  

**Researchers**:
- Hadriane Jerwin G. Estepa (Team Leader)
- Friah Yssabel D. Agbuya
- Emmanuel John P. Bernal
- Krissha Mae D. Estolero
- Mark Ivan G. Medrano
- Rafael E. Tan

**Thesis Adviser**: Nema Rose D. Rivera, DIT  
**Dean**: Charlie S. Marzan, PhD CS  

---

## 🌟 Overview & Key Research Novelty

This system resolves the core challenges of single-operator clinic pharmacies:
1. **Manual Recording Errors & Discrepancies**: Automated barcode-assisted stock-in and dispensing with physical HID scanners and internal barcode generation.
2. **First-Expiry-First-Out (FEFO) Enforcement**: Automatically recommends and deducts the earliest expiring active batch during dispensing. Expired batches (<= 0 days) are strictly blocked from release.
3. **Mandatory User Override Audit Logging**: If the operator chooses to dispense a batch other than the earliest expiring one, the system enforces entering a justification reason and permanently logs the transaction in the immutable audit trail.
4. **Enhanced FEFO+ Consumption Risk Analysis**: Traditional systems only consider expiration date. FEFO+ computes the **Expiry Risk Margin (ERM)** by calculating how fast the medicine is selling:
   $$\text{Days to Expiry} = \text{Batch Expiration Date} - \text{Current Date}$$
   $$\text{Days to Consume} = \frac{\text{Current Batch Stock}}{\text{Average Daily Quantity Sold (ADQS)}}$$
   $$\text{Expiry Risk Margin (ERM)} = \text{Days to Expiry} - \text{Days to Consume}$$
   - When $\text{ERM} < 0$, the batch is flagged as **High Waste Risk** (will not sell out before expiration), enabling the owner to accelerate dispensing or stop placing replenishment orders.
5. **Suggested Reorder Level Planner**:
   $$\text{Suggested Reorder Level} = \text{ADQS} \times (\text{Supplier Lead Time in Days} + \text{Safety Buffer Days})$$
   - Displayed side-by-side with the owner's manual threshold with a 1-click button to synchronize.
6. **Policy Simulation & Comparative Evaluation**: Built-in simulation engine comparing **FIFO vs standard FEFO vs FEFO+** and **static vs dynamic reorder levels**, producing exportable analysis tables and visual performance charts.

---

## 🚀 Quick Start & How to Run

### Option A: Portable Offline Client (Recommended for Clinic Workstation & Teammates)
> **Zero Installation Required**: Portable Node.js runtime, SQLite database, backend APIs, and compiled frontend are 100% self-contained. No internet, Node.js, or external database installation needed.

1. **Extract the ZIP Archive:**
   - If transferring via USB flash drive, right-click the `.zip` file (e.g. `RKA-Pharmacy-IMS-Client-Offline.zip`) and select **Extract All...** to a permanent directory (e.g., `Documents`, `C:\`, or your personal workspace).
   - *Important:* Do **not** run files directly from inside the Windows `.zip` preview window.
2. **Create Desktop Shortcut:**
   - Open the extracted `RKA-Pharmacy-IMS-Client-Offline` folder.
   - Double-click `Setup-Desktop-Shortcut.bat`.
   - The installer automatically detects your Windows Desktop folder (including OneDrive-backed Desktops) and places an **R.K.A Pharmacy IMS** shortcut on your desktop.
3. **Launch the Application:**
   - Double-click the shortcut on your Desktop or run `RKA-Pharmacy-IMS.exe` (or `start-app.bat`).
   - If Windows SmartScreen displays *"Windows protected your PC"*, click **More info** -> **Run anyway**.
   - The application will automatically open in a clean, dedicated app window at: **http://localhost:5000**

---

### Option B: Full-Stack Developer Mode (Source Code)

#### Prerequisites
- Node.js (v18+ LTS recommended)
- npm

#### 1. Install Dependencies
```bash
# Install root backend dependencies
npm install

# Install client frontend dependencies
cd client
npm install
cd ..
```

#### 2. Seed the Database (First-Time Setup)
```bash
npm run seed
```

#### 3. Run Development Servers (Hot Reload)
```bash
# Terminal 1 - Backend Server (Port 5000):
npm run dev:server

# Terminal 2 - Frontend Vite Client (Port 3000):
npm run dev:client
```
Open your browser to **http://localhost:3000**. Client requests to `/api` are automatically proxied to port 5000.

#### 4. Run Unified Production Server
```bash
# Build client and start backend
npm run build
npm start
```
Open **http://localhost:5000**.

---

## 📂 System Structure

```
rka-pharmacy-ims/
├── RKA-Pharmacy-IMS-Client-Offline/ # Portable standalone client distribution
│   ├── RKA-Pharmacy-IMS.exe         # Native lightweight background launcher
│   ├── Setup-Desktop-Shortcut.bat   # Adaptive desktop shortcut installer (OneDrive-compatible)
│   ├── start-app.bat                # Direct batch launcher with auto-directory switch
│   ├── runtime/node.exe             # Self-contained Node.js v24.14.0 binary
│   ├── server/                      # Express backend & SQLite database
│   │   ├── data/
│   │   │   ├── pharmacy_inventory.db # SQLite database in WAL mode
│   │   │   └── backups/             # Rolling 30-day automated local backups
│   │   ├── db.js
│   │   ├── index.js
│   │   └── routes/
│   ├── client/dist/                 # Precompiled React 19 production bundle
│   └── node_modules/                # Pre-bundled runtime dependencies
├── server/                          # Development backend source
│   ├── index.js                     # Express app entry point & static file server
│   ├── db.js                        # SQLite database configuration & audit trail logger
│   ├── seed.js                      # Initial clinic inventory & 35-day transaction ledger
│   └── routes/
│       ├── medicines.js             # Medicine profile CRUD & barcode lookup
│       ├── batches.js               # Batch intake, listing, and safe disposal
│       ├── transactions.js          # Dispensing (FEFO), overrides, adjustments
│       ├── fefoPlus.js              # Consumption velocity & suggested reorder calculations
│       ├── alerts.js                # Real-time multi-tier stock and expiry alerts
│       ├── simulation.js            # Policy simulation engine
│       ├── audit.js                 # Audit trail ledger & CSV export
│       └── settings.js              # Configurable expiry countdown tiers & parameters
└── client/                          # Frontend source code
    ├── src/
    │   ├── App.jsx                  # Main application & routing
    │   ├── index.css                # Tailwind CSS styles & printable print-media rules
    │   ├── components/
    │   │   ├── Navbar.jsx                   # Navigation, live DB status indicator, quick exit
    │   │   ├── BarcodeModal.jsx             # Code128 barcode generator & printable labels
    │   │   ├── AddMedicineModal.jsx         # New item profile & internal code generator
    │   │   ├── EditMedicineModal.jsx        # Edit medicine profile & reorder thresholds
    │   │   ├── EditBatchModal.jsx           # Edit batch unit cost & selling price with audit trail
    │   │   ├── ExitConfirmModal.jsx         # Exit confirmation prompt to prevent accidental close
    │   │   ├── HelpGuideModal.jsx           # Dual-version help guide (v1 Counter & v2 Advanced FEFO+)
    │   │   ├── OverrideModal.jsx            # Mandatory FEFO override prompt
    │   │   ├── DisposalModal.jsx            # Expired/damaged stock disposal
    │   │   ├── StockAdjustmentModal.jsx     # Physical count reconciliation
    │   │   └── AlertNotificationDropdown.jsx# Active alert summary drawer
    │   └── views/
    │       ├── DashboardView.jsx            # KPIs, countdown breakdown, FEFO+ risk alerts
    │       ├── InventoryView.jsx            # Medicine catalog & collapsible batch drawer
    │       ├── StockInView.jsx              # Batch receiving & expiry preview
    │       ├── StockOutView.jsx             # Barcode dispensing, auto-FEFO, receipt print
    │       ├── FefoPlusView.jsx             # Consumption analysis & suggested reorders
    │       ├── AuditTrailView.jsx           # Immutable audit log with CSV export
    │       ├── SimulationView.jsx           # Policy simulation comparison
    │       └── SettingsView.jsx             # Configurable countdown tiers & clinic info
    └── dist/                                # Production web bundle
```

---

## 🧪 Functional Verification Checklist

- [x] **Barcode Scanner Integration**: Supports physical HID barcode readers (Enter trigger) and manual search.
- [x] **Internal Barcode Generation**: Generates `RKA-MED-XXX-INT` barcodes and renders printable shelf stickers for repacked items.
- [x] **Expiry Risk Countdown**:
  - Safe: > 180 days
  - Monitor: 91 to 180 days
  - Warning: 31 to 90 days
  - Critical: 1 to 30 days
  - Expired: <= 0 days
- [x] **Expired Stock Safety Block**: Batches with <= 0 days are strictly blocked from release.
- [x] **Auto-FEFO Selection**: Automatically pre-selects earliest expiring unexpired batch during stock-out.
- [x] **Audit-Logged Override**: Mandates entering an override justification when selecting non-FEFO batches.
- [x] **FEFO+ Expiry Risk Margin Calculation**: Automatically calculates ERM = Days to Expiry - Days to Consume and identifies high-waste-risk batches.
- [x] **Dynamic Suggested Reorder Level**: Calculates ADQS * (LeadTime + BufferDays) with 1-click apply.
- [x] **Safe Disposal & Stock Adjustments**: Tracks spoiled and recount items with reasons.
- [x] **Policy Simulation Module**: Replays transactions under FIFO, FEFO, and FEFO+ to compare waste percentages and stockouts.
- [x] **Stock-In Pricing Governance**: Rejects batches with ₱0 or empty cost/selling price. Supports selecting pricing from previous batches of the same medicine or entering custom pricing.
- [x] **Dispensing Price Immutability**: Dispensing unit prices and receipt slips are strictly locked and read-only. Price adjustments are restricted to "Medicines & Batches" and recorded under `PRICE_ADJUSTMENT` in the audit ledger.
- [x] **Accidental Exit Confirmation**: Prompts the user before closing via browser `beforeunload` events and an in-app Exit modal.
- [x] **Database & System Connectivity Status**: Displays a live indicator (`● DB Online • FEFO+ Active`) in the header confirming server and database availability.
- [x] **Settings Default Restoration**: 1-click restore to standard expiration tiers (180, 91, 31, 1) and FEFO+ parameters (buffer: 3, history: 30) with idempotency notice ("Already in default settings").
- [x] **Dual-Mode UI (Clean vs Maximalist)**: Clean / Minimalist mode eliminates cognitive clutter for fast counter dispensing; Maximalist mode shows complete mathematical formulas, KPI grids, and clinical telemetry.
- [x] **Comprehensive Help Guide (v1 & v2)**: Version 1 covers standard counter operations; Version 2 provides an advanced system guide for FEFO+ intelligence, audit logs, policy simulations, and configuration settings.

