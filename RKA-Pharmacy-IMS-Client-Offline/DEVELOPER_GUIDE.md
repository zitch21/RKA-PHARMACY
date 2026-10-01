# Developer Guide: Architecture, Codebase Walkthrough, & Onboarding Manual
### R.K.A Pharmacy Inventory Management System (FEFO+)
**System Title:** Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO  
**Academic Institution:** Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)  
**College / Degree:** College of Computer Science, Bachelor of Science in Computer Science (S.Y. 2026–2027)  
**Client Partner:** R.K.A Pharmacy, San Antonio, Agoo, La Union (Sole Proprietor: Lourdes Gincen L. Cesista)  
**Architecture:** Offline-First, Single-Operator Workstation (React 19 + Node.js Express + Embedded SQLite WAL)

---

## 🌟 Welcome to the R.K.A Pharmacy IMS Codebase!

If you are a beginner or a junior developer opening this project for the first time, **welcome!** 

This guide is designed specifically for you. It explains how this system works, why it was designed this way, where every file lives, and how you can comfortably read, modify, and extend the code with confidence.

For end-user and non-technical staff operations, please refer to the interactive in-app **"Help Guide"** modal (Basic & Advance) accessible directly from the top navigation bar or by pressing the **`F1`** shortcut key anywhere in the workstation.

---

