# Developer Guide: Architecture, Codebase Walkthrough, & Onboarding Manual
### R.K.A Pharmacy Inventory Management System (FEFO+)
**Academic Context:** DMMMSU-SLUC Computer Science Undergraduate Thesis (August 2026)  
**Client Partner:** R.K.A Pharmacy, San Antonio, Agoo, La Union  
**Architecture:** Offline-First, Single-Operator Workstation (React 19 + Node.js Express + Embedded SQLite WAL)

---

## 🌟 Welcome to the R.K.A Pharmacy IMS Codebase!

If you are a beginner or a junior developer opening this project for the first time, **welcome!** 

This guide is designed specifically for you. It explains how this system works, why it was designed this way, where every file lives, and how you can comfortably read, modify, and extend the code with confidence.

---

## Table of Contents
1. [The 30-Second Mental Model (How Everything Connects)](#1-the-30-second-mental-model-how-everything-connects)
2. [Beginner's Day 1: Running the App in 5 Minutes](#2-beginners-day-1-running-the-app-in-5-minutes)
3. [The Complete Codebase Tour (Where Does Everything Live?)](#3-the-complete-codebase-tour-where-does-everything-live)
4. [Follow the Data: 4 Step-by-Step Request Traces](#4-follow-the-data-4-step-by-step-request-traces)
   - [Trace 1: User Authentication & Workstation Lock](#trace-1-user-authentication--workstation-lock)
   - [Trace 2: Barcode Scanning & FEFO Dispensing](#trace-2-barcode-scanning--fefo-dispensing)
   - [Trace 3: FEFO+ Expiry Risk Calculation](#trace-3-fefo-expiry-risk-calculation)
   - [Trace 4: End-of-Day USB Removable Storage Backup](#trace-4-end-of-day-usb-removable-storage-backup)
5. [The 5 Core Architectural Concepts Explained Simply](#5-the-5-core-architectural-concepts-explained-simply)
   - [Concept 1: The FEFO+ Mathematical Formulas](#concept-1-the-fefo-mathematical-formulas)
   - [Concept 2: 5-Tier Expiration Countdown & Confirmation Gate](#concept-2-5-tier-expiration-countdown--confirmation-gate)
   - [Concept 3: Crash-Proof Offline SQLite in WAL Mode](#concept-3-crash-proof-offline-sqlite-in-wal-mode)
   - [Concept 4: Scrypt Cryptographic Password Security](#concept-4-scrypt-cryptographic-password-security)
   - [Concept 5: The Immutable Audit Trail Ledger](#concept-5-the-immutable-audit-trail-ledger)
6. [Beginner Developer Playbook: "How Do I Make Changes?"](#6-beginner-developer-playbook-how-do-i-make-changes)
   - [Recipe 1: Adding a New Backend REST Endpoint](#recipe-1-adding-a-new-backend-rest-endpoint)
   - [Recipe 2: Modifying the Database Schema](#recipe-2-modifying-the-database-schema)
   - [Recipe 3: Adding or Editing a React View](#recipe-3-adding-or-editing-a-react-view)
   - [Recipe 4: Recompiling the Production Frontend](#recipe-4-recompiling-the-production-frontend)
   - [Recipe 5: Writing an Automated Verification Test](#recipe-5-writing-an-automated-verification-test)
7. [Working with Barcode Scanners (Hardware Guide)](#7-working-with-barcode-scanners-hardware-guide)
8. [Common Beginner Pitfalls & Traps to Avoid](#8-common-beginner-pitfalls--traps-to-avoid)
9. [Glossary for Non-Pharmacist Developers](#9-glossary-for-non-pharmacist-developers)

---

## 1. The 30-Second Mental Model (How Everything Connects)

Before diving into code, here is what this system actually is in plain English:

> **R.K.A Pharmacy IMS** is a local, desktop-based web application that runs inside the clinic on a single laptop. When the clinic opens in the morning, the owner launches the app, logs in, and uses a handheld USB barcode scanner to dispense medicines. The system makes sure that medicines expiring earliest are dispensed first, prevents expired medicines from ever leaving the pharmacy, alerts the owner before medicines expire, calculates when to reorder stock, and backs up everything to a USB flash drive at the end of the day.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLINIC WORKSTATION PC / LAPTOP                        │
│                                                                                 │
│   ┌────────────────────────┐                   ┌────────────────────────────┐   │
│   │    Frontend UI         │   HTTP / JSON     │   Node.js Express Server   │   │
│   │  (React 19 + Tailwind) │ <───────────────> │        (Port 5000)         │   │
│   │  Runs inside browser   │                   │  • FEFO+ Allocation Logic  │   │
│   │  or Edge App Window    │                   │  • Scrypt Password Hashing │   │
│   └────────────────────────┘                   │  • USB Backup Manager      │   │
│                ▲                               └─────────────┬──────────────┘   │
│                │ Keystroke Events                            │ In-Process C++   │
│                │ (<20ms + Enter)                             ▼                  │
│   ┌────────────┴───────────┐                   ┌────────────────────────────┐   │
│   │  USB Barcode Scanner   │                   │    SQLite 3 (Embedded)     │   │
│   │  (Acts like a keyboard)│                   │  pharmacy_inventory.db     │   │
│   └────────────────────────┘                   │  • WAL Mode (Crash-proof)  │   │
│                                                │  • 100% Offline & Local    │   │
│                                                └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why is this Offline-First?
1. **Zero Cloud Dependency:** Provincial clinics frequently face internet disruptions or bad weather. The clinic counter must never freeze during a sale.
2. **Zero SaaS Subscription Fees:** Small community clinics cannot afford ₱3,000–₱8,000 monthly cloud database fees.
3. **Sub-5-Millisecond Latency:** Every barcode scan and inventory lookup is instantaneous because the database is right on the local SSD.
4. **Patient Privacy:** Medicine sales and prescription references never leave the clinic computer.

---

## 2. Beginner's Day 1: Running the App in 5 Minutes

You do **not** need to install Node.js, npm, Python, or MySQL on your computer to run this system! A standalone, portable Node.js LTS binary is already bundled inside `runtime/node.exe`.

### 3 Ways to Launch the System
Choose whichever method is easiest for you:

#### Method 1: The Native App Launcher (Double-Click)
1. Open the `RKA-Pharmacy-IMS-Client-Offline/` folder.
2. Double-click **`RKA-Pharmacy-IMS.exe`**.
3. It silently boots the backend in the background and opens a clean, borderless application window.

#### Method 2: The Console Batch Script (Visible Terminal Logs)
1. Open the `RKA-Pharmacy-IMS-Client-Offline/` folder.
2. Double-click **`start-app.bat`**.
3. A command prompt will show the server logs, and your default browser will open to `http://localhost:5000`.

#### Method 3: Developer Terminal (Manual Command)
Open PowerShell in the `RKA-Pharmacy-IMS-Client-Offline/` folder:
```powershell
.\runtime\node.exe server/index.js
```
Then open your browser to **`http://localhost:5000`**.

### Logging In
When the app opens, you will be greeted by the workstation lock screen. Use the default clinic administrator account:
* **Username:** `admin`
* **Password:** `rka2026`
* **Operator:** Lourdes Gincen L. Cesista

### Running the Automated Test Suite
To verify that all 38 thesis manuscript specifications are functioning:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
.\runtime\node.exe verify_all_specs.js
```
You should see:
```text
================================================================
 VERIFICATION RESULTS: 38 PASSED, 0 FAILED
================================================================
```

---

## 3. The Complete Codebase Tour (Where Does Everything Live?)

The codebase is split into **Two Worlds**:
1. **The Backend (`server/`)**: Express.js REST API routes and SQLite database operations.
2. **The Frontend (`client/`)**: React 19 single-page application built with Vite and Tailwind CSS.
   * `client/src/`: Where developers write JSX components and CSS.
   * `client/dist/`: Where Vite outputs the compiled bundle that Express serves to the browser.

### Annotated Directory Tree
```text
RKA-Pharmacy-IMS-Client-Offline/
├── runtime/
│   └── node.exe                # Bundled standalone Node.js v24.14.0 LTS binary
├── server/
│   ├── index.js                # Express app entry point & static file server
│   ├── db.js                   # SQLite database connection, schema, & Scrypt hashing
│   ├── seed.js                 # Initial clinic medicine catalog & sales history seed
│   ├── data/
│   │   ├── pharmacy_inventory.db # The SQLite database file (WAL mode enabled)
│   │   └── backups/            # Rolling 30-day automated backup snapshots
│   └── routes/                 # REST API endpoints (One file per feature area)
│       ├── auth.js             # Operator login, session check, password change
│       ├── backup.js           # USB flash drive detection, WAL checkpoint, export
│       ├── alerts.js           # Stock & expiry alerts with manual acknowledgment
│       ├── batches.js          # Batch creation, quantity updates, barcode tag generation
│       ├── medicines.js        # Medicine catalog, pricing, category management
│       ├── transactions.js     # Dispensing (POS), FEFO enforcement, override logs
│       ├── fefoPlus.js         # Consumption velocity, Days of Supply, Expiry Risk Margin
│       ├── audit.js            # Immutable audit trail ledger & CSV export
│       ├── simulation.js       # FIFO vs FEFO vs FEFO+ comparative simulation
│       ├── settings.js         # Countdown tier thresholds and clinic profile
│       └── evaluations.js      # System Usability Scale (SUS) survey engine
├── client/
│   ├── src/                    # React Source Code (Edit your UI here!)
│   │   ├── components/         # Reusable UI widgets & Modals
│   │   │   ├── Navbar.jsx      # Top banner, operator badge, navigation tabs, bell
│   │   │   ├── LoginModal.jsx  # Scrypt workstation authentication lock screen
│   │   │   ├── BatchStatusConfirmModal.jsx # Warning/Critical/At-Risk confirmation gate
│   │   │   ├── OverrideModal.jsx           # Mandatory FEFO override justification dialog
│   │   │   ├── AddMedicineModal.jsx        # Modal to register new medicine catalog items
│   │   │   ├── AlertNotificationDropdown.jsx # Top-right active alert drawer with Ack buttons
│   │   │   ├── HelpGuideModal.jsx          # Dual-version beginner & advanced operating guide
│   │   │   └── ExitConfirmModal.jsx        # Accidental exit prevention prompt
│   │   ├── views/              # Full-page screens corresponding to navigation tabs
│   │   │   ├── DashboardView.jsx   # Metrics, priority alert banner, countdown breakdown
│   │   │   ├── InventoryView.jsx   # Medicine catalog, batch table, printable barcode labels
│   │   │   ├── StockInView.jsx     # Intake workflow, cost inheritance, supplier tracking
│   │   │   ├── StockOutView.jsx    # Dispensing POS, barcode scanner focus, cart, receipt
│   │   │   ├── FefoPlusView.jsx    # Consumption velocity, ERM radar, 1-click reorder sync
│   │   │   ├── AuditTrailView.jsx  # Immutable system logs with search and CSV export
│   │   │   ├── SimulationView.jsx  # Historical replay comparing FIFO vs FEFO vs FEFO+
│   │   │   └── SettingsView.jsx    # Threshold configuration, USB backups, password change
│   │   └── App.jsx             # Workstation shell, state orchestrator, auth guard
│   └── dist/                   # Compiled HTML/CSS/JS served to the browser
├── verify_all_specs.js         # Automated test suite validating all thesis requirements
├── Setup-Desktop-Shortcut.bat  # 1-click shortcut installer
├── start-app.bat               # Fallback launcher
└── RKA-Pharmacy-IMS.exe        # Native Windows launcher
```

---

## 4. Follow the Data: 4 Step-by-Step Request Traces

To truly understand how this system works, follow a piece of data from the user's action all the way down to the database and back.

---

### Trace 1: User Authentication & Workstation Lock
What happens when the operator logs into the workstation?

```
[User types admin / rka2026]
       │
       ▼
1. LoginModal.jsx (React) sends HTTP POST to /api/auth/login
       │
       ▼
2. server/routes/auth.js queries users table by username:
   db.prepare('SELECT * FROM users WHERE username = ?').get('admin')
       │
       ▼
3. verifyPassword() in server/db.js splits stored hash ("salt:derivedKey")
   and uses crypto.scryptSync(password, salt, 64) to verify match in constant time.
       │
       ▼
4. auth.js records USER_LOGIN event in audit_logs table with timestamp & operator name.
       │
       ▼
5. Server responds with { user: { id, username, full_name, role }, token: "..." }.
       │
       ▼
6. App.jsx stores user object in sessionStorage, closes LoginModal, and unlocks UI.
```

---

### Trace 2: Barcode Scanning & FEFO Dispensing
What happens when the pharmacist scans a barcode to dispense medicine?

```
[Pharmacist pulls barcode scanner trigger on Amoxicillin box]
       │
       ▼
1. Scanner transmits characters 'MED-001-AMOXI' + Enter in <20ms.
       │
       ▼
2. StockOutView.jsx captures Enter key on the auto-focused barcode input.
       │
       ▼
3. Frontend queries active batches for this medicine, sorted by expiration_date ASC.
       │
       ▼
4. FEFO Check: Is the earliest expiring batch selected?
   • If YES, but tier is Warning (31–90d), Critical (1–30d), or At-Risk:
     BatchStatusConfirmModal opens -> Operator reviews countdown and clicks "Confirm".
   • If NO (User manually picked a later batch):
     OverrideModal opens -> Operator must enter a mandatory justification note.
   • If EXPIRED (<= 0 days):
     Action is HARD-BLOCKED. An error banner displays: "Expired batch cannot be released!"
       │
       ▼
5. Item enters Cart -> Pharmacist clicks "Complete Dispense".
       │
       ▼
6. POST /api/transactions/stock-out is called with:
   { items: [{ batch_id: 2, quantity: 1, status_confirmed: true }] }
       │
       ▼
7. server/routes/transactions.js opens an atomic SQLite Transaction:
   • Deducts quantity from batches table (updates status to 'consumed' if quantity reaches 0).
   • Inserts record into transactions table with locked batch selling price.
   • Inserts STOCK_OUT or STOCK_OUT_OVERRIDE record into audit_logs table.
       │
       ▼
8. Server returns 201 Created with printable receipt payload. Cart clears and focuses input for next scan.
```

---

### Trace 3: FEFO+ Expiry Risk Calculation
How does the system figure out that a batch is "At-Risk" of expiring on the shelf?

```
1. Frontend requests GET /api/fefo-plus/analysis.
       │
       ▼
2. server/routes/fefoPlus.js queries transactions over past 30 days:
   Average Daily Consumption (ADC) = Total Units Sold / 30 Days
       │
       ▼
3. For each active batch:
   Days to Expiry (DTE) = Expiration Date - Today
   Days of Supply (DOS) = Current Batch Quantity / ADC
       │
       ▼
4. Expiry Risk Margin (ERM) = Days to Expiry - Days of Supply - Buffer Days
       │
       ▼
5. If ERM < 0:
   The batch is flagged as "At-Risk" (will expire before normal clinic demand can consume it).
   The frontend renders an orange/red alert badge on Dashboard and FEFO+ tab.
```

---

### Trace 4: End-of-Day USB Removable Storage Backup
How does the system back up the clinic database to a physical USB flash drive?

```
1. In SettingsView.jsx, operator navigates to "End-of-Day Database Backup".
       │
       ▼
2. GET /api/backup/drives executes Windows CIM query:
   Get-CimInstance Win32_LogicalDisk
   Identifies removable USB flash drives (DriveType == 2) and lists them in dropdown.
       │
       ▼
3. Operator selects "E:\" and clicks "Export to Drive".
       │
       ▼
4. POST /api/backup/export-removable is called with { drive_letter: "E:" }.
       │
       ▼
5. In server/routes/backup.js:
   • Issues SQLite WAL checkpoint: db.pragma('wal_checkpoint(TRUNCATE)').
     (This merges all uncommitted WAL logs into the main database file).
   • Creates target directory on flash drive: E:\RKA_PHARMACY_BACKUPS\
   • Copies database to E:\RKA_PHARMACY_BACKUPS\pharmacy_backup_YYYY-MM-DD_HH-mm-ss.db
   • Writes BACKUP_EXPORT_USB record to audit_logs table.
       │
       ▼
6. Returns success message: "Backup successfully exported to E:\RKA_PHARMACY_BACKUPS\...".
```

---

## 5. The 5 Core Architectural Concepts Explained Simply

### Concept 1: The FEFO+ Mathematical Formulas
In traditional FIFO (First-In, First-Out), medicines are sold based on when the pharmacy *bought* them, regardless of expiry dates.  
In standard FEFO (First-Expiry, First-Out), medicines are sold by expiration date, but the pharmacy has no idea if stock will actually finish before expiring.  
**FEFO+ solves this by combining expiration dates with sales velocity:**

$$\text{Days to Expiry (DTE)} = \text{Expiration Date} - \text{Current Date}$$

$$\text{Average Daily Consumption (ADC)} = \frac{\sum \text{Stock-Out Quantity Over 30 Days}}{30}$$

$$\text{Days of Supply (DOS)} = \frac{\text{Current Batch Quantity}}{\text{ADC}}$$

$$\text{Expiry Risk Margin (ERM)} = \text{DTE} - \text{DOS} - \text{Safety Buffer Days}$$

* **If ERM $\ge 0$:** The batch is safe. It will be fully consumed before expiring.
* **If ERM $< 0$:** The batch is **At-Risk**. The clinic will not sell out in time, creating financial waste unless proactive discounts or doctor advisories are issued.

$$\text{Reorder Point (ROP)} = (\text{ADC} \times \text{Supplier Lead Time}) + (\text{ADC} \times \text{Safety Buffer Days})$$

---

### Concept 2: 5-Tier Expiration Countdown & Confirmation Gate
Every medicine batch in the pharmacy is classified dynamically based on its remaining days to expiry:

| Tier | Remaining Days | Behavior During Dispensing | UI Badge |
| :--- | :--- | :--- | :--- |
| **Safe** | $> 180$ days | Added to cart directly | Green (`Safe`) |
| **Monitor** | $91\text{--}180$ days | Added to cart directly | Blue (`Monitor`) |
| **Warning** | $31\text{--}90$ days | **Requires explicit operator confirmation** | Amber (`Warning`) |
| **Critical** | $1\text{--}30$ days | **Requires explicit operator confirmation** | Red (`Critical`) |
| **Expired** | $\le 0$ days | **Hard-blocked from release** (HTTP 400) | Dark Red (`Expired`) |

> [!NOTE]
> All threshold values are fully customizable by the clinic administrator in **Settings** and can be reset to factory defaults with 1 click.

---

### Concept 3: Crash-Proof Offline SQLite in WAL Mode
Why don't we use MongoDB, PostgreSQL, or MySQL?
* External database servers require background services (`mysqld.exe`) that can fail to start, require configuration, and consume RAM.
* SQLite is embedded directly into Node.js via `better-sqlite3`. The database is a single file: `server/data/pharmacy_inventory.db`.

#### What is WAL Mode?
By default, databases write directly to the database file. If the power cuts mid-write, the file can be corrupted.  
In `server/db.js`, we turn on **Write-Ahead Logging**:
```javascript
db.pragma('journal_mode = WAL');
```
* **The Analogy:** Imagine keeping a small notepad (the WAL file) next to a heavy accounting ledger. When a customer buys medicine, you quickly scribble it on the notepad. Even if the lights go out, the notepad is intact. Periodically, the notes are cleanly merged into the big ledger.
* This guarantees **zero file corruption**, even during unexpected power outages.

---

### Concept 4: Scrypt Cryptographic Password Security
Never store plaintext passwords in a database! If someone copies the database file, all passwords would be exposed.

In `server/db.js`, we use Node.js built-in `crypto.scryptSync`:
1. When a user creates or changes a password, we generate a random 16-byte salt:
   ```javascript
   const salt = crypto.randomBytes(16).toString('hex');
   ```
2. We derive a 64-byte key using Scrypt (a memory-hard hashing function designed to resist GPU/brute-force attacks):
   ```javascript
   const hash = crypto.scryptSync(password, salt, 64).toString('hex');
   ```
3. We store the string `salt:hash` in the `users` table.
4. During login, `verifyPassword` takes the user's password, hashes it with the stored salt, and compares the hashes using `crypto.timingSafeEqual` to prevent timing attacks.

---

### Concept 5: The Immutable Audit Trail Ledger
Clinic pharmacies must maintain strict records for regulatory compliance (FDA / DOH guidelines). In `server/db.js`, the `audit_logs` table records every sensitive action:

* `USER_LOGIN` / `USER_LOGOUT`
* `STOCK_OUT` (Standard FEFO dispensing)
* `STOCK_OUT_OVERRIDE` (Dispensing a non-FEFO batch with mandatory justification)
* `ALERT_ACKNOWLEDGED` (Operator manual alert acknowledgment)
* `PRICE_ADJUSTMENT` (Changing batch cost or selling price)
* `DATABASE_BACKUP_EXPORT` (USB backup exports)

> [!IMPORTANT]
> The audit trail is **append-only**. There is no API route or UI button to edit or delete an audit log. Records can be filtered and exported to CSV anytime.

---

## 6. Beginner Developer Playbook: "How Do I Make Changes?"

Here are 5 concrete step-by-step recipes for common development tasks.

---

### Recipe 1: Adding a New Backend REST Endpoint
Suppose you want to add a route that returns the total count of medicines:

1. Open `server/routes/medicines.js`.
2. Add your route handler:
   ```javascript
   // GET /api/medicines/count
   router.get('/count', (req, res) => {
     try {
       const row = db.prepare('SELECT COUNT(*) AS total FROM medicines').get();
       res.json({ total_medicines: row.total });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });
   ```
3. Restart the server:
   ```powershell
   .\runtime\node.exe server/index.js
   ```
4. Test it in your browser: `http://localhost:5000/api/medicines/count`.

---

### Recipe 2: Modifying the Database Schema
Suppose you want to add a `manufacturer_contact` column to the `medicines` table:

1. Open `server/db.js`.
2. Locate the `initDatabase()` function.
3. Add an `ALTER TABLE` statement wrapped in a `try/catch` (this ensures existing databases upgrade without throwing an error if the column already exists):
   ```javascript
   try {
     db.prepare('ALTER TABLE medicines ADD COLUMN manufacturer_contact TEXT').run();
   } catch (e) {
     // Column already exists, safe to ignore
   }
   ```
4. When the server boots, the new column will be added automatically!

---

### Recipe 3: Adding or Editing a React View
Suppose you want to edit the Dashboard to add a custom greeting:

1. Open `client/src/views/DashboardView.jsx`.
2. Find the header section around line 40.
3. Edit the JSX (e.g., add a badge or change the subtitle text).
4. Save the file.
5. **Crucial Step:** Because the server serves the compiled files from `client/dist`, you must rebuild the client (see Recipe 4)!

---

### Recipe 4: Recompiling the Production Frontend
Whenever you edit anything inside `client/src/`, you must rebuild the bundle with Vite:

```powershell
# 1. Navigate to the client source folder
cd C:\Users\emman\.gemini\antigravity\scratch\rka-pharmacy-ims\client

# 2. Run the Vite build command
npm.cmd run build

# 3. Copy the compiled dist folder to the offline client directory
Copy-Item -Path "dist\*" -Destination "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline\client\dist" -Recurse -Force

# 4. Also keep client/src in sync
Copy-Item -Path "src\*" -Destination "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline\client\src" -Recurse -Force
```
Refresh your browser (`Ctrl + F5` to clear browser cache), and your changes will appear immediately!

---

### Recipe 5: Writing an Automated Verification Test
Suppose you want to add an automated test to ensure that the system prevents setting negative prices:

1. Open `RKA-Pharmacy-IMS-Client-Offline/verify_all_specs.js`.
2. Add an assertion inside `runTests()`:
   ```javascript
   console.log('Testing Negative Price Prevention:');
   const badPriceRes = await request('POST', '/api/batches', {
     medicine_id: 1,
     batch_number: 'TEST-NEG-01',
     expiration_date: '2027-12-31',
     initial_quantity: 10,
     unit_cost: -50, // Negative cost!
     selling_price: 10
   });
   assert(badPriceRes.statusCode === 400, 'Rejects negative unit cost with 400 Bad Request');
   ```
3. Run the test suite:
   ```powershell
   .\runtime\node.exe verify_all_specs.js
   ```

---

## 7. Working with Barcode Scanners (Hardware Guide)

### How Barcode Scanners Actually Work
Many beginner developers assume barcode scanners require complex serial drivers (RS-232) or Bluetooth SDKs. **They do not!**

Standard USB barcode scanners operate as **HID Keyboard Wedge** devices:
1. When you plug the scanner into a USB port, Windows sees it as a **standard USB keyboard**.
2. When the laser scans a barcode (e.g., `8806123456789`), the scanner literally "types" the characters into your computer very quickly (<20 milliseconds for 13 characters).
3. At the end of the barcode, the scanner sends an **`Enter` key (`\r\n`)**.

### How the Code Captures Scans (`StockOutView.jsx`)
1. **Auto-Focus:** An invisible or stylized input box is focused on page load using `inputRef.current?.focus()`.
2. **`onKeyDown` Handler:** When the scanner hits `Enter`, the event listener intercepts it, extracts the string, looks up the medicine, and adds the earliest FEFO batch to the cart.
3. **Global Scan Buffer:** If the user clicks elsewhere on the screen, a global window listener tracks keystroke timing. Since humans type at >80ms per key while barcode scanners type at <20ms, the system automatically redirects fast bursts of keystrokes to the barcode handler!

### How to Test Without a Barcode Scanner
You do **not** need a physical scanner to develop or test:
1. Open the **Dispense (FEFO)** tab in the app.
2. Click into the barcode input field.
3. Type any barcode manually (e.g., `MED-001-AMOXI` or `880123456789`) and press **Enter** on your keyboard.
4. The system behaves exactly as if a laser scanned the box!

---

## 8. Common Beginner Pitfalls & Traps to Avoid

### Pitfall 1: "I edited a React file, but my browser shows old code!"
* **Cause:** The Express backend serves static assets from `client/dist/`, NOT from `client/src/`.
* **Fix:** Rebuild the frontend bundle using `npm.cmd run build` inside the client folder and copy the `dist/` output over (see Recipe 4).

### Pitfall 2: "Port 5000 is already in use (`EADDRINUSE`)!"
* **Cause:** A previous instance of the Node server is still running in the background.
* **Fix:** Open PowerShell and kill the process:
  ```powershell
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  ```

### Pitfall 3: "Running from inside the ZIP file fails!"
* **Cause:** If you double-click `RKA-Pharmacy-IMS.exe` directly inside the Windows `.zip` preview without extracting, Windows runs it in a temporary folder (`AppData\Local\Temp`). When you close the app, all database changes are deleted!
* **Fix:** Always right-click the `.zip` file and select **Extract All...** to a real folder first.

### Pitfall 4: PowerShell Execution Policy Error (`npm.ps1 cannot be loaded`)
* **Cause:** Windows PowerShell disables script execution by default.
* **Fix:** Use `npm.cmd` instead of `npm`, e.g.:
  ```powershell
  npm.cmd run build
  ```

---

## 9. Glossary for Non-Pharmacist Developers

| Term | Full Name | Plain English Meaning |
| :--- | :--- | :--- |
| **FEFO** | First-Expiry, First-Out | Inventory strategy where medicines with the nearest expiration date are sold first to minimize spoilage. |
| **FIFO** | First-In, First-Out | Older inventory strategy where items received first are sold first, regardless of expiration date. |
| **FEFO+** | Enhanced FEFO | The custom algorithm designed in this thesis that pairs FEFO with sales velocity and Expiry Risk Margin. |
| **ADC / ADQS** | Average Daily Consumption | The average number of units of a medicine sold per day over the last 30 days. |
| **DTE** | Days to Expiry | Number of days remaining between today and a batch's expiration date. |
| **DOS** | Days of Supply | How many days the current stock will last based on the current sales velocity (`Stock / ADC`). |
| **ERM** | Expiry Risk Margin | A buffer metric (`DTE - DOS - Buffer`). If negative, the batch is at risk of expiring on the shelf. |
| **ROP** | Reorder Point | The inventory level that automatically triggers placing a replenishment order with the supplier. |
| **Lead Time** | Supplier Lead Time | The number of days it takes for a pharmaceutical distributor to deliver medicines after an order is placed. |
| **Buffer Days** | Safety Buffer | Extra cushion days configured to absorb supplier delivery delays or sudden demand spikes. |
| **WAL** | Write-Ahead Logging | A crash-proof SQLite transaction log mode that prevents database corruption during power outages. |
| **HID Wedge** | Human Interface Device Wedge | Standard hardware protocol where a barcode scanner emulates a USB keyboard. |

---

*Document Version:* 3.0.0 (Comprehensive Beginner Edition)  
*Last Updated:* September 2026  
*Target System:* R.K.A Pharmacy IMS (San Antonio, Agoo, La Union)
