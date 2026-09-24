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
4. [Follow the Data: 5 Step-by-Step Request Traces](#4-follow-the-data-5-step-by-step-request-traces)
   - [Trace 1: User Authentication & Workstation Lock](#trace-1-user-authentication--workstation-lock)
   - [Trace 2: Barcode Scanning & Multi-Batch FEFO Dispensing](#trace-2-barcode-scanning--multi-batch-fefo-dispensing)
   - [Trace 3: Demand Forecasting & Expiry Risk Calculation](#trace-3-demand-forecasting--expiry-risk-calculation)
   - [Trace 4: End-of-Day USB Removable Storage Backup](#trace-4-end-of-day-usb-removable-storage-backup)
   - [Trace 5: Purchase Orders Procurement & Receiving Lifecycle](#trace-5-purchase-orders-procurement--receiving-lifecycle)
5. [The 10 Core Architectural Concepts Explained Simply](#5-the-10-core-architectural-concepts-explained-simply)
   - [Concept 1: Demand Forecasting & FEFO+ Risk Margin Intelligence](#concept-1-demand-forecasting--fefo-risk-margin-intelligence)
   - [Concept 2: 5-Tier Expiration Countdown & Confirmation Gate](#concept-2-5-tier-expiration-countdown--confirmation-gate)
   - [Concept 3: Crash-Proof Offline SQLite in WAL Mode](#concept-3-crash-proof-offline-sqlite-in-wal-mode)
   - [Concept 4: Scrypt Cryptographic Password Security](#concept-4-scrypt-cryptographic-password-security)
   - [Concept 5: The Immutable Audit Trail Ledger](#concept-5-the-immutable-audit-trail-ledger)
   - [Concept 6: Procurement State Machine & Multi-Batch Auto-Allocation](#concept-6-procurement-state-machine--multi-batch-auto-allocation)
   - [Concept 7: Clean & Simple vs. Maximalist UI Mode Architecture](#concept-7-clean--simple-vs-maximalist-ui-mode-architecture)
   - [Concept 8: Offline Tri-Lingual Localization System (`LanguageContext`)](#concept-8-offline-tri-lingual-localization-system-languagecontext)
   - [Concept 9: PO Auto-Drafting Modes & Bulk Reorder Sync](#concept-9-po-auto-drafting-modes--bulk-reorder-sync)
   - [Concept 10: Cumulative Quick Dispense & Date Jump UI Ergonomics](#concept-10-cumulative-quick-dispense--date-jump-ui-ergonomics)
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

### Running the Automated Test Suite & Health Audits
To verify that all 46 system and clinic specifications are functioning:
```powershell
cd RKA-Pharmacy-IMS-Client-Offline
.\runtime\node.exe tests/verify_all_specs.js
```
You should see:
```text
================================================================
 ALL SPECIFICATION VERIFICATION SUITE COMPLETED:
 46 PASSED, 0 FAILED
================================================================
```

To run the complete system and database health audit:
```powershell
.\runtime\node.exe tests/check_system_health.js
```

To run the comprehensive stress and edge-case test suite:
```powershell
.\runtime\node.exe tests/stress_test_error_handling.js
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
│       ├── purchaseOrders.js   # Purchase order procurement, receiving, & cancellation
│       ├── transactions.js     # Dispensing (POS), multi-batch FEFO split, override logs
│       ├── fefoPlus.js         # Daily demand moving avg, Days to Depletion, Expiry Risk Margin
│       ├── audit.js            # Immutable audit trail ledger & CSV export
│       ├── simulation.js       # FIFO vs FEFO vs FEFO+ comparative simulation
│       ├── settings.js         # Baseline window (N), tier thresholds, clinic profile
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
│   │   ├── context/
│   │   │   └── LanguageContext.jsx # Offline tri-lingual dictionary (EN, FIL, TAGLISH) & t() hook
│   │   ├── views/              # Full-page screens corresponding to navigation tabs
│   │   │   ├── DashboardView.jsx       # Metrics, priority alert banner, countdown breakdown
│   │   │   ├── InventoryView.jsx       # Medicine catalog, batch table, printable barcode labels
│   │   │   ├── StockInView.jsx         # Intake workflow, cost inheritance, supplier tracking
│   │   │   ├── PurchaseOrdersView.jsx  # Purchase orders lifecycle & printable slip vouchers
│   │   │   ├── StockOutView.jsx        # Dispensing POS, multi-batch FEFO, barcode focus, cart
│   │   │   ├── FefoPlusView.jsx        # Daily demand, ERM radar, 1-click reorder sync
│   │   │   ├── AuditTrailView.jsx      # Immutable system logs with search and CSV export
│   │   │   ├── SimulationView.jsx      # Historical replay comparing FIFO vs FEFO vs FEFO+
│   │   │   └── SettingsView.jsx        # Configurable window (N), tiers, USB backup, security
│   │   └── App.jsx             # Workstation shell, state orchestrator, auth guard
│   └── dist/                   # Compiled HTML/CSS/JS served to the browser
├── tests/                      # Automated verification, edge case & health diagnostics
│   ├── check_system_health.js  # Zero-defect SQLite integrity, schema & foreign key auditor
│   ├── verify_all_specs.js     # Automated test suite validating all system specifications (46 tests)
│   └── stress_test_error_handling.js # Concurrency, boundary & robustness test suite
├── Setup-Desktop-Shortcut.bat  # 1-click shortcut installer
├── start-app.bat               # Fallback launcher
└── RKA-Pharmacy-IMS.exe        # Native Windows launcher
```

---

## 4. Follow the Data: 5 Step-by-Step Request Traces

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

### Trace 2: Barcode Scanning & Multi-Batch FEFO Dispensing
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
4. FEFO Allocation & Multi-Batch Auto-Splitting:
   • If requested quantity fits in the earliest expiring batch: that batch is allocated.
   • If requested quantity exceeds the earliest batch: the system automatically splits the
     order across sequential FEFO batches until the entire quantity is fulfilled.
   • If any allocated batch is in Warning (31–90d), Critical (1–30d), or At-Risk:
     BatchStatusConfirmModal opens -> Operator reviews countdown and clicks "Confirm".
   • If user manually changes or overrides batch order:
     OverrideModal opens -> Operator must enter a mandatory justification note.
   • If EXPIRED (<= 0 days):
     Action is HARD-BLOCKED. An error banner displays: "Expired batch cannot be released!"
       │
       ▼
5. Items enter Cart -> Pharmacist clicks "Complete Dispense".
       │
       ▼
6. POST /api/transactions/stock-out is called with:
   { items: [{ batch_id: 2, quantity: 10, status_confirmed: true }, { batch_id: 3, quantity: 5, status_confirmed: true }] }
       │
       ▼
7. server/routes/transactions.js opens an atomic SQLite Transaction:
   • Deducts quantity from each allocated batch (sets status to 'consumed' if quantity reaches 0).
   • Inserts records into transactions table with locked counter selling prices.
   • Inserts STOCK_OUT or STOCK_OUT_OVERRIDE records into audit_logs table.
       │
       ▼
8. Server returns 201 Created with printable receipt payload. Cart clears and focuses input for next scan.
```

---

### Trace 3: Demand Forecasting & Expiry Risk Calculation
How does the system calculate daily demand and identify batches at risk of expiring on the shelf?

```
1. Frontend requests GET /api/fefo-plus/analysis.
       │
       ▼
2. server/routes/fefoPlus.js reads the user-configured baseline window:
   N = config.forecasting_window_days (10, 20, or 30 operational days; default: 30).
       │
       ▼
3. Cold-Start Rule Check:
   Elapsed transaction history (t) is measured across distinct operational dates.
   • If t < N: The system identifies a Cold-Start condition. Automated algorithmic reorder
     generation is safely suppressed, and an informational banner alerts the operator:
     "Cold-Start Baseline Gathering: Falling back to clinic manual thresholds."
   • If t >= N: Demand forecasting activates fully:
     Daily Demand = (Sum of confirmed stock-out units over N days) / N
       │
       ▼
4. For each active batch:
   Days to Expiry (T_expiry) = Expiration Date - Today
   Days to Depletion (T_consume) = Current Batch Quantity / Daily Demand
   Expiry Risk Margin (ΔT) = T_expiry - T_consume - Buffer Days
   Predicted Expired Waste (Q_waste) = max(0, Batch Quantity - (Daily Demand * T_expiry))
       │
       ▼
5. Risk Classification:
   • If ΔT < 0: Batch is flagged as "At-Risk" (will expire before clinic demand can deplete it).
   • Dynamic Reorder Point: ROP = (Daily Demand * Lead Time) + Safety Stock.
   • If Current Stock <= ROP: Added to Suggested Reorder list with 1-click PO sync!
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

### Trace 5: Purchase Orders Procurement & Receiving Lifecycle
How does the system manage reordering supplies from pharmaceutical distributors?

```
[Operator clicks "Sync to PO" in FEFO+ Reorder Planner or "New Purchase Order" in PO Tab]
       │
       ▼
1. POST /api/purchase-orders/draft is called with supplier info and line items:
   { supplier_name: "Metro Drug Inc.", items: [{ medicine_id: 1, quantity_ordered: 100, unit_cost: 4.50 }] }
   • Creates record in purchase_orders table with status 'DRAFT' and generated PO number (e.g. PO-20260923-0001).
   • Inserts line items into purchase_order_items table.
   • Logs PURCHASE_ORDER_CREATE in audit_logs.
       │
       ▼
2. Review & Placement:
   • Operator reviews quantities, distributor info, and total estimated cost in PurchaseOrdersView.jsx.
   • Clicks "Place Order" -> POST /api/purchase-orders/:id/place updates status to 'PLACED' and sets placed_at timestamp.
       │
       ▼
3. Printable Voucher Generation:
   • Operator clicks "Print PO Slip" -> Opens voucher modal isolated with CSS .printable-area.
   • Browser triggers window.print(), generating an official clinic procurement order slip complete
     with itemized costs, supplier details, delivery instructions, and authorized signature lines.
       │
       ▼
4. Delivery Receiving & Batch Registration:
   • Distributor delivers medicines to clinic counter. Operator clicks "Receive Delivery".
   • Operator enters invoice number, actual delivered quantities, batch numbers, and expiry dates.
   • POST /api/purchase-orders/:id/receive runs inside an atomic SQLite transaction:
     - Updates purchase_order_items with received quantities.
     - Automatically creates and activates new inventory batches in batches table.
     - Updates purchase_orders status to 'RECEIVED' and sets received_at timestamp.
     - Logs PURCHASE_ORDER_RECEIVE in audit_logs.
   • New stock is immediately available for barcode dispensing under FEFO rules!
       │
       ▼
5. Cancellation (If distributor has stockouts):
   • If an order cannot be fulfilled, operator clicks "Cancel Order" with an audit reason.
   • POST /api/purchase-orders/:id/cancel sets status to 'CANCELLED' (strictly forbidden once received).
```

---

## 5. The 6 Core Architectural Concepts Explained Simply

### Concept 1: Demand Forecasting & FEFO+ Risk Margin Intelligence
In traditional FIFO (First-In, First-Out), medicines are sold based on when the pharmacy *bought* them, regardless of expiry dates.  
In standard FEFO (First-Expiry, First-Out), medicines are sold strictly by expiration date, but the pharmacy has no early visibility into whether inventory velocity will exhaust a batch before its shelf life expires.  
**FEFO+ combines actual consumption velocity with remaining shelf life and user-configurable forecasting parameters:**

#### 1. Configurable Demand Observation Window ($N$)
Unlike rigid systems with hardcoded historical windows, the operator can configure the baseline observation window ($N$) to **10, 20, or 30 operational days** (default: 30 days) in **Settings**. The moving average daily demand ($\hat{D}_i$) is computed dynamically:

$$\hat{D}_i = \frac{1}{N} \sum_{t=1}^{N} S_{i,t}$$

Where $S_{i,t}$ represents confirmed stock-out units on operational day $t$.

#### 2. Cold-Start Suppression Rule ($t < N$)
When a new system is deployed or insufficient transaction history is available ($t < N$ distinct operational days), computing an automated moving average could yield premature or distorted replenishment orders. The system enforces an automated **Cold-Start Rule**:
- Algorithmic ROP generation is safely suppressed.
- An informative notification banner is displayed: *"Cold-Start Baseline Gathering: Falling back to clinic manual thresholds."*
- Dispensing continues safely using standard FEFO allocation.
- Reorder planning gracefully falls back to the clinic's manually configured minimum stock levels ($R_i$).

#### 3. Expiry Risk Margin ($\Delta T$) & Days to Depletion
For each active batch $b$ of medicine $i$:

$$\text{Days to Expiry: } T_{\text{expiry}} = \text{Expiration Date} - \text{Current Date}$$

$$\text{Days to Depletion: } T_{\text{consume}} = \frac{Q_{i,b}}{\hat{D}_i}$$

$$\text{Expiry Risk Margin: } \Delta T_{i,b} = T_{\text{expiry}} - T_{\text{consume}} - \text{Safety Buffer Days}$$

* **If $\Delta T \ge 0$:** The batch is safe. Normal clinic demand will consume all units prior to expiration.
* **If $\Delta T < 0$:** The batch is **At-Risk**. Current sales velocity is too slow to exhaust the batch before expiry.
* **Predicted Expired Waste Volume ($Q_{\text{waste}}$):**
  $$Q_{\text{waste}} = \max\left(0,\, Q_{i,b} - (\hat{D}_i \times T_{\text{expiry}})\right)$$

#### 4. Dynamic Suggested Reorder Point (ROP)
$$\text{ROP}_i = (\hat{D}_i \times \text{Supplier Lead Time}) + (\hat{D}_i \times \text{Safety Buffer Days})$$
If current total stock $\le \text{ROP}_i$, the item automatically appears in the Suggested Reorders list with 1-click Purchase Order synchronization.

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
* `PURCHASE_ORDER_CREATE` / `PURCHASE_ORDER_PLACE` / `PURCHASE_ORDER_RECEIVE` / `PURCHASE_ORDER_CANCEL`
* `SETTINGS_UPDATE` (Modifying observation window N, safety buffer, or countdown tiers)
* `DATABASE_BACKUP_EXPORT` (USB backup exports)

> [!IMPORTANT]
> The audit trail is **append-only**. There is no API route or UI button to edit or delete an audit log. Records can be filtered and exported to CSV anytime.

---

### Concept 6: Procurement State Machine & Multi-Batch Auto-Allocation

#### The Purchase Order State Machine
Clinic reordering follows a strict, traceable 4-state lifecycle:

```
[ SUGGESTED REORDERS ] 
         │ 1-Click Sync
         ▼
     [ DRAFT ] ───────────► [ CANCELLED ] (Pre-delivery cancellation with audit note)
         │
         │ Place Order
         ▼
     [ PLACED ] ──────────► [ CANCELLED ]
         │
         │ Receive Delivery (Records invoice #, batch #, exp date, cost)
         ▼
    [ RECEIVED ] ──► (Generates active inventory batches; immutable)
```

1. **`DRAFT`**: Items and quantities can be added, modified, or removed freely.
2. **`PLACED`**: The order has been transmitted to the supplier. A formal printable PO voucher can be printed with authorized clinic signature lines.
3. **`RECEIVED`**: The goods have arrived. In a single atomic database transaction, received quantities are verified, new active batches are inserted into the `batches` table, and the PO is sealed.
4. **`CANCELLED`**: Cancelled orders require a documented reason and cannot be edited or revived.

#### Multi-Batch FEFO Auto-Allocation
During dispensing (POS), when a customer requests a quantity greater than what is available in the earliest-expiring batch:
* The system does **not** reject the sale or require manual calculations.
* It automatically splits the line item across consecutive active batches sorted by `expiration_date ASC`.
* Each allocated sub-batch enforces its respective countdown tier gate (Warning/Critical confirmation).
* Prices are locked per batch to prevent counter discrepancies.

---

### Concept 7: Clean & Simple vs. Maximalist UI Mode Architecture

Provincial pharmacy operators face high cognitive load during morning rushes, where complex charts and nine different menu options increase the risk of dispensing errors. Conversely, clinic owners require deep analytics, full audit trails, and policy simulations during evening administration.

The system solves this with a **Dual UI Operational State**:
```
                        ┌────────────────────────────────────────┐
                        │      Workstation UI Mode Switcher      │
                        │    (Persisted in localStorage)         │
                        └───────────────────┬────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
        [ Clean & Simple Mode ]                         [ Maximalist Mode ]
    • Essential 4-tab workflow:                     • Full 9-view workspace:
      - Dashboard (Vital stats only)                  - Dashboard, Inventory, Stock In
      - Dispense / POS (Large touchpoints)            - Purchase Orders, Dispense, FEFO+
      - Stock In (Streamlined intake)                 - Audit Trail, Simulation, Settings
      - Inventory (Core stock table)                • Granular parameter configuration
    • Prominent quick-dispense buttons              • Comprehensive analytical graphs
    • Background administrative panels hidden       • Exportable audit ledgers & reports
```

#### State Orchestration (`App.jsx` & `Navbar.jsx`)
1. **Persistent State:** Managed via `const [uiMode, setUiMode] = useState(() => localStorage.getItem('rka_ui_mode') || 'clean');`.
2. **Tab Filtering:** In Clean & Simple mode, `Navbar.jsx` renders only the 4 primary tabs: `dashboard`, `stock-out`, `stock-in`, and `inventory`.
3. **Responsive View Adaptation:** Individual views receive `uiMode` as a prop and selectively collapse secondary metric tables and informational banners to keep the counter clean.

---

### Concept 8: Offline Tri-Lingual Localization System (`LanguageContext`)

Community clinics in northern the Philippines operate fluidly across **English**, **Filipino (Tagalog)**, and **Taglish** (colloquial Filipino-English hybrid). External cloud translation APIs (e.g. Google Translate) fail completely during rural internet outages.

The system implements an embedded, zero-dependency **Offline Tri-Lingual Architecture**:
```
┌────────────────────────────────────────────────────────────────────────┐
│                        LanguageContext.jsx                             │
│                                                                        │
│  State: language ('EN' | 'FIL' | 'TAGLISH')                            │
│  Storage: localStorage.getItem('rka_lang_preference')                  │
│                                                                        │
│  Translation Function:                                                 │
│  t(key, fallbackText, params)                                          │
│                                                                        │
│  Embedded Dictionaries:                                                │
│  ├── EN:      {"nav_pos": "Dispense", "btn_add": "Add to Cart"}        │
│  ├── FIL:     {"nav_pos": "Magbenta", "btn_add": "Ilagay sa Cart"}     │
│  └── TAGLISH: {"nav_pos": "Mag-Dispense", "btn_add": "I-add sa Cart"}  │
└────────────────────────────────────────────────────────────────────────┘
```

#### How to Use `useLanguage` in Any React Component:
```javascript
import { useLanguage } from '../context/LanguageContext';

export default function MyComponent() {
  const { t } = useLanguage();
  return (
    <button className="btn-primary">
      {t('btn_complete_sale', 'Complete Dispense')}
    </button>
  );
}
```
* **Fallback Safety:** If a translation key is missing in the active language dictionary, `t()` immediately falls back to `fallbackText`, ensuring zero runtime `undefined` crashes.
* **Coverage:** Fully wired across all 9 views, header navigation, modals (`ExitConfirmModal`, `BatchStatusConfirmModal`, `HelpGuideModal`), and alerts.

---

### Concept 9: PO Auto-Drafting Modes & Bulk Reorder Sync

Procurement replenishment is governed by two complementary workflows designed for single-operator clinics:

#### 1. Configurable Drafting Modes (`po_drafting_mode`)
Stored in SQLite `settings` table:
* **`manual` (Default):** The system displays replenishment suggestions based on the dynamic reorder point formula $\text{ROP} = \hat{D}_i \cdot (L_i + K_{\text{buffer}})$. The operator manually reviews low-stock items and explicitly creates draft orders.
* **`instant_auto`:** The backend automatically compiles medicines falling below their reorder threshold into ready-to-order supplier draft purchase orders without manual item selection.

#### 2. Reorder Planner Bulk Draft (`POST /api/purchase-orders/bulk-draft`)
From the **FEFO+ Risk & Reorder** view, the operator can click **"Bulk Draft Purchase Orders"**:
1. The server receives the array of replenishment items.
2. Items are grouped automatically by `supplier_name`.
3. Sequential PO reference numbers (`PO-YYYYMMDD-XXXX`) are allocated.
4. Estimated unit costs are inherited from each medicine's latest active batch.
5. In a single atomic SQLite database transaction, draft purchase orders and line items are inserted, and a `BULK_CREATE_PURCHASE_ORDERS` entry is written to the immutable audit trail.

---

### Concept 10: Cumulative Quick Dispense & Date Jump UI Ergonomics

Counter efficiency and error prevention are reinforced by two custom UI interaction patterns:

#### 1. Cumulative Quick Dispense with Stock Clamping (`StockOutView.jsx`)
Under the quantity input field, operators have access to `+1`, `+5`, `+10`, and `Max` buttons:
```javascript
// Clamped cumulative increment:
onClick={() => setQuantityInput(prev => 
  Math.min(currentSelectedBatch.current_quantity, (parseInt(prev, 10) || 0) + amount)
)}
```
* **Repeated Clicks Accumulate:** Clicking `+5` three times automatically increments to 15.
* **Strict Safety Clamping:** Quantity is strictly clamped using `Math.min(current_quantity, ...)` so an operator can never accidentally request more units than the selected batch contains.
* **1-Click Max:** Clicking `Max` sets the exact remaining batch stock.

#### 2. Calendar-Safe Expiry Date Jump Buttons (`StockInView.jsx`)
Entering expiration dates for new stock intake is accelerated by `+6 Mos`, `+1 Yr`, `+2 Yrs`, and `+3 Yrs` pill buttons.
To prevent the standard JavaScript `Date` rollover bug where adding months on the 31st overflows into the following month (e.g. March 31 + 6 months rolling into October 1 instead of September 30), the algorithm clamps to the month's final day:
```javascript
const d = new Date();
const originalDay = d.getDate();
d.setMonth(d.getMonth() + pill.months);
if (d.getDate() !== originalDay) {
  d.setDate(0); // Safely clamp to the last valid day of the target month
}
setExpDate(d.toISOString().split('T')[0]);
```

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
# 1. Navigate to the client directory
cd "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline\client"

# 2. Run the Vite build command
npm.cmd run build
```
The compiled files are automatically written into `client/dist/`, which the Express server serves immediately. Refresh your browser (`Ctrl + F5` to clear browser cache), and your changes will appear!

---

### Recipe 5: Writing an Automated Verification Test
Suppose you want to add an automated test to ensure that the system prevents setting negative prices:

1. Open `RKA-Pharmacy-IMS-Client-Offline/tests/verify_all_specs.js`.
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
   .\runtime\node.exe tests/verify_all_specs.js
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
* **Fix:** Rebuild the frontend bundle using `npm.cmd run build` inside `client/` (see Recipe 4).

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
| **FEFO+** | Enhanced FEFO | The custom algorithm combining FEFO with moving average daily demand and Expiry Risk Margin. |
| **PO** | Purchase Order | Commercial procurement document issued to a supplier specifying medicine items, quantities, and costs. |
| **$N$** | Observation Window | Configurable operational baseline window (10, 20, or 30 days) used to compute average daily demand. |
| **Cold-Start** | Cold-Start Safeguard | Condition where transaction history $t < N$ days; automated reorders are suppressed in favor of manual thresholds. |
| **ADC / Daily Demand** | Average Daily Demand | The moving average number of units of a medicine sold per operational day over the selected $N$-day window. |
| **DTE / $T_{\text{expiry}}$** | Days to Expiry | Number of days remaining between today and a batch's expiration date. |
| **DTC / $T_{\text{consume}}$** | Days to Depletion | How many days the current batch stock will last based on daily demand (`Batch Quantity / Daily Demand`). |
| **ERM / $\Delta T$** | Expiry Risk Margin | Buffer metric ($T_{\text{expiry}} - T_{\text{consume}} - \text{Buffer}$). If negative, batch is at risk of expiring before depletion. |
| **$Q_{\text{waste}}$** | Predicted Expired Waste | Estimated unit volume that will spoil if consumption velocity does not increase before expiration date. |
| **ROP** | Reorder Point | The inventory level that automatically triggers placing a replenishment order with the supplier. |
| **Lead Time** | Supplier Lead Time | The number of days it takes for a pharmaceutical distributor to deliver medicines after an order is placed. |
| **Buffer Days** | Safety Buffer | Extra cushion days configured to absorb supplier delivery delays or sudden demand spikes. |
| **WAL** | Write-Ahead Logging | A crash-proof SQLite transaction log mode that prevents database corruption during power outages. |
| **HID Wedge** | Human Interface Device Wedge | Standard hardware protocol where a barcode scanner emulates a USB keyboard. |
| **Clean Mode** | Clean & Simple UI Mode | Streamlined 4-tab dispensary interface designed to reduce cognitive fatigue during peak counter sales. |
| **Maximalist Mode** | Maximalist UI Mode | Full 9-view workstation environment exposing all deep analytics, audit ledgers, settings, and simulators. |
| **Tri-Lingual i18n** | Offline Localization | Embedded client dictionary allowing instant switching between English, Simple Filipino, and Taglish without internet. |
| **Clamping** | Mathematical Clamping | Constraining quick-dispense increments (`Math.min(stock, current + inc)`) to strictly prevent over-dispensing. |
| **Date Jump** | Expiry Date Quick-Jump | 1-click pills (`+6m`, `+1y`, `+2y`, `+3y`) with month-end safety clamping for rapid stock intake. |
| **CIM Disk** | Common Information Model Disk | Windows PowerShell query (`Win32_LogicalDisk`) used to identify removable USB flash drives for backup. |
| **PO Drafting Mode** | Auto vs Manual PO Drafting | Setting governing whether low-stock items require manual PO creation or are automatically drafted. |

---

*Document Version:* 3.2.0 (Comprehensive Architect & Developer Edition)  
*Last Updated:* September 2026  
*Target System:* R.K.A Pharmacy IMS (San Antonio, Agoo, La Union)