## Table of Contents
1. [The 30-Second Mental Model (How Everything Connects)](#1-the-30-second-mental-model-how-everything-connects)
2. [Beginner's Day 1: Running the App in 5 Minutes](#2-beginners-day-1-running-the-app-in-5-minutes)
3. [The Complete Codebase Tour (Where Does Everything Live?)](#3-the-complete-codebase-tour-where-does-everything-live)
4. [Follow the Data: 7 Step-by-Step Request Traces](#4-follow-the-data-7-step-by-step-request-traces)
   - [Trace 1: User Authentication & Workstation Lock](#trace-1-user-authentication--workstation-lock)
   - [Trace 2: Barcode Scanning & Multi-Batch FEFO Dispensing](#trace-2-barcode-scanning--multi-batch-fefo-dispensing)
   - [Trace 3: Demand Forecasting & Expiry Risk Calculation](#trace-3-demand-forecasting--expiry-risk-calculation)
   - [Trace 4: End-of-Day USB Removable Storage Backup](#trace-4-end-of-day-usb-removable-storage-backup)
   - [Trace 5: Purchase Orders Procurement & Receiving Lifecycle](#trace-5-purchase-orders-procurement--receiving-lifecycle)
   - [Trace 6: Interactive Demo Sandbox Isolation (`x-demo-mode` Header & AsyncLocalStorage)](#trace-6-interactive-demo-sandbox-isolation-x-demo-mode-header--asynclocalstorage)
   - [Trace 7: Global Omni-Search Universal Lookup (`/` or `Ctrl+K`)](#trace-7-global-omni-search-universal-lookup--or-ctrlk)
5. [The 19 Core Architectural Concepts Explained Simply](#5-the-19-core-architectural-concepts-explained-simply)
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
   - [Concept 11: Multi-Tab State Synchronization via Native `BroadcastChannel`](#concept-11-multi-tab-state-synchronization-via-native-broadcastchannel)
   - [Concept 12: Supplier DR / Sales Invoice Number Tracking Across Procurement & Batches](#concept-12-supplier-dr--sales-invoice-number-tracking-across-procurement--batches)
   - [Concept 13: Dual-Layer Database Disaster Recovery & Pre-Restore Safety Snapshots](#concept-13-dual-layer-database-disaster-recovery--pre-restore-safety-snapshots)
   - [Concept 14: Cryptographic Collision Entropy in POS Receipt Generation](#concept-14-cryptographic-collision-entropy-in-pos-receipt-generation)
   - [Concept 15: Isolated Demonstration Sandbox Architecture (`pharmacy_demo.db`)](#concept-15-isolated-demonstration-sandbox-architecture-pharmacy_demodb)
   - [Concept 16: Route-Level Authentication Gate & Rate-Limited Session Guard (`authMiddleware.js`)](#concept-16-route-level-authentication-gate--rate-limited-session-guard-authmiddlewarejs)
   - [Concept 17: Web Audio Synthesized Telemetry & Hardware Auditory Feedback](#concept-17-web-audio-synthesized-telemetry--hardware-auditory-feedback)
   - [Concept 18: Operational Expiry Horizons & Calendar Matrix Engine](#concept-18-operational-expiry-horizons--calendar-matrix-engine)
   - [Concept 19: Factory System Reset with Pre-Wipe Safety Backups](#concept-19-factory-system-reset-with-pre-wipe-safety-backups)
6. [Beginner Developer Playbook: "How Do I Make Changes?"](#6-beginner-developer-playbook-how-do-i-make-changes)
   - [Recipe 1: Adding a New Backend REST Endpoint](#recipe-1-adding-a-new-backend-rest-endpoint)
   - [Recipe 2: Modifying the Database Schema](#recipe-2-modifying-the-database-schema)
   - [Recipe 3: Adding or Editing a React View](#recipe-3-adding-or-editing-a-react-view)
   - [Recipe 4: Recompiling and Linting the Production Frontend](#recipe-4-recompiling-and-linting-the-production-frontend)
   - [Recipe 5: Running the Verification & Self-Check Suite](#recipe-5-running-the-verification--self-check-suite)
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
│   │  • Omni-Search (/ / ^K)│                   │  • USB Backup Manager      │   │
│   │  • Web Audio Telemetry │                   │  • Route-Level Auth Gate   │   │
│   └────────────────────────┘                   └─────────────┬──────────────┘   │
│                ▲                                             │ In-Process C++   │
│                │ Keystroke Events                            ▼                  │
│                │ (<20ms + Enter)               ┌────────────────────────────┐   │
│   ┌────────────┴───────────┐                   │    SQLite 3 (Embedded)     │   │
│   │  USB Barcode Scanner   │                   │  pharmacy_inventory.db     │   │
│   │  (Acts like a keyboard)│                   │  • WAL Mode (Crash-proof)  │   │
│   └────────────────────────┘                   │  • pharmacy_demo.db        │   │
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

1. **Native Launcher:** Double-click `RKA-Pharmacy-IMS.exe`. Starts the server silently in the background and opens the app in a clean borderless window.
2. **Batch Script:** Double-click `start-app.bat`. Starts the Node server in a console window and launches Edge or the default browser at `http://localhost:5000`.
3. **PowerShell Manual:** Open PowerShell in `RKA-Pharmacy-IMS-Client-Offline/` and run:
   ```powershell
   .\runtime\node.exe server/index.js
   ```
   Then open `http://localhost:5000` in Microsoft Edge or Google Chrome.

### Default Login Credentials
* **Username:** `admin`
* **Password:** `rka2026`
* **Operator:** Lourdes Gincen L. Cesista

### Running the Automated Test Suite & Health Audits

#### 1. Database and Logic Integrity Check (`tests/self_check.js`)
Validates database connectivity, core tables existence, catalog column schema, strict FEFO ascending order sorting, expiry countdown tiers, audit trail schemas, settings store, and factory reset detection:
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

#### 2. Static Code Analysis and Linter (`oxlint`)
Scans all 35 React frontend components and utility files for syntax errors, accessibility issues, and dead code:
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

## 3. The Complete Codebase Tour (Where Does Everything Live?)

The codebase is split into **Two Worlds**:
1. **The Backend (`server/`)**: Express.js REST API routes and SQLite database operations.
2. **The Frontend (`client/`)**: React 19 single-page application built with Vite and Tailwind CSS.
   * `client/src/`: Where developers write JSX components and CSS.
   * `client/dist/`: Where Vite outputs the compiled bundle that Express serves to the browser.

### Annotated Directory Tree
```text
RKA-Pharmacy-IMS-Client-Offline/
├── DEVELOPER_GUIDE.md             # Comprehensive developer manual & beginner guide
├── README.md                      # Client distribution guide
├── RKA-Pharmacy-IMS.exe           # Native C# launcher (silent background server + app mode)
├── Setup-Desktop-Shortcut.bat     # Client-level shortcut installer (OneDrive compatible)
├── start-app.bat                  # Client-level batch launcher
├── app-icon.ico                   # Workstation desktop icon (.ico)
├── app-icon.png                   # High-res application logo (.png)
├── runtime/                       # Bundled standalone Node.js v24.14.0 LTS binary
│   └── node.exe
├── tests/                         # Automated verification & diagnostic test scripts
│   └── self_check.js              # Database integrity, FEFO ordering, and schema self-check
├── server/
│   ├── index.js                   # Express app entry point & static file server
│   ├── db.js                      # SQLite database connection, schema, & Scrypt hashing
│   ├── seed.js                    # Initial clinic medicine catalog & sales history seed
│   ├── restore.js                 # Administrative CLI disaster recovery & database restore
│   ├── middleware/                # Server security & request context middleware
│   │   └── authMiddleware.js      # Session token gate & mutation route protection
│   ├── data/
│   │   ├── pharmacy_inventory.db  # Live production database (WAL mode enabled)
│   │   ├── pharmacy_demo.db       # Isolated demo sandbox database
│   │   └── backups/               # Rolling daily backup snapshots & safety snapshots
│   └── routes/                    # REST API endpoints (One file per feature area)
│       ├── auth.js                # Operator login, session check, password change
│       ├── backup.js              # USB flash drive detection, WAL checkpoint, safe restore API
│       ├── alerts.js              # Stock & expiry alerts with manual acknowledgment
│       ├── batches.js             # Batch creation, quantity updates, barcode tag generation
│       ├── medicines.js           # Medicine catalog, pricing, category management
│       ├── purchaseOrders.js      # Purchase order procurement, receiving, & cancellation
│       ├── transactions.js        # Dispensing (POS), multi-batch FEFO split, override logs
│       ├── fefoPlus.js            # Daily demand moving avg, Days to Depletion, Expiry Risk Margin
│       ├── audit.js               # Immutable audit trail ledger & CSV export
│       ├── simulation.js          # FIFO vs FEFO vs FEFO+ comparative simulation
│       ├── settings.js            # Baseline window (N), tier thresholds, clinic profile
│       └── evaluations.js         # System Usability Scale (SUS) survey engine
├── client/
│   ├── src/                       # React Source Code (Edit your UI here!)
│   │   ├── assets/                # Brand logos & icons (hero.png, vite.svg, react.svg)
│   │   ├── components/            # Reusable UI widgets & Modals
│   │   │   ├── Navbar.jsx         # Sidebar navigation, top header capsule, status badges
│   │   │   ├── LoginModal.jsx     # Scrypt workstation authentication lock screen
│   │   │   ├── GlobalSearchModal.jsx # Universal omni-search modal (/ or Ctrl+K)
│   │   │   ├── DispensaryCalendarModal.jsx # Operational calendar & expiry horizons
│   │   │   ├── AddMedicineModal.jsx # Modal to register new medicine catalog items
│   │   │   ├── EditMedicineModal.jsx # Modal to update medicine metadata & thresholds
│   │   │   ├── EditBatchModal.jsx # Modal to adjust batch pricing & details
│   │   │   ├── BatchStatusConfirmModal.jsx # Warning/Critical/At-Risk confirmation gate
│   │   │   ├── OverrideModal.jsx  # Mandatory FEFO override justification dialog
│   │   │   ├── StockAdjustmentModal.jsx # Modal for manual inventory adjustments with audit
│   │   │   ├── DisposalModal.jsx  # Safe expired medicine disposal with documentation
│   │   │   ├── BarcodeModal.jsx   # Modal to print Code 128 barcode shelf tags
│   │   │   ├── AlertNotificationDropdown.jsx # Top-right active alert drawer with Ack buttons
│   │   │   ├── HelpGuideModal.jsx # Dual-mode beginner & advanced operating guide
│   │   │   ├── HelperText.jsx     # Inline contextual guidance tooltips
│   │   │   ├── ErrorBoundary.jsx  # React rendering crash shield
│   │   │   └── ExitConfirmModal.jsx # Accidental exit prevention prompt
│   │   ├── context/
│   │   │   └── LanguageContext.jsx # Context provider for language state & t() hook
│   │   ├── i18n/
│   │   │   └── translations.js    # Offline tri-lingual dictionary (EN, FIL, TAGLISH)
│   │   ├── utils/
│   │   │   ├── api.js             # Central fetch wrappers
│   │   │   ├── apiInterceptor.js  # Demo mode header injection (x-demo-mode)
│   │   │   ├── audioTelemetry.js  # Web Audio API barcode & alert sound synthesizers
│   │   │   ├── dateFormatter.js   # Philippine locale date formatter
│   │   │   └── syncChannel.js     # BroadcastChannel multi-tab state synchronization
│   │   ├── views/                 # Full-page screens corresponding to navigation tabs
│   │   │   ├── DashboardView.jsx  # Metrics, priority alert banner, countdown breakdown
│   │   │   ├── InventoryView.jsx  # Medicine catalog, batch table, printable barcode labels
│   │   │   ├── StockInView.jsx    # Intake workflow, cost inheritance, supplier tracking
│   │   │   ├── PurchaseOrdersView.jsx # Purchase orders lifecycle & printable slip vouchers
│   │   │   ├── StockOutView.jsx   # Dispensing POS, multi-batch FEFO, barcode focus, cart
│   │   │   ├── FefoPlusView.jsx   # Daily demand, ERM radar, 1-click reorder sync
│   │   │   ├── AuditTrailView.jsx # Immutable system logs with search and CSV export
│   │   │   ├── SimulationView.jsx # Historical replay comparing FIFO vs FEFO vs FEFO+
│   │   │   └── SettingsView.jsx   # Configurable window (N), tiers, USB backup, security
│   │   ├── App.jsx                # Workstation shell, state orchestrator, auth guard
│   │   ├── index.css              # Global Tailwind directives & custom utilities
│   │   └── main.jsx               # React root mount
│   └── dist/                      # Compiled HTML/CSS/JS served to the browser
└── node_modules/                  # Bundled production dependencies (better-sqlite3 x64 native)
```

---

## 4. Follow the Data: 7 Step-by-Step Request Traces

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
   • audioTelemetry.js triggers a clean auditory scan chime.
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
8. Generates receipt with 24-bit cryptographic entropy (RCPT-YYYYMMDD-XXXXXX).
```

---

### Trace 3: Demand Forecasting & Expiry Risk Calculation
How does the system figure out which batches are at risk of spoiling?

```
[Operator opens FEFO+ Risk View or Dashboard]
       │
       ▼
1. GET /api/fefo-plus/analysis is called.
       │
       ▼
2. server/routes/fefoPlus.js retrieves the configured baseline observation window N (10, 20, or 30 days) from settings table.
       │
       ▼
3. Cold-Start Check:
   • Checks total days of recorded transaction history.
   • If history < N days: flags cold_start = true, suppresses automated reorders, falls back to static clinic thresholds.
       │
       ▼
4. Computes Moving Average Daily Demand:
   Daily Demand = Total Units Dispensed in Last N Days / N
       │
       ▼
5. For each active batch in batches table:
   • Days to Expiry (T_expiry) = Expiration Date - Today
   • Days to Depletion (T_consume) = Current Batch Quantity / Daily Demand
   • Expiry Risk Margin (Delta T) = T_expiry - T_consume - Safety Buffer
       │
       ▼
6. If Delta T < 0 (stock will outlast expiration):
   • Marks batch as At-Risk of Expired Waste.
   • Computes predicted expired units: Q_waste = Batch Quantity - (Daily Demand * T_expiry).
       │
       ▼
7. Returns complete JSON payload to FefoPlusView.jsx and DashboardView.jsx for rendering.
```

---

### Trace 4: End-of-Day USB Removable Storage Backup
How does the system create a backup on a physical USB thumb drive?

```
[Operator clicks "Backup & Exit" or opens Settings -> Removable Storage]
       │
       ▼
1. GET /api/backup/drives is called.
       │
       ▼
2. server/routes/backup.js executes a PowerShell CIM disk query:
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
   • POST /api/purchase-orders/:id/receive is executed inside an atomic transaction:
     - Updates purchase_orders status to 'RECEIVED' (or 'PARTIALLY_RECEIVED').
     - Inserts new active batch records into batches table with supplier DR numbers.
     - Logs PURCHASE_ORDER_RECEIVE in audit_logs.
```

---

### Trace 6: Interactive Demo Sandbox Isolation (`x-demo-mode` Header & AsyncLocalStorage)
How does the system ensure zero risk during training or thesis demonstrations?

```
[Operator toggles "Demo Mode" in Settings or Navbar Capsule]
       │
       ▼
1. App.jsx updates localStorage ('rka_demo_mode' = 'true') and fires 'rka_demo_mode_changed'.
       │
       ▼
2. utils/apiInterceptor.js hooks window.fetch, automatically attaching header:
   'x-demo-mode': 'true'
       │
       ▼
3. server/index.js runs demo context middleware:
   dbContext.run({ isDemo: req.headers['x-demo-mode'] === 'true' }, () => next())
       │
       ▼
4. In server/db.js:
   • Proxy object 'db' inspects dbContext.getStore()?.isDemo.
   • Routes all queries to server/data/pharmacy_demo.db instead of live production DB.
       │
       ▼
5. Results return from demo sandbox. The live production database remains 100% untouched.
```

---

### Trace 7: Global Omni-Search Universal Lookup (`/` or `Ctrl+K`)
How does universal keyboard search find information instantly?

```
[Operator presses '/' or 'Ctrl+K' on any view]
       │
       ▼
1. App.jsx intercepts keydown event, opens GlobalSearchModal.jsx and focuses input.
       │
       ▼
2. Operator types query (e.g. 'Amox' or 'LOT-2026').
       │
       ▼
3. GlobalSearchModal filters in-memory catalog, active batches, and system shortcuts:
   • Medicine SKUs matching brand, generic name, barcode, or SKU code.
   • Active batches matching lot number, expiration date, or DR number.
   • Navigation actions (Dispense, Receive Stock, Emergency Help, etc.).
       │
       ▼
4. Operator hits Enter or clicks a candidate:
   • Instantly navigates to the target view and sub-tab.
   • Modal closes cleanly and focuses destination element.
```

---

## 5. The 19 Core Architectural Concepts Explained Simply

---

### Concept 1: Demand Forecasting & FEFO+ Risk Margin Intelligence
Calculates moving average daily consumption over $N \in \{10, 20, 30\}$ operational days:
$$\text{Daily Demand} = \frac{\sum_{i=1}^{N} \text{Units Sold on Day } i}{N}$$
Computes Days to Depletion ($T_{\text{consume}}$), Expiry Risk Margin ($\Delta T$), and predicted waste ($Q_{\text{waste}}$):
$$\Delta T = T_{\text{expiry}} - T_{\text{consume}} - \text{Safety Buffer}$$
When $\Delta T < 0$, stock will outlast its shelf-life. The batch is flagged for prioritized release or promotional clearance.

---

### Concept 2: 5-Tier Expiration Countdown & Confirmation Gate
All active batches are evaluated against 5 clinical countdown tiers:
1. **Safe** (> 180 Days): Green tier; direct release.
2. **Monitor** (91–180 Days): Slate tier; standard monitoring.
3. **Warning** (31–90 Days): Amber tier; release confirmation required.
4. **Critical** (1–30 Days): Rose tier; highest release priority with explicit operator acknowledgment.
5. **Expired** ($\le 0$ Days): Strict red tier; blocked completely from dispensing and quarantined.

---

### Concept 3: Crash-Proof Offline SQLite in WAL Mode
Configured in `server/db.js`:
```javascript
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
```
Write-Ahead Logging writes transactions to a separate `-wal` file before merging, guaranteeing that power interruptions never corrupt the database B-tree.

---

### Concept 4: Scrypt Cryptographic Password Security
Operator passwords are never stored in plaintext. Passwords use Node.js native `crypto.scryptSync` with a 16-byte random cryptographic salt and 64-byte derived key, providing offline brute-force resistance without external dependencies.

---

### Concept 5: The Immutable Audit Trail Ledger
Records all sensitive clinic actions (`STOCK_OUT`, `STOCK_OUT_OVERRIDE`, `PRICE_ADJUSTMENT`, `DISPOSAL`, `UPDATE_SETTINGS`, `BACKUP_EXPORT_USB`, `DATABASE_RESTORE`, `SYSTEM_RESET`) in `audit_logs`. Formatted for 1-click CSV export during FDA/DOH inspections.

---

### Concept 6: Procurement State Machine & Multi-Batch Auto-Allocation
Purchase orders advance through strict transitions: `DRAFT` $\rightarrow$ `PLACED` $\rightarrow$ `RECEIVED` / `CANCELLED`. During dispensing, orders that exceed a single batch's available stock automatically split sequentially across earliest-expiring active batches.

---

### Concept 7: Clean & Simple vs. Maximalist UI Mode Architecture
* **Clean & Simple Mode:** Frictionless 4-tab interface with large touch targets, simplified POS counter, and minimal distractions for rapid counter dispensing.
* **Maximalist Mode:** Full 9-view workstation displaying analytical matrices, simulation graphs, procurement pipelines, and administrative controls.

---

### Concept 8: Offline Tri-Lingual Localization System (`LanguageContext`)
Zero-network dictionary (`translations.js`) providing instant switching between **English (`EN`)**, **Simple Filipino (`FIL`)**, and **Taglish (`TAGLISH`)** across all 9 views, action dialogs, and verification popups.

---

### Concept 9: PO Auto-Drafting Modes & Bulk Reorder Sync
Operators can toggle between *Manual Review Mode* and *Instant Auto Mode* in Settings. The FEFO+ Reorder Planner supports bulk drafting with optional dynamic catalog threshold synchronization.

---

### Concept 10: Cumulative Quick Dispense & Date Jump UI Ergonomics
* Quick dispense pills (`+1, +5, +10, Max`) with mathematical clamping (`Math.min`) to prevent over-dispensing.
* Intake date quick-jump buttons (`+6 Mos, +1 Yr, +2 Yrs, +3 Yrs`) with calendar-safe month-end clamping (`setDate(0)`).

---

### Concept 11: Multi-Tab State Synchronization via Native `BroadcastChannel`
Browser-native `BroadcastChannel` (`rka_inventory_sync`) broadcasts stock mutations, transactions, and alert dismissals instantly across all open workstation tabs without requiring WebSocket servers.

---

### Concept 12: Supplier DR / Sales Invoice Number Tracking Across Procurement & Batches
Tracks delivery receipt / invoice numbers upon arrival and links them directly to active inventory batch records (`batches.supplier_dr_number`).

---

### Concept 13: Dual-Layer Database Disaster Recovery & Pre-Restore Safety Snapshots
Allows safe database rollback via Web UI or administrative CLI (`server/restore.js`). Every restoration automatically generates a pre-restore safety snapshot (`pharmacy_pre_restore_*.db`) before executing the swap.

---

### Concept 14: Cryptographic Collision Entropy in POS Receipt Generation
Generates receipt numbers with 24-bit cryptographic hexadecimal entropy (`RCPT-YYYYMMDD-XXXXXX`), providing 16.7M unique combinations per day to eliminate receipt numbering collisions.

---

### Concept 15: Isolated Demonstration Sandbox Architecture (`pharmacy_demo.db`)
An isolated SQLite database (`server/data/pharmacy_demo.db`) pre-loaded with realistic clinic demo records. When `x-demo-mode: true` is present, queries are routed via `AsyncLocalStorage` to the demo DB, guaranteeing that live clinical records remain 100% untouched.

---

### Concept 16: Route-Level Authentication Gate & Rate-Limited Session Guard (`authMiddleware.js`)
Located at `server/middleware/authMiddleware.js`, this gate protects all mutating operations (`POST`, `PUT`, `DELETE`, `PATCH`). Unauthenticated requests are rejected with `401 Unauthorized`, and repeated failed login attempts trigger progressive rate-limiting.

---

### Concept 17: Web Audio Synthesized Telemetry & Hardware Auditory Feedback
Uses the browser's native Web Audio API (`client/src/utils/audioTelemetry.js`) to synthesize real-time frequency waveforms for hardware scanner feedback:
* `playScanSuccess()`: Ascending clean sine wave (880Hz $\rightarrow$ 1320Hz).
* `playScanError()`: Double square wave error buzz (220Hz).
* `playWarningBeep()`: Triple descending triangle wave alert for critical expiries.

---

### Concept 18: Operational Expiry Horizons & Calendar Matrix Engine
The `DispensaryCalendarModal` maps active batch expiration dates across a monthly operational calendar grid, allowing staff to anticipate expiry horizons, quarantine windows, and scheduled supplier deliveries days in advance.

---

### Concept 19: Factory System Reset with Pre-Wipe Safety Backups
Allows administrators to securely wipe medicines, batches, transactions, and audit logs to begin clean operation on a new workstation. The reset routine (`/api/settings/system-reset`) automatically creates a timestamped safety backup (`pharmacy_pre_reset_*.db`) and preserves operator credentials.

---

## 6. Beginner Developer Playbook: "How Do I Make Changes?"

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
3. Add an `ALTER TABLE` statement wrapped in a `try/catch`:
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
2. Find the header section around line 205.
3. Edit the JSX (e.g., add a badge or change the subtitle text).
4. Save the file.
5. Recompile the frontend bundle (see Recipe 4)!

---

### Recipe 4: Recompiling and Linting the Production Frontend
Whenever you edit anything inside `client/src/`, verify your code with the linter and rebuild the bundle with Vite:

```powershell
# 1. Navigate to the client directory
cd "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline\client"

# 2. Check for syntax and lint issues
npm.cmd run lint

# 3. Compile the production bundle
npm.cmd run build
```
The compiled files are automatically written into `client/dist/`, which the Express server serves immediately. Refresh your browser (`Ctrl + F5` to clear browser cache), and your changes will appear!

---

### Recipe 5: Running the Verification & Self-Check Suite
To verify that the database connection, schema, FEFO sequence sorting, and expiry calculations are intact:

```powershell
cd "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline"
node tests/self_check.js
```

---

## 7. Working with Barcode Scanners (Hardware Guide)

### How Barcode Scanners Actually Work
Standard USB barcode scanners operate as **HID Keyboard Wedge** devices:
1. When you plug the scanner into a USB port, Windows sees it as a **standard USB keyboard**.
2. When the laser scans a barcode (e.g., `8806123456789`), the scanner literally "types" the characters into your computer very quickly (<20 milliseconds for 13 characters).
3. At the end of the barcode, the scanner sends an **`Enter` key (`\r\n`)**.

### How the Code Captures Scans (`StockOutView.jsx`)
1. **Auto-Focus:** An input box is focused on page load using `inputRef.current?.focus()`.
2. **`onKeyDown` Handler:** When the scanner hits `Enter`, the event listener intercepts it, extracts the string, looks up the medicine, and adds the earliest FEFO batch to the cart while triggering `audioTelemetry.js`.
3. **Global Scan Buffer:** If the user clicks elsewhere on the screen, a global window listener tracks keystroke timing. Since humans type at >80ms per key while barcode scanners type at <20ms, the system automatically redirects fast bursts of keystrokes to the barcode handler!

### How to Test Without a Barcode Scanner
1. Open the **Dispense (FEFO)** tab in the app (`F2`).
2. Click into the barcode input field.
3. Type any barcode manually (e.g., `MED-001-AMOXI` or `880123456789`) and press **Enter** on your keyboard.
4. The system behaves exactly as if a physical laser scanned the package!

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
* **Fix:** Always right-click the `.zip` file and select **Extract All...** to a permanent folder first.

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
| **BroadcastChannel** | Native Cross-Tab Sync | Browser-native IPC channel (`rka_inventory_sync`) keeping stock counts identical across open browser tabs without WebSockets. |
| **Supplier DR / SI** | Delivery Receipt / Sales Invoice | Distributor delivery tracking number recorded on purchase orders and attached to active inventory batches for regulatory audit trails. |
| **Safety Snapshot** | Pre-Restore Database Copy | Automatic point-in-time `.db` snapshot created prior to any database restoration or factory reset to guarantee zero data loss. |
| **Receipt Entropy** | Cryptographic Hex Suffix | 24-bit random hexadecimal suffix (`RCPT-YYYYMMDD-XXXXXX`) providing 16.7M unique combinations/day to prevent receipt number collisions. |
| **AsyncLocalStorage** | Node.js Async Context | Node.js asynchronous execution context (`dbContext`) used to scope demo sandbox database routing on a per-request basis. |
| **Audio Telemetry** | Web Audio API Chimes | Client-side synthesized auditory cues for scanner feedback and expiration warnings without external MP3 files. |
| **Omni-Search** | Global Universal Search | Keyboard-driven modal (`/` or `Ctrl+K`) searching across medicines, batches, and system commands in real time. |
| **Factory Reset** | System Wipe Protocol | Clean-wipe routine purging clinical inventory and audit records while preserving operator authentication and generating pre-wipe backups. |

---

*Document Version:* 3.5.0 (Comprehensive Architect & Developer Edition)  
*Last Updated:* September 2026  
*Target System:* R.K.A Pharmacy IMS (San Antonio, Agoo, La Union)
