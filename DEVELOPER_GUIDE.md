# Developer Guide: Build, Package, and Deploy
### R.K.A Pharmacy Inventory Management System (FEFO+)
**Clinic Location:** San Antonio, Agoo, La Union  
**Architecture:** Offline-First, Single-Operator Workstation (React + Node.js + Embedded SQLite)

---

## Table of Contents
1. [System Architecture & Design Philosophy](#1-system-architecture--design-philosophy)
2. [Prerequisites & Development Setup](#2-prerequisites--development-setup)
3. [Running the Application (Dev vs. Production)](#3-running-the-application-dev-vs-production)
4. [Client Deployment: Portable Standalone Workstation](#4-client-deployment-portable-standalone-workstation)
5. [USB Barcode Scanner Integration Guide](#5-usb-barcode-scanner-integration-guide)
6. [Offline Database Strategy & Long-Term Performance](#6-offline-database-strategy--long-term-performance)
7. [Automated Backups & Disaster Recovery](#7-automated-backups--disaster-recovery)
8. [Troubleshooting & Beginner FAQ](#8-troubleshooting--beginner-faq)
9. [Operational Governance & Pharmacy Safeguards](#9-operational-governance--pharmacy-safeguards)

---

## 1. System Architecture & Design Philosophy

The R.K.A Pharmacy Inventory Management System is an **offline-first, standalone clinic workstation application**. It was designed specifically for single-operator community and clinic pharmacies (such as R.K.A Pharmacy in San Antonio, Agoo, La Union).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LOCAL CLINIC LAPTOP / PC                           │
│                                                                         │
│  ┌───────────────────────┐              ┌────────────────────────────┐  │
│  │     Client UI         │  HTTP / REST │   Node.js Express Server   │  │
│  │   (React 19 + Vite)   │ ───────────> │        (Port 5000)         │  │
│  │  Tailwind CSS Styles  │ <─────────── │  • FEFO+ Batch Dispatch    │  │
│  │  Barcode Auto-Focus   │              │  • Reorder Level Engine    │  │
│  └───────────────────────┘              │  • Audit Trail Logger      │  │
│              ▲                          └─────────────┬──────────────┘  │
│              │ Keystroke Events                       │ Direct C++ API  │
│              │ (HID Keyboard Wedge)                   ▼                 │
│  ┌───────────┴───────────┐              ┌────────────────────────────┐  │
│  │   USB Barcode Scanner │              │    SQLite 3 (Embedded)     │  │
│  │   (Plug-and-Play HID) │              │  pharmacy_inventory.db     │  │
│  └───────────────────────┘              │  • WAL Mode (Crash-proof)  │  │
│                                         │  • High-Speed B-Tree Index │  │
│                                         └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Offline-First?
* **Zero Cloud Dependency:** Clinic operations in provincial locations cannot halt during internet service provider outages or weather disturbances.
* **No Recurring Monthly SaaS Costs:** The clinic owns the software and data outright with zero server subscription fees.
* **Ultra-Low Latency:** Every scan, inventory lookup, and transaction commit completes in under **5 milliseconds**.
* **Data Sovereignty & Privacy:** Sensitive inventory costs and prescription dispense logs never leave the clinic's premises.

---

## 2. Prerequisites & Development Setup

### Hardware Requirements
* **Operating System:** Windows 10 or Windows 11 (64-bit recommended).
* **Processor:** Intel Core i3 / AMD Ryzen 3 or higher.
* **RAM:** 4 GB minimum (8 GB recommended).
* **Storage:** At least 500 MB free disk space for runtime and database.
* **Ports:** At least 1 available USB Type-A port for the barcode scanner.

### Required Developer Software
1. **Node.js (LTS Version 18.x, 20.x, or 22.x)**
   * Download the official Windows `.msi` installer from [https://nodejs.org](https://nodejs.org).
   * Verify installation in PowerShell or Command Prompt:
     ```bash
     node -v
     npm -v
     ```
2. **Visual Studio Code (Recommended Code Editor)**
   * Download from [https://code.visualstudio.com](https://code.visualstudio.com).
3. **C++ Build Tools (Only if compiling native modules from scratch)**
   * `better-sqlite3` includes precompiled Windows binaries. If you ever compile native Node addons from source on Windows, install Visual Studio C++ Build Tools.

---

## 3. Running the Application (Dev vs. Production)

### Step 1: Install Dependencies
Open PowerShell in the project root directory (`rka-pharmacy-ims`):

```powershell
# 1. Install root backend dependencies (Express, better-sqlite3, cors)
npm install

# 2. Install client frontend dependencies (React, Vite, Lucide-React, Tailwind CSS)
cd client
npm install
cd ..
```

### Step 2: Seed the Clinic Database (First-Time Setup)
To populate the database with initial clinic medicines, batches across all expiration tiers, and 35 days of transaction history:

```powershell
npm run seed
```
This initializes `server/data/pharmacy_inventory.db` with clinic medicines (Amoxicillin, Cefalexin, Paracetamol, Metformin, etc.).

---

### Step 3A: Running in Development Mode
In development mode, Vite runs a hot-reloading development server on port `3000`, while Express runs on port `5000`.

Open **two terminal windows**:

* **Terminal 1 (Backend Server):**
  ```powershell
  npm run dev:server
  ```
  *Outputs: `Server active on http://localhost:5000`*

* **Terminal 2 (Frontend Client):**
  ```powershell
  npm run dev:client
  ```
  *Outputs: `Local: http://localhost:3000`*

Open `http://localhost:3000` in your browser. Any edits to React code update instantly.

---

### Step 3B: Running in Production Mode (Unified Single Server)
In production, the React frontend is compiled into static HTML, JavaScript, and CSS files stored in `client/dist`. The Node.js Express server serves both the REST API and the frontend from port `5000`.

```powershell
# 1. Build the optimized client bundle
npm run build

# 2. Start the unified production server
npm start
```

Now open `http://localhost:5000`. The entire application is served from a single port with no separate frontend build process needed.

---

## 4. Client Deployment: Portable Standalone Workstation

### The Production Client Package (`RKA-Pharmacy-IMS-Client-Offline`)
For clinic computers and teammate workstations, the application is packaged as a **zero-installation, completely portable distribution**. Non-technical clinic operators do not need to install Node.js, install npm packages, or touch the command line.

#### Architecture of the Standalone Package
```
RKA-Pharmacy-IMS-Client-Offline/
├── RKA-Pharmacy-IMS.exe        # Native C# launcher (silent background Node server + Edge app mode)
├── Setup-Desktop-Shortcut.bat  # Automated desktop shortcut creator (OneDrive & Windows SpecialFolder compatible)
├── start-app.bat               # Fallback batch launcher (with automatic working directory lock)
├── runtime/
│   └── node.exe                # Bundled standalone Node.js v24.14.0 LTS binary
├── server/
│   ├── index.js                # Express production server & static client host
│   ├── db.js                   # SQLite database manager & rolling backup routine
│   └── data/
│       ├── pharmacy_inventory.db # Embedded clinic database (WAL mode)
│       └── backups/            # 30-day automated rolling backups
├── client/
│   └── dist/                   # Compiled Vite/React production assets
└── node_modules/               # Pre-installed production packages (better-sqlite3 x64 native)
```

#### How the Launchers Work:
1. **`RKA-Pharmacy-IMS.exe` (Primary Launcher):**
   - A lightweight .NET executable that runs without opening a black command prompt window.
   - Spawns `runtime\node.exe server\index.js` in the background.
   - Polls `http://localhost:5000/api/health` until the server responds.
   - Launches Microsoft Edge in standalone Application Mode:
     ```text
     msedge.exe --app=http://localhost:5000 --window-size=1366,768
     ```
   - If Edge is unavailable, it automatically falls back to opening the system's default browser.
2. **`start-app.bat` (Fallback Launcher):**
   - Includes `cd /d "%~dp0"` to guarantee that the working directory is always locked to the application folder, even if launched via administrator mode or external scripts.
3. **`Setup-Desktop-Shortcut.bat` (Installer):**
   - Uses PowerShell to query the Windows Shell API: `$ws.SpecialFolders.Item('Desktop')` and `[Environment]::GetFolderPath('Desktop')`.
   - Correctly resolves Desktop paths on all systems, including PCs with **Microsoft OneDrive Backup** enabled (`C:\Users\<user>\OneDrive\Desktop`) and standard local folders (`C:\Users\<user>\Desktop`).
   - Creates a shortcut titled **"R.K.A Pharmacy IMS.lnk"** targeting `RKA-Pharmacy-IMS.exe` with the working directory set properly.

---

### Preparing a USB Flash Drive Distribution

When sharing the project with teammates or deploying to the clinic:

1. **Checkpoint the SQLite Database (Flush WAL logs):**
   In the client offline folder, execute:
   ```powershell
   .\runtime\node.exe -e "const db = require('better-sqlite3')('server/data/pharmacy_inventory.db'); db.pragma('wal_checkpoint(TRUNCATE)'); db.close();"
   ```
2. **Create the ZIP Archive:**
   Compress the entire `RKA-Pharmacy-IMS-Client-Offline` folder into `RKA-Pharmacy-IMS-Client-Offline.zip`.
3. **Copy to USB Flash Drive:**
   Copy the `.zip` file to the flash drive.

---

### Installation on the Recipient's PC

Provide these 3 instructions to your teammate or clinic staff:

1. **Extract the ZIP file first (Crucial):**
   - Right-click `RKA-Pharmacy-IMS-Client-Offline.zip` -> select **"Extract All..."**.
   - Choose a permanent location (e.g. `Documents` or `C:\`).
   - *Do not run the files directly inside the zip folder.*
2. **Create the Desktop Shortcut:**
   - Open the extracted folder and double-click `Setup-Desktop-Shortcut.bat`.
   - A success message will confirm the shortcut has been added to their desktop.
3. **Launch the System:**
   - Double-click the new shortcut on the desktop (or `RKA-Pharmacy-IMS.exe`).
   - If Windows SmartScreen appears (*"Windows protected your PC"*), click **More info** -> **Run anyway**.

---

### Alternative Packaging Methods (Reference)

#### Approach B: Electron Desktop Installer
If you wish to wrap the entire app in Chromium:
1. Install Electron packages: `npm install --save-dev electron electron-builder`
2. Configure `electron/main.js` and add `build` options to `package.json`.
3. Run `npm run dist` to generate an NSIS `.exe` installer.

#### Approach C: Inno Setup Packaging
If compiling into a Windows setup wizard:
1. Use Inno Setup Compiler with a `setup.iss` script.
2. Package `runtime\node.exe`, `server\`, `client\dist\`, and `node_modules\`.
3. Compile to produce `Setup_RKA_Pharmacy_IMS.exe`.

---

## 5. USB Barcode Scanner Integration Guide

### How Standard Barcode Scanners Communicate
Most commercial handheld barcode scanners (Honeywell, Zebra, Netum, Eyoyo, Inateck, Symcode, etc.) operate as **HID Keyboard Wedge** devices:
* **Zero Driver Setup:** Windows recognizes them as standard USB keyboards. No serial ports (RS-232), custom DLLs, or COM port configuration needed.
* **Keystroke Emulation:** When a barcode is read, the scanner sends the decoded alphanumeric characters in rapid succession (<20 ms for 15 characters), followed immediately by an `Enter` (Carriage Return `\r\n`) character.

### How the Software Captures Scans
In the Dispensing (`StockOutView.jsx`) and Stock In (`StockInView.jsx`) interfaces:

1. **Auto-Focus Target Input:**
   The barcode input field references an auto-focus hook on initial load and after every transaction:
   ```javascript
   const barcodeInputRef = useRef(null);

   useEffect(() => {
     barcodeInputRef.current?.focus();
   }, []);
   ```

2. **Capturing the Scan on `Enter`:**
   When the scanner completes the barcode transmission, it sends an `Enter` key event:
   ```javascript
   const handleBarcodeKeyDown = (e) => {
     if (e.key === 'Enter') {
       e.preventDefault();
       const scannedCode = barcodeInput.trim();
       if (scannedCode) {
         processScannedBarcode(scannedCode);
         setBarcodeInput(''); // Clear for next scan
       }
     }
   };
   ```

3. **Global Scan Buffer (Failsafe for Defocused Inputs):**
   If the operator accidentally clicks outside the input box, a global window listener monitors typing velocity. Because humans type at >80 ms per key while hardware scanners transmit at <20 ms per character, the system identifies automated scanner input and routes it directly to the barcode handler.

### Configuring the Physical Scanner Hardware
To prepare any standard barcode scanner for R.K.A Pharmacy:
1. Scan **"Reset to Factory Defaults"** in the scanner's user manual.
2. Scan **"USB HID Mode"** (default).
3. Scan **"Add CR/LF Suffix"** (or **"Add Enter Key"**).

### Testing Without a Physical Scanner
Beginner developers do **not** need physical hardware to test scanning:
* Click the barcode input box in the Dispensing tab.
* Type any medicine barcode (e.g., `MED-001-AMOXI` or `8806123456789`) and press the **Enter** key on your keyboard.
* The system behaves identically to a physical laser scan.

---

## 6. Offline Database Strategy & Long-Term Performance

### Database Engine: SQLite 3 with `better-sqlite3`
* **File Location:** `server/data/pharmacy_inventory.db`
* **Why Embedded SQLite?**
  * **Single Portable File:** Moving the database or creating a backup is as simple as copying one file.
  * **Zero Database Server Maintenance:** SQLite runs in-process inside Node.js. There is no external database daemon to stop, fail to start, or consume idle RAM.
  * **ACID Compliant:** Transactions are atomic and durable.

---

### Write-Ahead Logging (WAL) for Crash Resiliency
Provincial clinic locations in La Union may experience sudden power dropouts. Standard databases can suffer file corruption if power fails during a write.

In `server/db.js`, Write-Ahead Logging is permanently enabled:
```javascript
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```
* In **WAL mode**, new writes are appended to an auxiliary `pharmacy_inventory.db-wal` file before being merged back into the database file.
* If power cuts mid-transaction, uncommitted writes are safely discarded, and committed writes are preserved with **0% risk of database file corruption**.

---

### Preventing Performance Degradation Over 5–10 Years
A busy clinic dispensing 60–100 prescriptions daily can generate ~35,000 transaction records annually. Without optimization, queries will eventually slow down.

The following architectural safeguards prevent performance degradation:

#### 1. High-Performance B-Tree Secondary Indexes
In `server/db.js`, indexes are built on all frequently filtered and joined columns:
```sql
-- Fast batch lookups by medicine and status
CREATE INDEX IF NOT EXISTS idx_batches_med_status ON batches(medicine_id, status);

-- Instant FEFO sorting by expiration date
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiration_date);

-- Sub-millisecond barcode lookups during dispensing
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_code ON medicines(code);

-- Transaction history and sales velocity queries
CREATE INDEX IF NOT EXISTS idx_transactions_med ON transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
```

#### 2. Native C++ Prepared Statements
All database queries use `better-sqlite3` prepared statements:
```javascript
const query = db.prepare('SELECT * FROM medicines WHERE barcode = ?');
const result = query.get(scannedBarcode);
```
Prepared statements are compiled once by SQLite and kept in memory, eliminating SQL parsing overhead on repeated barcode scans.

#### 3. Periodic SQLite Optimization (`PRAGMA optimize`)
On server startup, `db.pragma('optimize')` analyzes index usage and updates internal query planner statistics.

---

## 7. Automated Backups & Disaster Recovery

### Automated Rolling Daily Backups
The server includes an automated non-blocking backup function (`createDatabaseBackup()` in `server/db.js`).

1. Every time the server starts (or at 24-hour intervals), SQLite's native backup API creates a consistent snapshot:
   ```
   server/data/backups/pharmacy_backup_YYYY-MM-DD.db
   ```
2. The routine automatically cleans up old backups, retaining the **most recent 30 days** of snapshots while automatically purging older files to conserve hard drive space.

### Clinic Disaster Recovery Procedure
If the clinic laptop experiences hardware failure:
1. Copy the `RKA-Pharmacy-IMS-Client-Offline` folder onto a new computer.
2. Copy the latest `pharmacy_backup_YYYY-MM-DD.db` from your backup USB drive.
3. Rename it to `pharmacy_inventory.db` and place it in `server/data/`.
4. Run `Setup-Desktop-Shortcut.bat` and launch the application. 100% of records are fully restored.

---

## 8. Troubleshooting & Beginner FAQ

### Q1: Desktop shortcut installer throws `DirectoryNotFoundException`
**Symptom:** Terminal shows `Unable to save shortcut "C:\Users\<name>\Desktop\... DirectoryNotFoundException"`.  
**Cause:** The PC has Microsoft OneDrive PC Backup enabled, which moves the Desktop folder to `C:\Users\<name>\OneDrive\Desktop`.  
**Solution:** The updated `Setup-Desktop-Shortcut.bat` uses Windows Shell API (`$ws.SpecialFolders.Item('Desktop')`) to dynamically locate the real Desktop folder on any PC, whether OneDrive is enabled or not.

---

### Q2: Blue popup: "Windows protected your PC" (Microsoft Defender SmartScreen)
**Symptom:** When double-clicking `RKA-Pharmacy-IMS.exe`, Windows SmartScreen blocks execution.  
**Cause:** Windows flags newly copied or extracted executables from USB flash drives that do not have expensive commercial code-signing certificates.  
**Solution:** Click **"More info"** on the popup, then click **"Run anyway"**. This only needs to be done once.

---

### Q3: Shortcut breaks or app says files are missing
**Symptom:** Double-clicking the desktop shortcut says the target was not found.  
**Cause:** The files were run directly from inside the `.zip` archive without extracting. Windows runs zipped files from a temporary cache (`AppData\Local\Temp`) which disappears when closed.  
**Solution:** Right-click the `.zip` file -> **Extract All...** to a permanent directory (such as `Documents` or `C:\`), then run `Setup-Desktop-Shortcut.bat`.

---

### Q4: Port 5000 is already in use
**Symptom:** `Error: listen EADDRINUSE: address already in use :::5000`  
**Solution:** A previous instance of Node is still running in the background. Close it using PowerShell:
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process using its PID (e.g., 1234)
taskkill /PID 1234 /F
```

---

### Q5: `better-sqlite3` native compilation error
**Symptom:** `Error: Could not locate the bindings file...` after switching Node.js versions.  
**Solution:** Rebuild the native SQLite binary for your current Node version:
```powershell
npm rebuild better-sqlite3
```

---

### Q6: Barcode scanner types strange characters (e.g., symbols instead of numbers)
**Symptom:** Barcode `12345` types as `!@#$%`.  
**Solution:** The scanner operates as a keyboard. Check Windows Keyboard Input Language in the Windows Taskbar:
* Ensure Windows language is set to **English (United States)**. Non-standard keyboard layouts (e.g., French AZERTY) interpret numeric keystrokes differently.

---

### Q7: Can the pharmacy operate multiple counters on the same local network?
**Answer:** Yes. Because the server listens on `http://0.0.0.0:5000`, other computers connected to the same clinic Wi-Fi or router can access the system by opening `http://<SERVER-LOCAL-IP>:5000` in their browser (e.g., `http://192.168.1.100:5000`).

---

## 9. Operational Governance & Pharmacy Safeguards

### 9.1 Stock-In Pricing Governance & Dropdown Auto-Fill
* **Zero-Price Prevention:** Both frontend (`StockInView.jsx`) and backend (`POST /api/batches`) disallow recording medicine batches with empty or ₱0.00 `unit_cost` or `selling_price`.
* **Previous Batch Price Inheritance:** When registering incoming batches, the user can select the pricing of any existing batch of the same medicine from a dropdown menu, which auto-fills the unit cost and selling price fields, or toggle to manual input for new price structures.

### 9.2 Dispensing Price Immutability & Price Adjustments
* **POS Price Lockdown:** In `StockOutView.jsx`, prices cannot be altered during dispensing or on customer transaction slips, preventing unauthorized register-level price changes.
* **Medicines & Batches Management:** Price revisions must be conducted through the "Medicines & Batches" view via `EditBatchModal.jsx`.
* **Audit Trail Accountability:** Every batch price adjustment invokes `PATCH /api/batches/:id` and records a `PRICE_ADJUSTMENT` entry in `audit_logs` storing previous cost, new cost, previous selling price, new selling price, reason, and operator name.

### 9.3 Accidental Exit Prevention & System Telemetry
* **Browser-Level Defense:** A `beforeunload` listener prompts the operator before closing browser tabs or windows to prevent accidental loss of active dispensing transactions.
* **In-App Modal Confirmation:** The navigation bar features a dedicated Exit action button opening an `ExitConfirmModal` with clear confirmation before shutting down.
* **Live Connection Indicator:** The header displays `● DB Online • FEFO+ Active`, confirming that the local SQLite database is connected and serving queries.

### 9.4 Settings Default Configuration Management
* **1-Click Reset:** The Settings interface features a "Default Settings" button restoring recommended baseline values:
  * Safe Tier: > 180 days
  * Monitor Tier: 91 to 180 days
  * Warning Tier: 31 to 90 days
  * Critical Tier: 1 to 30 days
  * Safety Buffer: 3 days
  * Consumption History: 30 days
* **Idempotency Detection:** If the system is already configured with default values, clicking the button displays an informational alert: *"Already in default settings"*.

### 9.5 Dual-Version Help Guide
* **Version 1 (Daily Operational Guide):** Quick reference for counter staff covering barcode scanning, auto-FEFO dispensing, intake, and quarantine.
* **Version 2 (Advanced System Guide):** Comprehensive administrative guide detailing:
  1. *FEFO+ Intelligence:* Mathematical definitions for Days to Expiry (DTE), Days to Consume (DTC), Expiry Risk Margin (ERM), and dynamic reorder thresholds.
  2. *Audit Trail Governance:* Protocol for logging mandatory FEFO overrides and batch price changes.
  3. *Policy Simulation Engine:* Replaying historical logs under FIFO, FEFO, and FEFO+ models.
  4. *Settings & Threshold Customization:* How to calibrate tier countdowns and lead-time safety buffers.

### 9.6 Dynamic UI Modes (Clean vs. Maximalist)
* **Clean / Minimalist Mode:** Tailored for daily POS operations, presenting essential high-contrast metrics and stripped of dense academic jargon.
* **Maximalist Mode:** Exposes full research telemetry, mathematical equations, multi-parameter KPI grids, and detailed analytical tables for thesis defense and inventory analysis.

---

*Document Revision: 2.1.0 (Updated September 2026)*  
*Target Application: R.K.A Pharmacy IMS (San Antonio, Agoo, La Union)*

