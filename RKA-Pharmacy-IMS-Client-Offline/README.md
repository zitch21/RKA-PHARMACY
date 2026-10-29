# R.K.A Pharmacy Inventory Management System (FEFO+)

> **Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO**

[![Platform: Windows 10 / 11](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(64--bit)-0078D4.svg?logo=windows&logoColor=white)](#-system-requirements--prerequisites)
[![Architecture: Offline-First](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20SQLite%20WAL-10B981.svg)](#-system-overview)
[![Security: Scrypt & HMAC Auth](https://img.shields.io/badge/Security-Scrypt%20Hashing%20%7C%20HMAC%20Sessions-8B5CF6.svg)](#-security--authentication)
[![Integrity Suite: Verified](https://img.shields.io/badge/Integrity%20Suite-Verified%20(100%25%20Passing)-059669.svg)](#-automated-verification--health-checks)
[![Sandbox: Dual--DB Isolation](https://img.shields.io/badge/Sandbox-Header--Scoped%20Demo%20DB-F59E0B.svg)](#-core-features)
[![License: Academic Research](https://img.shields.io/badge/License-Academic%20Research%20Project-EA580C.svg)](#-project--research-attribution)

---

## 📋 Table of Contents

- [Overview](#-system-overview)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [System Requirements & Prerequisites](#-system-requirements--prerequisites)
- [Quick Start Installation (Windows)](#-quick-start-installation-windows)
- [Environment Configuration](#-environment-configuration)
- [Security & Authentication](#-security--authentication)
- [Automated Verification & Health Checks](#-automated-verification--health-checks)
- [Developer & Architecture Guide](#-developer--architecture-guide)
- [Project & Research Attribution](#-project--research-attribution)
- [License](#-license)

---

## 🌟 System Overview

The **R.K.A Pharmacy Inventory Management System (FEFO+)** is a mission-critical, standalone workstation application engineered specifically for community and outpatient clinic pharmacies. Designed for **R.K.A Pharmacy** in San Antonio, Agoo, La Union, the system addresses the two greatest operational hazards facing local dispensaries: **inventory expiry spoilage** and **intermittent electrical or internet connectivity**.

Built with an **offline-first architecture**, the entire application—frontend interface, REST API server, and embedded relational database—runs locally on the clinic counter workstation. It operates completely independently of external cloud providers, eliminating monthly SaaS subscription costs, protecting patient sales privacy, delivering sub-5ms query response times, and ensuring uninterrupted counter operations during provincial power outages or network disruptions.

---

## 🚀 Core Features

### 1. Demand-Based Replenishment & Expiry-Risk-Aware FEFO+
* **Strict FEFO Allocation:** Dispensing workflows automatically allocate batches in ascending order of expiration date ($\text{Earliest Expiry First}$). Expired batches ($\le 0\text{ days}$) are **strictly blocked** from selection.
* **Rapid Scan Clinical Safety Gate:** Rapid barcode scanning automatically halts when an item's earliest active batch resides in the **Critical countdown tier** ($1\text{--}30\text{ days}$). Rather than silently bypassing verification, the system opens an explicit confirmation dialog (`BatchStatusConfirmModal`) and triggers an acoustic alert tone to prevent near-expiry medications from reaching patients without operator acknowledgment.
* **5-Tier Expiration Countdown:** Classifies all active stock into clinical tiers:
  * 🟢 **Safe** ($> 180\text{ days}$): Direct release.
  * 🔘 **Monitor** ($91\text{--}180\text{ days}$): Standard monitoring.
  * 🟡 **Warning** ($31\text{--}90\text{ days}$): Operator confirmation dialog required before release.
  * 🔴 **Critical** ($1\text{--}30\text{ days}$): High-priority warning with explicit confirmation.
  * 🛑 **Expired** ($\le 0\text{ days}$): Quarantined and hard-blocked.
* **Moving-Average Daily Demand:** Computes average daily consumption over a configurable rolling observation baseline window ($N \in \{10, 20, 30\}\text{ operational days}$).
* **Expiry Risk Margin ($\Delta T$):** Quantifies Days to Depletion ($T_{\text{consume}}$), Expiry Risk Margin ($\Delta T = T_{\text{expiry}} - T_{\text{consume}} - \text{Buffer}$), and Predicted Expired Waste ($Q_{\text{waste}}$), alerting operators before items become clinical waste.
* **Cold-Start Safeguard:** When transaction history is below the configured window ($t < N$), automated algorithmic reorder generation is safely suppressed in favor of manual reorder thresholds.
* **Multi-Batch Auto-Allocation:** Counter sales exceeding a single batch's available quantity automatically split sequentially across earliest-expiring active batches.
* **Physical Count Adjustment & Audit:** Counter inventory discrepancies can be reconciled directly via `StockAdjustmentModal` (`POST /api/transactions/adjustment`), automatically logging adjustments, reasons, and operator identity to the immutable ledger.
* **Controlled Clinical Disposal:** Expired or damaged stock can be quarantined and safely disposed of via `DisposalModal` (`POST /api/batches/:id/dispose`), updating batch status and creating a formal disposal transaction trail.

### 2. Dual-Database Demo Sandbox Architecture
* **Header-Scoped Isolation:** Toggle seamlessly between live clinic production and a risk-free demonstration sandbox. Requests tagged with `x-demo-mode: true` are transparently routed to `pharmacy_demo.db` via Node.js `AsyncLocalStorage`. Live production records (`pharmacy_inventory.db`) remain 100% untouched.
* **1-Click Sandbox Reset:** Instantly restore the demo database back to clean baseline clinic records at any time from the top warning banner or Settings view.

### 3. Workstation UI Ergonomics & Asynchronous Code-Splitting
* **Domain-Organized Dispensary Navigation:** Workspace views are organized into intuitive functional tiers:
  * **Dispensary Counter:** POS / Dispense (`F2`), Inventory, Stock-In, and Overview Dashboard.
  * **Management & Clinical Safety:** Purchase Orders, FEFO+ Risk Matrix, Audit Trail Ledger, and Workstation Settings.
  * **Academic Research Lab:** Policy Simulation and Monte-Carlo Replenishment Stress-Testing.
* **Asynchronous `React.lazy()` Code-Splitting:** Heavy secondary views and simulation charts are split into dynamic on-demand chunks, reducing initial bundle weight by over 40% and providing sub-millisecond counter boot times.
* **CSV Catalog Bulk Import & Philippine Presets:** Integrated modal (`BulkImportModal.jsx` / `POST /api/medicines/bulk-import`) supporting CSV file uploads, copy-paste import, a downloadable template, and 1-click loading of 68 Philippine FDA/DOH essential medicines with authentic GS1 prefix 480 EAN-13 barcodes.
* **Encapsulated Thermal Receipt Modal:** Formatted for standard 80mm thermal receipt printers with dark-mode printable area immunity (`PrintableReceiptModal.jsx`).
* **Dark / Light Theme Engine:** Zero-latency toggle between daytime clinical white and low-strain dark workstation theme, persisted across sessions.
* **Global Omni-Search (`/` or `Ctrl+K`):** Universal search modal for instant catalog queries, active batch lookups, supplier PO searches, and action navigation.
* **Dispensary Operational Calendar:** Visualizes upcoming batch expiry horizons, scheduled supplier intakes, and daily dispensary milestones.
* **Graceful Workstation Exit Dialog:** Dedicated exit modal (`ExitConfirmModal.jsx` / `POST /api/backup/exit`) that checkpoints WAL pages, records a clean shutdown audit log, and safely terminates the local server process before window close.

### 4. Hardware Barcode Scanning & Audio Telemetry
* **USB HID Keyboard Wedge Integration with Focus Redirection:** Instant plug-and-play compatibility with standard handheld USB barcode scanners. Fast keystroke bursts ($<65\text{ms}$) are automatically captured in the global window capture phase; if the operator accidentally focuses a notes or reference field, the scanned burst is cleanly stripped from the input and routed directly to the dispensary search pipeline.
* **Web Audio Synthesized Telemetry:** Built-in Web Audio API tone generator (`audioTelemetry.js`) providing distinct auditory feedback for successful scans, barcode errors, and critical expiration warnings without external audio assets.
* **Internal Barcode Generation:** Generates printable Code 128 barcodes and shelf labels for unbarcoded or repacked medications.

### 5. Procurement & Purchase Orders Lifecycle
* **Dynamic Reorder Point (ROP):** Calculates replenishment points using supplier lead time and safety buffer days:
  $$\text{ROP} = (\text{Daily Demand} \times \text{Lead Time}) + \text{Safety Buffer}$$
* **Configurable Auto-Drafting:** Choose between *Manual Review Mode* and *Instant Auto Mode* in Settings.
* **FEFO+ Bulk Reorder Planner:** Convert recommended replenishment stock into draft POs, review quantities, and synchronize updated ROP thresholds into catalog records.
* **Printable Voucher Slips:** Generate clean, formal PO slips with itemized costs, supplier details, delivery instructions, and authorized signature lines.
* **Supplier DR / Sales Invoice Session Retention:** Supplier Delivery Receipt (DR) / Sales Invoice numbers are recorded during intake and automatically carried over across consecutive item registrations under the same delivery.

### 6. Disaster Recovery, Backups & System Reset
* **Removable USB Backup:** Integrated Windows CIM disk scanner identifies connected USB flash drives and exports WAL-checkpointed database archives directly to removable media.
* **Automated SQLite PRAGMA Integrity Checks:** Backups execute a comprehensive `PRAGMA integrity_check` pass prior to creating snapshots or exporting archives to USB flash drives.
* **Pre-Restore & Pre-Reset Safety Snapshots:** Every database restoration or factory reset automatically generates a timestamped safety snapshot (`pharmacy_pre_restore_*.db` / `pharmacy_pre_reset_*.db`), guaranteeing zero data loss.
* **Administrative CLI Recovery (`server/restore.js`):** Standalone terminal utility to inspect, verify, and restore backups with schema validation.
* **Factory System Reset:** Securely wipes operational tables for clean onboarding while preserving administrator credentials and settings.
* **Database Storage Compaction & Optimization:** Counter administration tools (`POST /api/settings/optimize`, `GET /api/settings/db-stats`) execute SQLite `wal_checkpoint(TRUNCATE)`, `VACUUM`, and `PRAGMA optimize` to reclaim freelist pages and maintain lean disk footprints.

### 7. Security, Access Control & Localization
* **Scrypt Password Cryptography:** Operator credentials protected using Node.js native `crypto.scryptSync` with unique cryptographic salts.
* **Dynamic Machine-Unique HMAC Session Secret:** HMAC signatures are keyed with a dynamic 256-bit machine-unique secret (`server/data/.session_secret`), generated and secured locally on initial installation.
* **First-Run Password Rotation Advisory:** Authentications using the default credential (`rka2026`) display an amber security warning directing the pharmacist to set a custom clinic credential.
* **Role-Based Access Control (RBAC):** Middleware (`requireAdminRole`) strictly enforces administrative privileges for database restorations, master settings modifications, and factory wipes.
* **Immutable Audit Trail Ledger:** Tamper-evident logging of price adjustments, batch overrides, alert acknowledgments, baseline window changes, backups, and user logins with 1-click CSV export.
* **Offline Tri-Lingual Localization:** Instant, zero-network switcher supporting **English (`EN`)**, **Simple Filipino (`FIL`)**, and **Taglish (`TAGLISH`)** across all 9 views and dialogs with **1,313 symmetric dictionary keys** (100% parity verified).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLINIC WORKSTATION PC / LAPTOP                        │
│                                                                                 │
│   ┌────────────────────────┐                   ┌────────────────────────────┐   │
│   │    Frontend Client     │   HTTP / JSON     │   Node.js Express Server   │   │
│   │  (React 19 + Tailwind) │ <───────────────> │        (Port 5000)         │   │
│   │  • Clean & Simple / Max│  x-demo-mode tag  │  • FEFO+ Allocation Engine │   │
│   │  • Omni-Search (/ / ^K)│                   │  • Scrypt / HMAC Auth Gate │   │
│   │  • Web Audio Telemetry │                   │  • AsyncLocalStorage Proxy │   │
│   │  • Tri-Lingual i18n    │                   │  • USB CIM Backup Manager  │   │
│   └────────────────────────┘                   └─────────────┬──────────────┘   │
│                ▲                                             │ In-Process C++   │
│                │ Keystroke Events                            ▼                  │
│                │ (<20ms + Enter)               ┌────────────────────────────┐   │
│   ┌────────────┴───────────┐                   │    SQLite 3 (Embedded)     │   │
│   │  USB Barcode Scanner   │                   │  • pharmacy_inventory.db   │   │
│   │  (HID Keyboard Wedge)  │                   │  • pharmacy_demo.db        │   │
│   └────────────────────────┘                   │  • WAL Mode (Crash-proof)  │   │
│                                                │  • 100% Offline & Local    │   │
│                                                └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (Vite) | High-performance single-page workstation UI with responsive state |
| **Styling & Theme** | Tailwind CSS | Clean clinical presentation, responsive utility styles, dark/light theme |
| **Icons & Audio** | Lucide React, Web Audio API | Accessible clinical iconography and zero-dependency synthesized audio tones |
| **Inter-Tab Sync** | HTML5 `BroadcastChannel` | Real-time multi-tab state synchronization without WebSocket servers |
| **Backend Runtime** | Node.js v20+ (Bundled v24 LTS) | Local HTTP REST API server and file management |
| **Server Framework** | Express.js | Route dispatching, static asset delivery, and middleware pipeline |
| **Execution Context** | `node:async_hooks` (`AsyncLocalStorage`) | Transparent per-request database routing between Production and Demo DB |
| **Database Engine** | SQLite 3 via `better-sqlite3` | Zero-latency, ACID-compliant, crash-resilient embedded database |
| **Concurrency Mode** | Write-Ahead Logging (WAL) | Simultaneous reading and writing with zero database locking or corruption |
| **Security & Crypto** | Node.js Native `crypto` (`scrypt`, HMAC SHA-256) | Offline brute-force resistant password hashing and signed session tokens |
| **Desktop Launcher** | Native C# Executable (`.exe`) / Batch | Silent background server launcher and native application window |

---

## 🖥️ System Requirements & Prerequisites

### Minimum Hardware Requirements
* **Processor:** 64-bit Intel / AMD dual-core processor (1.8 GHz or faster)
* **Memory:** 4 GB RAM (8 GB recommended for multi-tab operations)
* **Storage:** 500 MB available local disk space (SSD recommended)
* **Display:** $1280 \times 720$ resolution minimum ($1920 \times 1080$ recommended)
* **Ports:** 1x available USB port for handheld barcode scanner; 1x USB port for backup flash drive

### Software Requirements
* **Operating System:** Windows 10 (64-bit) or Windows 11 (64-bit)
* **Browser:** Microsoft Edge, Google Chrome, or Mozilla Firefox (pre-installed Edge is fully supported)
* **Zero External Dependencies:** **No prior installation of Node.js, npm, Python, or MySQL is required.** A standalone portable Node.js LTS binary is bundled directly inside the application distribution.

---

## 📥 Quick Start Installation (Windows)

### Step 1: Download & Extract
1. Download the latest release package (`RKA-Pharmacy-IMS-Client-Offline.zip` or clone repository).
2. Right-click the `.zip` archive and select **Extract All...**.
3. Choose a permanent location (e.g. `C:\RKA-Pharmacy-IMS` or `Documents`).

> [!WARNING]
> Do **NOT** run files from inside the Windows `.zip` preview window. Running directly from a `.zip` executes inside a temporary sandbox where database writes cannot persist.

### Step 2: Set Up Desktop Shortcut
1. Open the extracted `RKA-Pharmacy-IMS-Client-Offline` folder.
2. Double-click **`Setup-Desktop-Shortcut.bat`**.
3. An official desktop shortcut titled **"R.K.A Pharmacy IMS"** will be created on your Windows Desktop.

### Step 3: Launch the Workstation
1. Double-click the **R.K.A Pharmacy IMS** desktop shortcut (or double-click `RKA-Pharmacy-IMS.exe`).
2. If Windows SmartScreen appears (*"Windows protected your PC"*), click **More info** > **Run anyway**.
3. The workstation launches automatically at:
   ```text
   http://localhost:5000
   ```
4. Sign in with the default credentials:
   * **Username:** `admin`
   * **Password:** `rka2026`
   * **Default Operator:** Lourdes Gincen L. Cesista

---

## ⚙️ Environment Configuration

The application works out-of-the-box with default clinic settings. Advanced configurations can be set via environment variables or the **Settings** view:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Local HTTP port for the Express REST server |
| `SESSION_SECRET` | Built-in fallback string | Secret key for signing HMAC session tokens |
| `NODE_ENV` | `production` | Node.js execution environment |

### Database Files Location
* **Production Database:** `server/data/pharmacy_inventory.db`
* **Demo Sandbox Database:** `server/data/pharmacy_demo.db`
* **Automated & Safety Backups:** `server/data/backups/`

---

## 🔐 Security & Authentication

| Role | Username | Default Password | Operator | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Owner / Clinic Administrator** | `admin` | `rka2026` | Lourdes Gincen L. Cesista | Full administrative privileges: Dispensing, Stock Intake, Catalog & Price Edits, Purchase Orders, Settings, USB Backups, Restore, and Reset |

* **Zero Plaintext Storage:** Passwords hashed with `scrypt` using a 16-byte random salt and 64-byte derived key.
* **Route Protection:** All mutating routes (`POST`, `PUT`, `DELETE`, `PATCH`) are guarded by `server/middleware/authMiddleware.js`.
* **Counter Price Integrity:** POS prices are locked to prevent counter-level alteration. Non-FEFO batch selections require mandatory written justifications logged to the audit trail.

---

## 🧪 Automated Verification & Health Checks

The repository includes automated integrity verification scripts to audit database consistency, FEFO ordering, and frontend code quality:

### 1. Database & Logic Integrity Verification (`tests/self_check.js`)
Validates 18 distinct mission-critical operational invariants: core tables, performance B-tree indexes, catalog structures, ascending FEFO sorting, expiry countdown tiers, audit schema, tri-lingual dictionary symmetry (1,313 keys), cryptographic HMAC session tokens, simulation neutrality, calendar/leap-year boundaries, Scrypt password cryptography, monetary rounding precision, date formatter symmetry, Philippine FDA/DOH presets (68 standards with EAN-13 barcodes), zero-threshold boundary clamping, factory reset wipe integrity with auto-seed suppression, and SQLite storage compaction:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
node tests/self_check.js
```
```text
--- R.K.A Pharmacy IMS: Verifying Database and Logic Integrity ---
✓ All core database tables exist.
✓ Performance query indexes verified (idx_batches_med_id, idx_po_items_med_id).
✓ System is in a verified clean Factory Reset state (0 medicines, 0 batches).
✓ Verified 0 active batches in clean factory reset state.
✓ Expiry tier calculation and day difference verified.
✓ Audit trail columns verified (operator, action, timestamp).
✓ Settings store verified (R.K.A Pharmacy).
✓ Tri-lingual dictionary symmetry strictly verified (100% key match across en, fil, taglish).
✓ Session verification security verified (HMAC signed, unsigned forge blocked, underscore handling verified).
✓ Simulation replay neutralized (authentic demand data verified).
✓ Expiry date calculations, leap years, null safety, and calendar boundaries verified.
✓ Cryptographic password verification & timing-safe equality verified.
✓ Monetary precision & rounding integrity verified.
✓ Date formatting and client-server calculation symmetry verified.
✓ Philippine essential medicine presets verified (68 FDA/DOH standards with valid EAN-13 barcodes).
✓ Input validation & threshold boundary clamping verified.
✓ Factory System Reset & sentinel flag wipe integrity verified (0 orphaned rows, sentinel active).
✓ Database storage compaction, SQLite VACUUM & optimization pragmas verified.

========================================
 ALL INTEGRITY CHECKS PASSED SUCCESSFULLY 
========================================
```

### 2. Frontend Linter & Static Analysis (`oxlint`)
Scans all React frontend components and utility files for syntax errors and dead code:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline\client
npm.cmd run lint
```

---

## 📖 Developer & Architecture Guide

For deep technical documentation, mathematical formulas, SQLite B-tree index schemas, disaster recovery protocols, and a **step-by-step onboarding walkthrough for developers**, please refer to:

👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**

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

## 📄 License

Developed as an undergraduate thesis project for the **Bachelor of Science in Computer Science** program at **Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)** for the operational benefit of **R.K.A Pharmacy, San Antonio, Agoo, La Union**. All rights reserved © 2026.
