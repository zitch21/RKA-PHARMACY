# R.K.A Pharmacy Inventory Management System (FEFO+)

> **Offline-First Clinic Pharmacy Inventory Management System with Automated Stock Alert, Expiration Tracking (FEFO+), Scrypt Authentication, Barcode-Assisted Dispensing, and Removable USB Backup.**

[![Platform: Windows 10 / 11](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(64--bit)-blue.svg)](#system-requirements)
[![Architecture: Offline-First](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20SQLite%20WAL-success.svg)](#system-overview--key-features)
[![Security: Scrypt Hashing](https://img.shields.io/badge/Security-Scrypt%20Hashed%20Auth-purple.svg)](#-operator-authentication--security)
[![Verification Suite: 46/46 Passed](https://img.shields.io/badge/Verification%20Suite-46%2F46%20Passed%20(100%25)-emerald.svg)](#-automated-verification-suite)
[![License: Academic Research](https://img.shields.io/badge/License-Academic%20Research%20Project-orange.svg)](#-project--research-attribution)

---

## 🏛️ Project & Research Attribution

* **Academic Institution:** Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)
* **College:** College of Computer Science, Agoo, La Union
* **Degree Program:** Bachelor of Science in Computer Science (S.Y. 2026–2027)
* **Undergraduate Thesis Title:** *"Inventory Management System for Clinic Pharmacy Supplies with Automated Stock Alert and Expiration Tracking"* (August 2026)
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
* 🌐 **Offline Tri-Lingual Localization**: Instant header switcher between **English (`EN`)**, **Simple Filipino (`FIL`)**, and **Taglish (`TAGLISH`)**. Operates 100% offline via embedded dictionary across all 9 views, action dialogs, and verification popups.
* 📦 **Batch-Level Tracking & Barcode Operations**: Full plug-and-play support for standard USB HID barcode scanners. Generates internal Code 128 barcodes and printable shelf labels for unbarcoded or repacked supplies.
* ⏳ **FEFO+ (Enhanced First-Expiry-First-Out) Dispensing**: Automatically selects and dispenses the earliest expiring active batch.
  * **Safe** (> 180 days) & **Monitor** (91–180 days): Direct release.
  * **Warning** (31–90 days), **Critical** (1–30 days), & **At-Risk**: Requires explicit user confirmation before release.
  * **Expired** ($\le 0$ days): **Strictly blocked** from selection and dispensing.
  * **Multi-Batch Auto-Allocation**: Large dispensing orders automatically split sequentially across earliest-expiring active batches when a single batch has insufficient quantity.
* ⚡ **Cumulative Quick Dispense & Date Jump Ergonomics**:
  * **Quick Dispense Buttons (`+1, +5, +10, Max`)**: Stackable quantity increments with automatic stock clamping (`Math.min`) to prevent accidental over-dispensing.
  * **Intake Date Jump Buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`)**: 1-click expiration date setting with calendar-safe month clamping for rapid stock intake.
* 🧠 **Demand Forecasting & Expiry Risk Margin (FEFO+)**: Computes moving average daily demand over a configurable baseline window ($N \in \{10, 20, 30\}$ operational days). Quantifies Days to Depletion, Expiry Risk Margin, and Predicted Expired Waste ($Q_{\text{waste}}$).
* 🛡️ **Cold-Start Suppression Rule**: When transactional history is below the configured window ($t < N$), automated algorithmic reorder generation is safely suppressed with an informative banner, falling back to manual clinic reorder thresholds and standard FEFO allocation.
* 📑 **Purchase Orders & Procurement Lifecycle**: Complete procurement tracking from 1-click reorder drafts to placed supplier orders, receiving into active inventory batches, and printable voucher slips.
  * **Configurable Auto-Drafting Modes**: Choose between *Manual Review Mode* and *Instant Auto Mode* in Settings.
  * **FEFO+ Reorder Planner Bulk Draft**: 1-click batch generation of supplier-grouped draft purchase orders directly from the demand forecasting engine.
* 📈 **Dynamic Suggested Reorder Planner**: Dynamically calculates replenishment reorder points:
  $$\text{Reorder Point (ROP)} = (\text{Daily Demand} \times \text{Lead Time}) + \text{Safety Buffer}$$
* 🔔 **Persistent Stock & Expiry Alert Acknowledgment**: Active alerts remain visible on the dashboard and notification center until explicitly acknowledged by an operator, with all acknowledgments logged in the audit trail.
* 🔬 **Policy Simulation Engine**: In-memory policy simulator comparing FIFO vs FEFO vs FEFO+ over configurable simulation windows with pre-loaded multi-batch benchmark scenarios demonstrating waste reduction and safety buffer efficacy.
* 🔒 **Operator Authentication & Scrypt Password Security**: Multi-tier operator accounts with passwords hashed using Node.js native `scrypt` cryptographic key derivation. Station auto-locks behind an authentication screen when unauthenticated.
* 🛡️ **Locked Counter Pricing & Immutable Audit Trail**: Dispensing prices are strictly locked at register level to prevent unauthorized alteration. Any non-FEFO batch overrides require mandatory justification notes.
* 💾 **Smart "Backup & Exit" Modal with Removable Storage Detection**: Windows CIM disk scanner detects connected USB flash drives; exports point-in-time WAL-checkpointed database copies directly to removable media before clean workstation shutdown.

---

## 🔐 Operator Authentication & Security

The system enforces authentication to protect clinical inventory and pricing data:

| Role | Username | Default Password | Operator Name | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator / Owner** | `admin` | `rka2026` | **Lourdes Gincen L. Cesista** | Full access: Dispensing, Intake, Price Adjustment, Reorder Setup, Backups, User Management |

> [!IMPORTANT]
> Passwords are never stored in plaintext. They are protected using **Scrypt key-derivation hashing** with unique cryptographic salts. Passwords can be changed anytime in the **Settings** view.

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

The repository includes a self-contained automated test suite validating all clinic and thesis specifications (46/46 tests passing):
- Scrypt authentication and session validation
- Countdown tier classification and live date calculation
- Strict blocking of expired batches from dispensing
- FEFO override enforcement and mandatory justification logging
- Warning/Critical release status confirmation
- Multi-batch FEFO automatic splitting across inventory batches
- Persistent alert acknowledgment and audit trail logging
- FEFO+ Expiry Risk Margin, Days to Depletion, and predicted expired waste ($Q_{\text{waste}}$)
- Configurable demand observation window ($N \in \{10, 20, 30\}$ days)
- Cold-Start rule ($t < N$) reorder suppression and fallback
- Purchase order lifecycle: Draft creation, placing, receiving into active inventory batches, and cancellation
- End-of-day USB removable storage backup and WAL truncate checkpoints
- Policy simulation comparison (FIFO vs FEFO vs FEFO+)

To run the verification test suite:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
.\runtime\node.exe tests/verify_all_specs.js
```

To run the complete system and database health check:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
.\runtime\node.exe tests/check_system_health.js
```

## 📂 Repository Structure

```text
RKA-PHARMACY/
├── README.md                          # Project overview and quick start guide
├── DEVELOPER_GUIDE.md                 # Comprehensive developer manual & beginner guide
├── Setup-Desktop-Shortcut.bat         # Root-level desktop shortcut installer
├── start-app.bat                      # Root fallback application launcher
└── RKA-Pharmacy-IMS-Client-Offline/   # Standalone, portable client distribution
    ├── RKA-Pharmacy-IMS.exe           # Native C# launcher (silent background server + app mode)
    ├── Setup-Desktop-Shortcut.bat     # Client-level shortcut installer (OneDrive compatible)
    ├── start-app.bat                  # Client-level batch launcher
    ├── tests/                         # Automated verification & diagnostic test suites
    │   ├── verify_all_specs.js        # Automated thesis specification verification suite (46 tests)
    │   ├── stress_test_error_handling.js # Concurrency, edge cases & robustness test suite (24 tests)
    │   └── check_system_health.js     # Database integrity & consistency health diagnostics
    ├── app-icon.ico                   # Application icon
    ├── runtime/                       # Bundled portable Node.js v24.14.0 LTS runtime
    │   └── node.exe
    ├── server/                        # Express backend API & SQLite database
    │   ├── index.js                   # Application server entry point & static file server
    │   ├── db.js                      # SQLite WAL configuration, Scrypt hashing, and schema
    │   ├── seed.js                    # Initial clinic medicine catalog & 35-day transaction seed
    │   ├── routes/                    # REST API endpoints
    │   │   ├── auth.js                # Scrypt login, session validation, password change
    │   │   ├── backup.js              # USB drive detection, WAL checkpoint, direct export
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
    │   └── data/                      # Embedded database & rolling backups
    │       ├── pharmacy_inventory.db  # SQLite database in Write-Ahead Logging (WAL) mode
    │       └── backups/               # Automated 30-day rolling daily backups
    ├── client/
    │   ├── src/                       # Complete React 19 + Tailwind CSS source code
    │   │   ├── components/            # Modals, Navbar, Alert Dropdowns, Barcode Scanner
    │   │   ├── views/                 # Dashboard, Inventory, Purchase Orders, FEFO+, etc.
    │   │   └── App.jsx                # Main workstation shell & authentication guard
    │   └── dist/                      # Precompiled production bundle served by Express
    └── node_modules/                  # Bundled production dependencies (better-sqlite3 x64 native)
```

---

## 🖥️ Application Modules Summary

* **Dual UI Modes**: Clean & Simple Mode (essential 4 tabs for rapid counter dispensing) vs. Maximalist Mode (all 9 views with full analytics, procurement, audit trail, simulation, and settings).
* **Tri-Lingual Localization**: 100% offline switcher supporting English (`EN`), Simple Filipino (`FIL`), and Taglish (`TAGLISH`) across all 9 views, tables, action buttons, and confirmation dialogs.
* **Dashboard**: Key operational metrics, daily sales totals, active inventory value, 5-tier expiry countdown breakdown, and persistent priority alert banner.
* **Medicines & Batches**: Master catalog management, batch intake, batch cost/price adjustments, and printable Code 128 shelf labels.
* **Stock In (Intake)**: Intake workflow with pricing validation, previous batch price inheritance, calendar-safe expiration date jump buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`), and expiration date preview.
* **Purchase Orders**: Full procurement management lifecycle with configurable drafting modes (`manual` vs `instant_auto`). Convert suggested reorders into draft POs, place orders with suppliers, print formal PO slip vouchers with authorized signature blocks, receive delivered items into active inventory batches, and manage cancellations.
* **Stock Out (Dispensing / POS)**: Real-time barcode scanning, cumulative quick dispense buttons (`+1, +5, +10, Max`) with stock clamping, automated multi-batch FEFO allocation, Warning/Critical confirmation modal, mandatory override justifications, locked counter pricing, and printable receipts.
* **FEFO+ Risk & Reorder**: Daily demand moving average, Days to Expiry, Days to Depletion, Expiry Risk Margin, Cold-Start threshold banner, and 1-click Bulk Suggested Reorder synchronization into Purchase Orders.
* **Audit Trail**: Tamper-evident ledger logging dispensing overrides, batch price adjustments, alert acknowledgments, baseline window modifications, purchase order actions, backups, and user logins with CSV export.
* **Policy Simulation**: Comparative historical evaluation between FIFO, standard FEFO, and FEFO+ models with benchmark multi-batch scenarios demonstrating waste reduction and safety buffer efficacy.
* **Settings**: Configurable baseline observation window ($N \in \{10, 20, 30\}$ days), PO auto-drafting mode toggle, expiration countdown tiers, supplier lead time, safety buffer days, removable USB storage backup export, and operator password management.

---

## 📖 In-Depth Developer Guide

For complete technical documentation, mathematical formulas, SQLite B-tree index schemas, disaster recovery protocols, and a **step-by-step onboarding walkthrough for beginner developers**, please refer to:

👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**

---

## 📄 License & Intellectual Property

Developed as an undergraduate thesis project for the **Bachelor of Science in Computer Science** program at **Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)** for the operational benefit of **R.K.A Pharmacy, San Antonio, Agoo, La Union**. All rights reserved © 2026.
