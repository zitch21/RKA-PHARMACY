# R.K.A Pharmacy Inventory Management System (FEFO+)

> **Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO**

[![Platform: Windows 10 / 11](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(64--bit)-blue.svg)](#system-requirements)
[![Architecture: Offline-First](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20SQLite%20WAL-success.svg)](#system-overview--key-features)
[![Security: Scrypt Hashing](https://img.shields.io/badge/Security-Scrypt%20Hashed%20Auth%20%7C%20Route%20Guard-purple.svg)](#-operator-authentication--security)
[![Integrity Suite: Verified](https://img.shields.io/badge/Integrity%20Suite-Database%20%26%20FEFO%20Verified-emerald.svg)](#-automated-verification-suite)
[![Linter: Oxlint Clean](https://img.shields.io/badge/Linter-Oxlint%20Clean%20(0%20errors)-teal.svg)](#-automated-verification-suite)
[![Sandbox: Isolated Demo DB](https://img.shields.io/badge/Sandbox-Header--Isolated%20Demo%20DB-amber.svg)](#-interactive-demo-sandbox-architecture)
[![License: Academic Research](https://img.shields.io/badge/License-Academic%20Research%20Project-orange.svg)](#-project--research-attribution)

---

## 🏛️ Project & Research Attribution

* **Academic Institution:** Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)
* **College:** College of Computer Science, Agoo, La Union
* **Degree Program:** Bachelor of Science in Computer Science (S.Y. 2026–2027)
* **System Title:** Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO
* **Client Partner:** R.K.A Pharmacy, San Antonio, Agoo, La Union
* **Clinic Administrator / Sole Proprietor:** Lourdes Gincen L. Cesista

### Research & Development Team
* **Hadriane Jerwin G. Estepa** – *Team Leader*
* **Emmanuel John P. Bernal** – *Lead Developer & Researcher*
* **Friah Yssabel D. Agbuya** – *Researcher*
* **Krissha Mae D. Estolero** – *Researcher*
* **Mark Ivan G. Medrano** – *Researcher*
* **Rafael E. Tan** – *Researcher*

**Thesis Adviser:** Nema Rose D. Rivera, DIT  
**Dean, College of Computer Science:** Charlie S. Marzan, PhD CS  

---

## 🌟 System Overview & Key Features

The **R.K.A Pharmacy Inventory Management System** is a mission-critical, standalone workstation application engineered specifically for community and clinic pharmacies. Built with an **offline-first** architecture, the system operates completely independently of external cloud providers, guaranteeing 100% uptime during provincial power disruptions or internet outages.

### Core Capabilities
* 🖥️ **Clean & Simple vs. Maximalist UI Modes**: Instant workstation layout switcher.
  * **Clean & Simple Mode:** Streamlines the dispensary into 4 essential tabs (*Dashboard, Dispense / POS, Stock In, Inventory*) with enlarged touchpoints, condensed summary cards, and minimal clutter for fast peak-hour counter dispensing.
  * **Maximalist Mode:** Full 9-view operational environment displaying complete analytical graphs, Purchase Orders procurement, FEFO+ risk calculators, immutable audit trail, policy simulation, and system settings.
* 🌗 **Theme Engine (Light & Dark Clinical Modes)**: Zero-lag contrast toggle between daytime clinical white and low-strain dark workstation theme, persisted across reloads in `localStorage` (`rka_theme`).
* 🧪 **Interactive Demo Sandbox Architecture**: Isolated demonstration clinic sandbox powered by `server/data/pharmacy_demo.db`.
  * **Header-Scoped Isolation**: Requests tagged with `x-demo-mode: true` are transparently routed to the demo database via Node.js `AsyncLocalStorage` (`dbContext`). Live production records (`pharmacy_inventory.db`) remain 100% untouched.
  * **1-Click Sandbox Reset**: Reset the sandbox back to pristine baseline clinic records at any time from the top warning banner or Settings view.
* 🔍 **Global Omni-Search (`/` or `Ctrl+K`)**: Universal search modal (`GlobalSearchModal`) allowing rapid catalog queries, active batch lookups, supplier PO searches, and action navigation from anywhere in the workstation.
* 📅 **Dispensary Operational Calendar**: Visualizes upcoming batch expiry horizons, scheduled supplier intakes, and daily dispensary milestones in an interactive calendar modal (`DispensaryCalendarModal`).
* 🔊 **Web Audio Synthesized Telemetry**: Built-in Web Audio API tone generator (`audioTelemetry.js`) providing instant auditory confirmation for:
  * Successful barcode scans (clean, bright chime).
  * Unrecognized barcodes or quantity errors (double low-pitched buzz).
  * Critical expiration batch alerts (warning tone for batches $\le 30$ days).
* 🌐 **Offline Tri-Lingual Localization**: Instant header switcher between **English (`EN`)**, **Simple Filipino (`FIL`)**, and **Taglish (`TAGLISH`)**. Operates 100% offline via embedded dictionary across all 9 views, action dialogs, and verification popups.
* 📦 **Batch-Level Tracking & Barcode Operations**: Full plug-and-play support for standard USB HID barcode scanners. Generates internal Code 128 barcodes and printable shelf labels for unbarcoded or repacked supplies.
* ⏳ **FEFO+ (Enhanced First-Expiry-First-Out) Dispensing**: Automatically selects and dispenses the earliest expiring active batch.
  * **Safe** (> 180 days) & **Monitor** (91–180 days): Direct release.
  * **Warning** (31–90 days), **Critical** (1–30 days), & **At-Risk**: Requires explicit user confirmation before release.
  * **Expired** ($\le 0$ days): **Strictly blocked** from selection and dispensing.
  * **Multi-Batch Auto-Allocation**: Large dispensing orders automatically split sequentially across earliest-expiring active batches when a single batch has insufficient quantity.
* ⚡ **Cumulative Quick Dispense & Date Jump Ergonomics**:
  * **Quick Dispense Buttons (`+1, +5, +10, Max`)**: Stackable quantity increments with automatic stock clamping (`Math.min`) to prevent accidental over-dispensing.
  * **Intake Date Jump Buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`)**: 1-click expiration date setting with calendar-safe month-end clamping (`setDate(0)`) for rapid stock intake.
* 🧠 **Demand Forecasting & Expiry Risk Margin (FEFO+)**: Computes moving average daily demand over a configurable baseline window ($N \in \{10, 20, 30\}$ operational days). Quantifies Days to Depletion, Expiry Risk Margin, and Predicted Expired Waste ($Q_{\text{waste}}$).
* 🛡️ **Cold-Start Suppression Rule**: When transactional history is below the configured window ($t < N$), automated algorithmic reorder generation is safely suppressed with an informative banner, falling back to manual clinic reorder thresholds and standard FEFO allocation.
* 📑 **Purchase Orders & Procurement Lifecycle**: Complete procurement tracking from 1-click reorder drafts to placed supplier orders, receiving into active inventory batches, and printable voucher slips.
  * **Configurable Auto-Drafting Modes**: Choose between *Manual Review Mode* and *Instant Auto Mode* in Settings.
  * **FEFO+ Reorder Planner Bulk Draft**: Interactive multi-supplier procurement modal with item deletion, cost editing, and optional catalog threshold synchronization.
  * **Supplier DR / Sales Invoice Number Storage**: Delivery Receipt / Sales Invoice numbers are tracked upon receipt and propagated directly to active inventory batch records (`batches.supplier_dr_number`).
* 📈 **Dynamic Suggested Reorder Planner**: Dynamically calculates replenishment reorder points:
  $$\text{Reorder Point (ROP)} = (\text{Daily Demand} \times \text{Lead Time}) + \text{Safety Buffer}$$
* 🔄 **Multi-Tab Workstation Synchronization**: Browser-native `BroadcastChannel` (`rka_inventory_sync`) propagates stock changes, sales, and alert dismissals instantly across all open browser tabs without WebSockets.
* 🎫 **High-Entropy Collision-Resistant Receipts**: POS generates receipt codes with 24-bit cryptographic hexadecimal entropy (`RCPT-YYYYMMDD-XXXXXX`), preventing collisions during rapid sales.
* 🔔 **Persistent Stock & Expiry Alert Acknowledgment**: Active alerts remain visible on the dashboard and notification center until explicitly acknowledged by an operator, with all acknowledgments logged in the audit trail.
* 🔬 **Policy Simulation Engine**: In-memory policy simulator comparing FIFO vs FEFO vs FEFO+ over configurable simulation windows with pre-loaded multi-batch benchmark scenarios demonstrating waste reduction and safety buffer efficacy.
* 🔒 **Operator Authentication & Scrypt Password Security**: Multi-tier operator accounts with passwords hashed using Node.js native `scrypt` cryptographic key derivation. Station auto-locks behind an authentication screen when unauthenticated.
* 🛡️ **Locked Counter Pricing & Immutable Audit Trail**: Dispensing prices are strictly locked at register level to prevent unauthorized alteration. Any non-FEFO batch overrides require mandatory justification notes.
* 💾 **Dual-Layer Database Disaster Recovery & Removable USB Backup**:
  * **Smart "Backup & Exit" Modal**: Windows CIM disk scanner detects connected USB flash drives; exports point-in-time WAL-checkpointed database copies directly to removable media before clean workstation shutdown.
  * **Administrative CLI Restore (`server/restore.js`) & Web UI Restore API**: Fast, zero-data-loss database restoration with automated pre-restore safety snapshots (`pharmacy_pre_restore_*.db`) and schema integrity verification (`PRAGMA integrity_check`).
  * **Factory System Reset**: Securely wipes medicines, batches, transactions, and audit logs for clean clinic onboarding while preserving operator credentials and generating an automated safety snapshot (`pharmacy_pre_reset_*.db`).
  * **1-Click EOD Reconciliation Backup**: Generates an instant point-in-time close-out archive for daily bookkeeping and disaster readiness.

---

## 🔐 Operator Authentication & Security

The system enforces authentication to protect clinical inventory and pricing data:

| Role | Username | Default Password | Operator Name | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator / Owner** | `admin` | `rka2026` | **Lourdes Gincen L. Cesista** | Full access: Dispensing, Intake, Price Adjustment, Reorder Setup, Backups, User Management |

> [!IMPORTANT]
> Passwords are never stored in plaintext. They are protected using **Scrypt key-derivation hashing** with unique cryptographic salts. Passwords can be changed anytime in the **Settings** view. All mutating routes (`POST`, `PUT`, `DELETE`, `PATCH`) are enforced by `server/middleware/authMiddleware.js`.

---

## 📖 How to Use the System (Interactive In-App Guide: Basic & Advance)

The system includes a comprehensive, interactive **"How to Use"** guide modal directly accessible by clicking the **"Help Guide"** button in the sidebar (or pressing the **`F1`** hotkey anywhere in the workstation). It provides two dedicated guide modes:

* **🌿 Basic Guide (Counter Quick):** Step-by-step instructions for counter dispensing, barcode scanning, stock intake, and daily workstation routines.
* **⚙️ Advance Guide (System & Admin):** Comprehensive reference for FEFO+ predictive algorithms, purchase order procurement, disaster recovery, and audit compliance.

### 🌿 Basic Operations (Counter Dispensary & Daily Operations)
1. **Launch & Login:** Double-click the desktop shortcut, enter credentials (`admin` / `rka2026`), and unlock the station.
2. **Dispense / POS (F2):**
   * Scan medicine barcode with USB barcode reader or search by name.
   * Earliest expiring batch is auto-allocated by the FEFO engine.
   * Click quick dispense pills (`+1, +5, +10, Max`) to set quantity.
   * If batch has $\le 90$ days remaining, confirm the Warning/Critical dialog. Expired batches ($\le 0$ days) are strictly blocked.
   * Apply Senior Citizen / PWD 20% discount if applicable.
   * Enter customer cash tender and click **Complete & Print Receipt** (`RCPT-YYYYMMDD-XXXXXX`).
3. **Stock-In (Intake):**
   * Select medicine, enter batch lot number and supplier DR / Sales Invoice number.
   * Use quick-jump date buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`) for rapid expiration date setting.
   * Verify previous unit cost and selling price, then click **Commit Stock In**.
4. **Alerts:** Click the header alert bell to review and acknowledge expiring or low-stock items.
5. **End-of-Day USB Backup:** Plug in clinic USB flash drive, click **Backup & Exit**, select the drive, and shut down cleanly.

### ⚙️ Advanced Operations (Inventory Intelligence, Procurement, & Admin)
1. **FEFO+ Risk Analysis:**
   * Review Days to Depletion ($T_{\text{consume}}$), Expiry Risk Margin ($\Delta T$), and Predicted Expired Waste ($Q_{\text{waste}}$).
   * Adjust rolling observation baseline window ($N \in \{10, 20, 30\}$ days).
   * Note the Cold-Start Rule banner ($t < N$) when operating on early transactional history.
2. **Purchase Orders Procurement Lifecycle:**
   * In **FEFO+ Reorder Planner**, click **"Bulk Draft Purchase Orders"** to review suggested reorder items, adjust quantities, delete unneeded rows, and optionally sync dynamic ROPs to catalog records.
   * Advance POs from `DRAFT` to `PLACED`, and print official PO slip vouchers with authorized signature blocks.
   * Click **Receive Delivery** on arrival, enter Supplier DR number, and auto-convert line items into active inventory batches.
3. **Policy Simulation:** Compare historical FIFO vs FEFO vs FEFO+ waste outcomes and savings across 30, 60, 90, or 180-day horizons.
4. **Audit Trail Compliance:** Search and filter sensitive actions, then click **Export to CSV** for FDA/DOH inspections.
5. **Disaster Recovery:** Use `node server/restore.js` or the Settings restore panel to roll back to any point-in-time snapshot with pre-restore safety guarantees.

---

## 📥 Quick Start Guide (Windows)

**No installation of Node.js, npm, or database software is required.** A portable Node.js LTS runtime is pre-bundled in the package.

### Step 1: Download the Repository ZIP
1. Visit the GitHub repository: **[https://github.com/zitch21/RKA-PHARMACY](https://github.com/zitch21/RKA-PHARMACY)**
2. Click **`Code`** > **`Download ZIP`**.
3. Save `RKA-PHARMACY-main.zip` to your computer.

### Step 2: Extract the ZIP Archive (Crucial Step)
> [!WARNING]
> Do **NOT** run files directly from inside the Windows `.zip` preview window. Running directly from a `.zip` executes in a temporary Windows sandbox, causing file loss and preventing database writes.

1. Right-click `RKA-PHARMACY-main.zip` > **Extract All...**.
2. Extract to a permanent location (e.g. `C:\RKA-PHARMACY`, `Documents`, or `Desktop`).

### Step 3: Create Desktop Shortcut (1-Click Installer)
1. Open the extracted folder: `RKA-Pharmacy-IMS-Client-Offline/`.
2. Double-click **`Setup-Desktop-Shortcut.bat`**.
3. A shortcut titled **"R.K.A Pharmacy IMS"** with the official logo will appear on your Windows Desktop (compatible with both local and OneDrive-synced Desktops).

### Step 4: Launch the Application
1. Double-click the **R.K.A Pharmacy IMS** desktop shortcut (or double-click `RKA-Pharmacy-IMS.exe` inside the folder).
2. If Windows SmartScreen appears (*"Windows protected your PC"*), click **More info** > **Run anyway**.
3. The system starts automatically in dedicated application mode at:
   ```text
   http://localhost:5000
   ```
4. Sign in with the default credentials (`admin` / `rka2026`).

---

## 🧪 Automated Verification Suite

The repository includes an automated verification script and static code analysis suite:

### 1. Database and Logic Integrity Check (`self_check.js`)
Validates database connectivity, core tables, catalog column structures, strict FEFO ascending order sorting, expiry countdown tiers, audit trail schemas, settings store, and factory reset detection:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
node tests/self_check.js
```
Expected output:
```text
--- R.K.A Pharmacy IMS: Verifying Database and Logic Integrity ---
✓ All core database tables exist.
✓ Medicine catalog structure verified (or factory reset state verified).
✓ FEFO ordering verified across active batches.
✓ Expiry tier calculation and day difference verified.
✓ Audit trail columns verified (operator, action, timestamp).
✓ Settings store verified (R.K.A Pharmacy).

========================================
 ALL INTEGRITY CHECKS PASSED SUCCESSFULLY 
========================================
```

### 2. Client Code Quality and Linter (`oxlint`)
Scans all React frontend components and utility files for syntax errors, accessibility issues, and dead code:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline\client
npm.cmd run lint
```
Expected output:
```text
> oxlint src
Found 0 warnings and 0 errors.
Finished in ~70ms on 35 files with 97 rules.
```

---

## 📂 Repository Structure

```text
RKA-PHARMACY/
├── README.md                          # Root project overview and repository navigation
├── DEVELOPER_GUIDE.md                 # Comprehensive developer manual & beginner guide
└── RKA-Pharmacy-IMS-Client-Offline/   # Standalone, portable client distribution
    ├── DEVELOPER_GUIDE.md             # Comprehensive developer manual & beginner guide
    ├── README.md                      # Client distribution guide
    ├── RKA-Pharmacy-IMS.exe           # Native C# launcher (silent background server + app mode)
    ├── Setup-Desktop-Shortcut.bat     # Client-level shortcut installer (OneDrive compatible)
    ├── start-app.bat                  # Client-level batch launcher
    ├── app-icon.ico                   # Workstation desktop icon (.ico)
    ├── app-icon.png                   # High-res application logo (.png)
    ├── tests/                         # Automated verification & diagnostic test scripts
    │   └── self_check.js              # Database integrity, FEFO ordering, and schema self-check
    ├── runtime/                       # Bundled portable Node.js v24.14.0 LTS runtime
    │   └── node.exe
    ├── server/                        # Express backend API & SQLite database
    │   ├── index.js                   # Application server entry point & static file server
    │   ├── db.js                      # SQLite WAL configuration, Scrypt hashing, and schema
    │   ├── seed.js                    # Initial clinic medicine catalog & 35-day transaction seed
    │   ├── restore.js                 # Administrative CLI disaster recovery & database restore
    │   ├── middleware/                # Server security & request context middleware
    │   │   └── authMiddleware.js      # Session token gate & mutation route protection
    │   ├── routes/                    # REST API endpoints
    │   │   ├── auth.js                # Scrypt login, session validation, password change
    │   │   ├── backup.js              # USB drive detection, WAL checkpoint, safe restore API
    │   │   ├── alerts.js              # Stock & expiry alerts with manual acknowledgment
    │   │   ├── batches.js             # Batch-level inventory tracking & barcode tags
    │   │   ├── medicines.js           # Medicine catalog & price management
    │   │   ├── purchaseOrders.js      # Purchase orders procurement & receiving lifecycle
    │   │   ├── transactions.js        # Stock-out POS, FEFO enforcement, multi-batch split
    │   │   ├── fefoPlus.js            # FEFO+ Daily demand, Days to Depletion & reorder formulas
    │   │   ├── audit.js               # Immutable audit trail ledger & CSV export
    │   │   ├── simulation.js          # FIFO vs FEFO vs FEFO+ policy simulation
    │   │   ├── settings.js            # Baseline window (N), threshold & clinic config store
    │   │   └── evaluations.js         # System Usability Scale (SUS) survey engine
    │   └── data/                      # Embedded databases & rolling backups
    │       ├── pharmacy_inventory.db  # Live production database (WAL mode enabled)
    │       ├── pharmacy_demo.db       # Isolated demo sandbox database
    │       └── backups/               # Automated rolling daily backups & safety snapshots
    ├── client/
    │   ├── src/                       # Complete React 19 + Tailwind CSS source code
    │   │   ├── assets/                # Visual branding & logos
    │   │   ├── components/            # Modals, Navbar, Alert Dropdowns, Search & Calendar
    │   │   │   ├── Navbar.jsx         # Sidebar navigation, top header capsule, status badges
    │   │   │   ├── LoginModal.jsx     # Scrypt workstation authentication lock screen
    │   │   │   ├── GlobalSearchModal.jsx # Universal omni-search modal (/ or Ctrl+K)
    │   │   │   ├── DispensaryCalendarModal.jsx # Operational calendar & expiry horizons
    │   │   │   ├── AddMedicineModal.jsx # Register new medicine profiles
    │   │   │   ├── EditMedicineModal.jsx # Edit medicine metadata & reorder thresholds
    │   │   │   ├── EditBatchModal.jsx # Adjust batch pricing & details
    │   │   │   ├── BatchStatusConfirmModal.jsx # Warning/Critical release confirmation gate
    │   │   │   ├── OverrideModal.jsx  # Mandatory FEFO override justification dialog
    │   │   │   ├── StockAdjustmentModal.jsx # Manual stock adjustment with audit logging
    │   │   │   ├── DisposalModal.jsx  # Safe batch quarantine and disposal documentation
    │   │   │   ├── BarcodeModal.jsx   # Live GS1-128 / Code 128 barcode generator
    │   │   │   ├── AlertNotificationDropdown.jsx # Dropdown with real-time alert acknowledgments
    │   │   │   ├── HelpGuideModal.jsx # Dual-mode operational guide (Basic & Advanced)
    │   │   │   ├── ExitConfirmModal.jsx # Station exit confirmation & backup prompt
    │   │   │   └── ErrorBoundary.jsx  # React UI crash shield
    │   │   ├── context/               # LanguageContext (offline tri-lingual switcher)
    │   │   ├── i18n/                  # Offline translation dictionary (EN, FIL, TAGLISH)
    │   │   ├── utils/                 # Utilities (api, apiInterceptor, audioTelemetry, sync)
    │   │   │   ├── api.js             # Central fetch wrappers
    │   │   │   ├── apiInterceptor.js  # Demo mode header injection (x-demo-mode)
    │   │   │   ├── audioTelemetry.js  # Web Audio API barcode & alert sound synthesizers
    │   │   │   ├── dateFormatter.js   # Philippine locale date formatter
    │   │   │   └── syncChannel.js     # BroadcastChannel multi-tab state synchronization
    │   │   ├── views/                 # Full-page screens corresponding to navigation tabs
    │   │   ├── App.jsx                # Main workstation shell & authentication guard
    │   │   ├── index.css              # Global styles and Tailwind directives
    │   │   └── main.jsx               # React entry point
    │   └── dist/                      # Precompiled production bundle served by Express
    └── node_modules/                  # Bundled production dependencies (better-sqlite3 x64 native)
```

---

## 🖥️ Application Modules Summary

* **Dual UI Modes**: Clean & Simple Mode (essential 4 tabs for rapid counter dispensing) vs. Maximalist Mode (all 9 views with full analytics, procurement, audit trail, simulation, and settings).
* **Theme Engine**: Daytime Light Mode and Low-Strain Dark Mode with instant hotkey switching.
* **Demo Sandbox**: Header-scoped SQLite isolation (`pharmacy_demo.db`) for risk-free demonstrations without touching production records.
* **Tri-Lingual Localization**: 100% offline switcher supporting English (`EN`), Simple Filipino (`FIL`), and Taglish (`TAGLISH`) across all 9 views, tables, action buttons, and confirmation dialogs.
* **Dashboard**: Key operational metrics, daily sales totals, active inventory value, 5-tier expiry countdown breakdown, persistent priority alert banner, and 1-Click EOD Reconciliation Backup.
* **Medicines & Batches**: Master catalog management, batch intake, batch cost/price adjustments, supplier DR / Sales Invoice tracking, and printable Code 128 shelf labels.
* **Stock In (Intake)**: Intake workflow with pricing validation, previous batch price inheritance, calendar-safe expiration date jump buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`), supplier DR recording, and expiration date preview.
* **Purchase Orders**: Full procurement management lifecycle with configurable drafting modes (`manual` vs `instant_auto`). Convert suggested reorders into draft POs, place orders with suppliers, print formal PO slip vouchers with authorized signature blocks, receive delivered items into active inventory batches with DR tracking, and manage cancellations.
* **Stock Out (Dispensing / POS)**: Real-time barcode scanning, audio telemetry feedback, cumulative quick dispense buttons (`+1, +5, +10, Max`) with stock clamping, automated multi-batch FEFO allocation, Warning/Critical confirmation modal, mandatory override justifications, locked counter pricing, collision-resistant receipt numbers (`RCPT-YYYYMMDD-XXXXXX`), and printable receipts.
* **FEFO+ Risk & Reorder**: Daily demand moving average, Days to Expiry, Days to Depletion, Expiry Risk Margin, Cold-Start threshold banner, and interactive multi-supplier Bulk Suggested Reorder synchronization into Purchase Orders with optional catalog ROP updates.
* **Audit Trail**: Tamper-evident ledger logging dispensing overrides, batch price adjustments, alert acknowledgments, baseline window modifications, purchase order actions, backups, and user logins with CSV export.
* **Policy Simulation**: Comparative historical evaluation between FIFO, standard FEFO, and FEFO+ models with benchmark multi-batch scenarios demonstrating waste reduction and safety buffer efficacy.
* **Settings**: Configurable baseline observation window ($N \in \{10, 20, 30\}$ days), PO auto-drafting mode toggle, expiration countdown tiers, supplier lead time, safety buffer days, removable USB storage backup export, dual-layer database restore, factory system reset with pre-wipe safety snapshots, and operator password management.

---

## 📖 In-Depth Developer Guide

For complete technical documentation, mathematical formulas, SQLite B-tree index schemas, disaster recovery protocols, and a **step-by-step onboarding walkthrough for beginner developers**, please refer to:

👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** (or in client folder: [RKA-Pharmacy-IMS-Client-Offline/DEVELOPER_GUIDE.md](RKA-Pharmacy-IMS-Client-Offline/DEVELOPER_GUIDE.md))

---

## 📄 License & Intellectual Property

Developed as an undergraduate thesis project for the **Bachelor of Science in Computer Science** program at **Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)** for the operational benefit of **R.K.A Pharmacy, San Antonio, Agoo, La Union**. All rights reserved © 2026.
