# Developer Guide: Architecture, Codebase Walkthrough, & Onboarding Manual

### R.K.A Pharmacy Inventory Management System (FEFO+)

**System Title:** Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO  
**Academic Institution:** Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)  
**College / Degree:** College of Computer Science, Bachelor of Science in Computer Science (S.Y. 2026–2027)  
**Client Partner:** R.K.A Pharmacy, San Antonio, Agoo, La Union (Sole Proprietor: Lourdes Gincen L. Cesista)  
**Architecture:** Offline-First, Single-Operator Workstation (React 19 + Node.js Express + Embedded SQLite WAL + AsyncLocalStorage Proxy)

---

## 🌟 Welcome to the R.K.A Pharmacy IMS Codebase!

If you are a junior developer, student researcher, or software engineer opening this repository for the first time, **welcome!**

This manual is engineered specifically to give you complete technical clarity. It explains the design philosophy, data flow, offline database mechanics, dual-database demo isolation, security gates, disaster recovery systems, and practical day-to-day development recipes.

> [!NOTE]
> For non-technical counter dispensary operations, please refer to the in-app interactive **"Help Guide"** (Basic & Advance) accessible by clicking **"Help Guide"** in the sidebar or pressing **`F1`** anywhere in the workstation.

---

## 📋 Table of Contents

1. [The 30-Second Mental Model](#1-the-30-second-mental-model)
2. [Quick-Start: Running the Application Locally](#2-quick-start-running-the-application-locally)
3. [Full Codebase Directory Tour](#3-full-codebase-directory-tour)
4. [Latest System Architecture & Request Traces](#4-latest-system-architecture--request-traces)
   - [Trace 1: Scrypt Authentication, Dynamic HMAC Session Gate & RBAC](#trace-1-scrypt-authentication-dynamic-hmac-session-gate--rbac)
   - [Trace 2: Barcode Scanning, Audio Telemetry & Multi-Batch FEFO Allocation](#trace-2-barcode-scanning-audio-telemetry--multi-batch-fefo-allocation)
   - [Trace 3: FEFO+ Demand Forecasting & Expiry Risk Calculation](#trace-3-fefo-demand-forecasting--expiry-risk-calculation)
   - [Trace 4: Dual-DB Isolation via AsyncLocalStorage & Proxy](#trace-4-dual-db-isolation-via-asynclocalstorage--proxy)
   - [Trace 5: Procurement Lifecycle & Supplier DR Tracking](#trace-5-procurement-lifecycle--supplier-dr-tracking)
   - [Trace 6: Removable USB Backup & WAL Checkpointing](#trace-6-removable-usb-backup--wal-checkpointing)
   - [Trace 7: Disaster Recovery Rollback & Pre-Restore Snapshot](#trace-7-disaster-recovery-rollback--pre-restore-snapshot)
   - [Trace 8: CSV Catalog Bulk Import & Philippine Essential Medicine Presets](#trace-8-csv-catalog-bulk-import--philippine-essential-medicine-presets)
   - [Trace 9: Physical Count Adjustment & Controlled Clinical Disposal](#trace-9-physical-count-adjustment--controlled-clinical-disposal)
   - [Trace 10: Database Storage Compaction & Graceful Workstation Exit](#trace-10-database-storage-compaction--graceful-workstation-exit)
5. [Deep Architectural Concepts](#5-deep-architectural-concepts)
   - [Concept 1: Offline SQLite Architecture in WAL Mode](#concept-1-offline-sqlite-architecture-in-wal-mode)
   - [Concept 2: Dual-Database Demo Sandbox Architecture](#concept-2-dual-database-demo-sandbox-architecture)
   - [Concept 3: Scrypt Cryptographic Key Derivation, Dynamic HMAC Gate & RBAC](#concept-3-scrypt-cryptographic-key-derivation-dynamic-hmac-gate--rbac)
   - [Concept 4: 5-Tier Expiration Countdown & Confirmation Gate](#concept-4-5-tier-expiration-countdown--confirmation-gate)
   - [Concept 5: Mathematical Demand Forecasting & Expiry Risk Margin ($\Delta T$)](#concept-5-mathematical-demand-forecasting--expiry-risk-margin-delta-t)
   - [Concept 6: Procurement State Machine & Dynamic Reorder Points (ROP)](#concept-6-procurement-state-machine--dynamic-reorder-points-rop)
   - [Concept 7: Workstation UI Ergonomics, Domain Navigation & Async Code-Splitting](#concept-7-workstation-ui-ergonomics-domain-navigation--async-code-splitting)
   - [Concept 8: Offline Tri-Lingual Localization System (`LanguageContext`)](#concept-8-offline-tri-lingual-localization-system-languagecontext)
   - [Concept 9: Hardware Barcode Scanners, Capture-Phase Redirection & Audio Synthesizer](#concept-9-hardware-barcode-scanners-capture-phase-redirection--audio-synthesizer)
   - [Concept 10: Multi-Tab Workstation Sync via Native `BroadcastChannel`](#concept-10-multi-tab-workstation-sync-via-native-broadcastchannel)
   - [Concept 11: Collision-Resistant POS Receipt Entropy](#concept-11-collision-resistant-pos-receipt-entropy)
   - [Concept 12: Dual-Layer Disaster Recovery, Integrity Checks & Safety Snapshots](#concept-12-dual-layer-disaster-recovery-integrity-checks--safety-snapshots)
   - [Concept 13: Factory System Reset with Wipe Prevention](#concept-13-factory-system-reset-with-wipe-prevention)
   - [Concept 14: Database Storage Compaction, Freelist Pages & SQLite VACUUM Optimization](#concept-14-database-storage-compaction-freelist-pages--sqlite-vacuum-optimization)
   - [Concept 15: Clean Workstation Shutdown & Process Termination](#concept-15-clean-workstation-shutdown--process-termination)
6. [Developer Playbook: "How Do I Make Changes?"](#6-developer-playbook-how-do-i-make-changes)
   - [Recipe 1: Adding a New Backend REST Endpoint](#recipe-1-adding-a-new-backend-rest-endpoint)
   - [Recipe 2: Modifying Database Schema & Running Migrations](#recipe-2-modifying-database-schema--running-migrations)
   - [Recipe 3: Adding or Modifying a React UI View](#recipe-3-adding-or-modifying-a-react-ui-view)
   - [Recipe 4: Adding New Translation Strings Across All 3 Languages](#recipe-4-adding-new-translation-strings-across-all-3-languages)
   - [Recipe 5: Linting, Building, and Testing the Production Bundle](#recipe-5-linting-building-and-testing-the-production-bundle)
   - [Recipe 6: Using the Administrative CLI Database Restore Tool](#recipe-6-using-the-administrative-cli-database-restore-tool)
7. [Working with Hardware Barcode Scanners](#7-working-with-hardware-barcode-scanners)
8. [Common Developer Pitfalls & Troubleshooting](#8-common-developer-pitfalls--troubleshooting)
9. [Comprehensive Clinical & Technical Glossary](#9-comprehensive-clinical--technical-glossary)

---

## 1. The 30-Second Mental Model

Before inspecting code, understand what the system does in physical reality:

> **R.K.A Pharmacy IMS** is a local workstation application running on a single laptop at the pharmacy counter in San Antonio, Agoo, La Union. During business hours, the pharmacist scans medicine boxes with a handheld USB scanner. The system guarantees that medications expiring soonest are sold first, blocks expired batches from leaving the counter, warns when stock is at risk of expiring before it can be sold, computes optimal reorder timing, and saves point-in-time database snapshots to an external USB flash drive at the end of each day.

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
│   │  USB Barcode Scanner   │                   │  pharmacy_inventory.db   │   │
│   │  (HID Keyboard Wedge)  │                   │  • pharmacy_demo.db        │   │
│   └────────────────────────┘                   │  • WAL Mode (Crash-proof)  │   │
│                                                │  • 100% Offline & Local    │   │
│                                                └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why Offline-First?
1. **Zero Cloud Outage Risk:** Rural and provincial Philippine clinics regularly encounter power fluctuations and internet downtime. Counter sales must never freeze.
2. **Zero SaaS Expenses:** Community pharmacies operate on tight retail margins and cannot sustain monthly cloud database fees ($₱3,000\text{--}₱8,000/\text{mo}$).
3. **Sub-5-Millisecond Latency:** Every database query executes directly in-memory and on local SSD storage without network roundtrips.
4. **Patient & Transaction Privacy:** Sensitive patient sales data never travels over third-party cloud infrastructure.

---

## 2. Quick-Start: Running the Application Locally

You do **not** need to install MySQL, PostgreSQL, or system-wide Node.js. A portable Node.js LTS runtime is bundled inside `runtime/node.exe`.

### 3 Ways to Launch the System
1. **Native C# Launcher:** Double-click `RKA-Pharmacy-IMS.exe`. Starts the background Node.js server silently and opens a dedicated browser window.
2. **Windows Batch Script:** Double-click `start-app.bat`. Starts the Node server in a console window and launches Edge or Chrome at `http://localhost:5000`.
3. **PowerShell Terminal:**
   ```powershell
   cd RKA-Pharmacy-IMS-Client-Offline
   .\runtime\node.exe server/index.js
   ```
   Then open `http://localhost:5000` in your web browser.

### Default Credentials
* **Username:** `admin`
* **Password:** `rka2026`
* **Operator:** Lourdes Gincen L. Cesista

---

## 3. Full Codebase Directory Tour

```text
RKA-PHARMACY/
├── README.md                          # Root open-source/production project overview
├── DEVELOPER_GUIDE.md                 # Complete architectural manual & onboarding guide
└── RKA-Pharmacy-IMS-Client-Offline/   # Standalone workstation client distribution
    ├── DEVELOPER_GUIDE.md             # Client distribution developer manual
    ├── README.md                      # Client distribution overview
    ├── RKA-Pharmacy-IMS.exe           # Native C# launcher (silent server + app mode)
    ├── Setup-Desktop-Shortcut.bat     # 1-Click desktop shortcut installer
    ├── start-app.bat                  # Console batch launcher
    ├── app-icon.ico                   # Workstation desktop icon (.ico)
    ├── app-icon.png                   # High-res application logo (.png)
    ├── runtime/                       # Bundled portable Node.js v24.14.0 LTS binary
    │   └── node.exe
    ├── tests/                         # Automated verification & self-check suite
    │   └── self_check.js              # Comprehensive DB, FEFO, index & i18n validator
    ├── server/                        # Express backend & SQLite database layer
    │   ├── index.js                   # Application server entry point & static file server
    │   ├── db.js                      # SQLite WAL configuration, AsyncLocalStorage Proxy & Scrypt
    │   ├── seed.js                    # Initial clinic medicine catalog & 35-day transaction seed
    │   ├── restore.js                 # Administrative CLI disaster recovery utility
    │   ├── middleware/                # Express security & context middleware
    │   │   └── authMiddleware.js      # Auth gate, HMAC verification & RBAC requireAdminRole
    │   ├── data/                      # Embedded databases & automated backups
    │   │   ├── .session_secret        # Dynamic 256-bit machine-unique HMAC secret (auto-generated)
    │   │   ├── pharmacy_inventory.db  # Live production database (WAL enabled)
    │   │   ├── pharmacy_demo.db       # Isolated demo sandbox database
    │   │   └── backups/               # Automated rolling daily backups & safety snapshots
    │   └── routes/                    # Modular REST API endpoints
    │       ├── auth.js                # Scrypt login, session validation, password change
    │       ├── backup.js              # USB flash drive detection, WAL checkpoint, safe restore API & graceful exit
    │       ├── alerts.js              # Stock & expiry alerts with operator acknowledgment
    │       ├── batches.js             # Batch inventory tracking, pricing, barcode tags & safe disposal
    │       ├── medicines.js           # Medicine catalog, price management & CSV bulk import
    │       ├── purchaseOrders.js      # Purchase orders lifecycle, slip vouchers & delivery receiving
    │       ├── transactions.js        # Stock-out POS, FEFO enforcement, multi-batch split & stock adjustment
    │       ├── fefoPlus.js            # Moving average daily demand, Days to Depletion & ERM
    │       ├── audit.js               # Immutable audit trail ledger & CSV export
    │       ├── simulation.js          # FIFO vs FEFO vs FEFO+ policy simulation engine
    │       ├── settings.js            # Baseline window (N), tier thresholds, database compaction & system reset
    │       └── evaluations.js         # System Usability Scale (SUS) survey engine
    ├── client/                        # Frontend source code & build artifacts
    │   ├── src/                       # React 19 + Tailwind CSS source code
    │   │   ├── assets/                # Visual branding & logos
    │   │   ├── components/            # Modals (Add/Edit, Barcode, BulkImport, Disposal, Adjustment, Exit), Navbar, Thermal Receipt
    │   │   ├── context/               # LanguageContext (offline tri-lingual switcher)
    │   │   ├── data/                  # In-app datasets (helpGuideData.js, philippineMedicinePresets.js - 68 FDA/DOH standards)
    │   │   ├── i18n/                  # Offline translation dictionary (EN, FIL, TAGLISH)
    │   │   ├── utils/                 # api, apiInterceptor, audioTelemetry, syncChannel
    │   │   ├── views/                 # Async lazy-loaded views (Dashboard, POS, Inventory, etc.)
    │   │   ├── App.jsx                # Workstation shell, Suspense fallback & session orchestrator
    │   │   ├── index.css              # Global Tailwind directives & custom utilities
    │   │   └── main.jsx               # React DOM entry point
    │   └── dist/                      # Precompiled production bundle served by Express
    └── node_modules/                  # Bundled dependencies (better-sqlite3 x64 native)
```

---

## 4. Latest System Architecture & Request Traces

To master the codebase, trace how data flows through the application during key operations:

### Trace 1: Scrypt Authentication, Dynamic HMAC Session Gate & RBAC
```
[User types credentials: admin / rka2026]
       │
       ▼
1. LoginModal.jsx sends POST /api/auth/login with { username, password }.
       │
       ▼
2. server/routes/auth.js looks up user in 'users' table.
       │
       ▼
3. verifyPassword() in server/db.js splits stored hash ("salt:derivedKey")
   and executes crypto.scryptSync(password, salt, 64) with timing-safe comparison.
       │
       ▼
4. authMiddleware.createSessionToken(user) produces an HMAC-signed token using the
   dynamically generated 256-bit machine-unique secret stored in server/data/.session_secret:
   rka_session_<base64UrlPayload>_<sha256HmacSignature>
       │
       ▼
5. Default Credential Rotation Advisory:
   • If password_changed === 0 (or still default 'rka2026'), payload sets require_password_change: true.
   • Frontend displays a persistent rotation banner in Navbar and Login modal directing staff to Settings.
       │
       ▼
6. Server writes USER_LOGIN event to audit_logs and returns { user, token, require_password_change }.
       │
       ▼
7. Frontend stores token in sessionStorage. All future mutating requests (POST, PUT, DELETE)
   automatically include header: Authorization: Bearer rka_session_...
       │
       ▼
8. Middleware verification:
   • authMiddleware.verifySessionToken validates signature (timingSafeEqual) and expiry.
   • High-impact routes (system-reset, settings updates, database restore) invoke requireAdminRole
     to guarantee only authorized administrators can perform destructive system actions (non-admins get 403).
```

---

### Trace 2: Barcode Scanning, Audio Telemetry & Multi-Batch FEFO Allocation
```
[Pharmacist scans Amoxicillin 500mg box at counter]
       │
       ▼
1. Scanner injects characters 'MED-001-AMOXI' + Enter (<20ms keystroke burst).
       │
       ▼
2. StockOutView.jsx captures scan:
   • Window Capture-Phase Interception: If focus was accidentally placed in Notes or Ref inputs,
     burst detection (<65ms inter-character timing) redirects text into the scanner buffer without leakage.
   • audioTelemetry.playScanSuccess() synthesizes a clean 880Hz -> 1320Hz chime.
       │
       ▼
3. Frontend queries active batches for medicine, ordered by expiration_date ASC.
       │
       ▼
4. Multi-Batch Auto-Allocation Algorithm & Safety Gates:
   • Rapid Scan Critical-Tier Safety Gate: If the allocated batch has <= 30 days remaining (Critical tier),
     instant cart addition is paused and BatchStatusConfirmModal is displayed with warning audio
     to force explicit operator confirmation before releasing near-expiry medication to patients.
   • If item quantity <= earliest batch current_quantity: fully allocated to earliest batch.
   • If item quantity > earliest batch current_quantity:
     Splits quantity across sequential batches in strict FEFO order.
   • If any allocated batch is in Warning (31-90d) or Critical (1-30d):
     BatchStatusConfirmModal opens for operator confirmation.
   • If any batch is Expired (<= 0d):
     Allocation is HARD-BLOCKED. An error banner displays: "Expired batch cannot be released!"
   • If operator manually overrides batch selection:
     OverrideModal requires a mandatory justification note before proceeding.
       │
       ▼
5. Counter sale submitted to POST /api/transactions/stock-out with signed session token.
       │
       ▼
6. server/routes/transactions.js opens an atomic SQLite Transaction:
   • Deducts quantity from each allocated batch (marks status = 'consumed' if quantity reaches 0).
   • Inserts record into transactions table with locked counter selling price.
   • Inserts STOCK_OUT or STOCK_OUT_OVERRIDE record into audit_logs.
   • Generates collision-resistant receipt number: RCPT-YYYYMMDD-XXXXXX (24-bit hex entropy).
       │
       ▼
7. StockOutView opens PrintableReceiptModal (modular thermal receipt component) for receipt generation.
```

---

### Trace 3: FEFO+ Demand Forecasting & Expiry Risk Calculation
```
[Operator opens FEFO+ Risk View or Dashboard]
       │
       ▼
1. GET /api/fefo-plus/analysis is requested.
       │
       ▼
2. server/routes/fefoPlus.js retrieves rolling observation baseline window N
   (10, 20, or 30 days) from settings table.
       │
       ▼
3. Cold-Start Verification:
   • Counts total days of recorded transaction history.
   • If history < N: flags cold_start = true, displays informational banner,
     and suppresses automated reorders in favor of static catalog thresholds.
       │
       ▼
4. Moving Average Daily Demand Calculation:
   Daily Demand = Total Units Dispensed in Last N Days / N
       │
       ▼
5. For each active inventory batch:
   • Days to Expiry (T_expiry) = Expiration Date - Current Date
   • Days to Depletion (T_consume) = Current Batch Quantity / Daily Demand
   • Expiry Risk Margin (Delta T) = T_expiry - T_consume - Safety Buffer
       │
       ▼
6. If Delta T < 0:
   • Batch flagged as At-Risk of Expiry Spoilage.
   • Predicted Expired Waste: Q_waste = Batch Quantity - (Daily Demand * T_expiry).
```

---

### Trace 4: Dual-DB Isolation via AsyncLocalStorage & Proxy
```
[User clicks "Demo Mode" toggle in Navbar Capsule or Settings]
       │
       ▼
1. App.jsx saves 'rka_demo_mode' = 'true' in localStorage and broadcasts change.
       │
       ▼
2. utils/apiInterceptor.js intercepts all outgoing window.fetch requests:
   Headers added: { 'x-demo-mode': 'true' }
       │
       ▼
3. server/index.js executes demo context middleware:
   dbContext.run({ isDemo: req.headers['x-demo-mode'] === 'true' }, () => next())
       │
       ▼
4. In server/db.js:
   • The exported 'db' object is an ES6 Proxy.
   • When any route executes db.prepare(...), proxy calls getActiveDb().
   • getActiveDb() inspects dbContext.getStore()?.isDemo.
   • If true: returns demoDb (pharmacy_demo.db).
   • If false: returns prodDb (pharmacy_inventory.db).
       │
       ▼
5. Result: Live production data remains 100% physically isolated and pristine!
```

---

### Trace 5: Procurement Lifecycle & Supplier DR Tracking
```
[Operator converts FEFO+ Suggested Reorder to Purchase Order]
       │
       ▼
1. In FEFO+ View, operator clicks "Bulk Draft Purchase Orders".
       │
       ▼
2. POST /api/purchase-orders/draft creates PO record (status = 'draft', PO-YYYYMMDD-XXXX).
       │
       ▼
3. In PurchaseOrdersView.jsx:
   • Operator adjusts line items and clicks "Place Order" (status = 'placed').
   • Operator clicks "Print PO Slip" to generate an official procurement voucher slip.
       │
       ▼
4. Delivery Receiving:
   • Supplier delivers order to clinic counter. Operator clicks "Receive Delivery".
   • Operator enters Supplier DR / Sales Invoice Number, delivered quantities, and batch expiry.
   • POST /api/purchase-orders/:id/receive runs atomic transaction:
     - Updates purchase_orders status to 'received'.
     - Inserts new active inventory batches with supplier_dr_number populated.
     - Logs PURCHASE_ORDER_RECEIVE in audit_logs.
```

---

### Trace 6: Removable USB Backup & WAL Checkpointing
```
[Operator clicks "Backup & Exit" or opens Settings -> Removable Storage]
       │
       ▼
1. GET /api/backup/drives executes PowerShell CIM command:
   Get-CimInstance Win32_LogicalDisk (DriveType == 2)
   Returns connected USB flash drives (e.g., E:\, F:\).
       │
       ▼
2. Operator selects drive "E:\" and clicks "Export to Drive".
       │
       ▼
3. POST /api/backup/export-removable:
   • Runs PRAGMA integrity_check to verify database health before writing archive.
   • Issues SQLite WAL checkpoint: db.pragma('wal_checkpoint(TRUNCATE)')
     (Flushes uncommitted WAL pages into the main .db file).
   • Creates target directory: E:\RKA_PHARMACY_BACKUPS\
   • Copies snapshot to E:\RKA_PHARMACY_BACKUPS\pharmacy_backup_YYYY-MM-DD.db
   • Records DATABASE_BACKUP_REMOVABLE event in audit_logs.
```

---

### Trace 7: Disaster Recovery Rollback & Pre-Restore Snapshot
```
[Operator needs to restore database from a previous backup file]
       │
       ▼
1. User provides backup file via Web UI (Settings -> Restore) or CLI (node server/restore.js).
       │
       ▼
2. safelyRestoreDatabase() in server/db.js executes 5-step safety protocol:
   • Step 1: Opens candidate file read-only, runs PRAGMA integrity_check,
     and validates existence of core tables (medicines, batches, transactions, settings).
   • Step 2: Creates automated pre-restore safety snapshot of the active database:
     server/data/backups/pharmacy_pre_restore_<timestamp>_<date>.db
   • Step 3: Restores candidate into active database using SQLite native backup API.
   • Step 4: Executes PRAGMA wal_checkpoint(TRUNCATE) and PRAGMA optimize.
   • Step 5: Updates expired batch statuses and logs DATABASE_RESTORE to audit_logs.
```

---

### Trace 8: CSV Catalog Bulk Import & Philippine Essential Medicine Presets
```
[Pharmacist opens Inventory View and clicks "Bulk Import"]
       │
       ▼
1. BulkImportModal.jsx displays:
   • CSV upload drop-zone & copy-paste area.
   • Downloadable template ("rka_pharmacy_catalog_template.csv").
   • 1-Click "Load Philippine Presets" button (68 FDA/DOH standards from philippineMedicinePresets.js).
       │
       ▼
2. Client parses CSV or preset array into typed medicine objects.
   Validates mandatory fields (brand_name, generic_name), EAN-13 barcodes, and default thresholds.
       │
       ▼
3. POST /api/medicines/bulk-import:
   • Checks existing database records for duplicate barcodes or matching brand + generic + strength tuples.
   • Increments catalog codes (MED-001, MED-002, ...) deterministically.
   • Inserts new medicines in a single atomic transaction.
   • Logs BULK_IMPORT event to audit_logs with inserted item counts and operator name.
       │
       ▼
4. Success banner displays count of newly added medicines; inventory catalog refreshes instantly.
```

---

### Trace 9: Physical Count Adjustment & Controlled Clinical Disposal
```
[Pharmacist audits shelf or prepares damaged/expired batch for disposal]
       │
       ▼
Physical Count Adjustment:
1. Pharmacist opens StockAdjustmentModal.jsx on a batch.
2. Enters actual shelf quantity and mandatory adjustment reason (Count Discrepancy, Damaged, Theft, Expired).
3. POST /api/transactions/adjustment:
   • Recalculates current_quantity.
   • If zero, updates status to 'consumed'.
   • Creates transaction row (type = 'adjustment') with delta quantity.
   • Writes AUDIT_LOG entry with before/after counts and operator identity.
       │
       ▼
Controlled Clinical Disposal:
1. Pharmacist opens DisposalModal.jsx on an expired or quarantined batch.
2. Confirms disposal quantity and reason (Expired Spoilage, Broken Seal, Temperature Deviation).
3. POST /api/batches/:id/dispose:
   • Deducts disposal quantity; marks status = 'disposed' if remaining is 0.
   • Records transaction row (type = 'disposal') linking batch ID and inventory loss value.
   • Logs DISPOSAL event to audit_logs for regulatory compliance inspection.
```

---

### Trace 10: Database Storage Compaction & Graceful Workstation Exit
```
[Pharmacist closes counter or runs maintenance from Settings]
       │
       ▼
Storage Compaction:
1. SettingsView.jsx requests GET /api/settings/db-stats (retrieves page_count, freelist_count, total_bytes).
2. Pharmacist clicks "Compact & Optimize Database" -> POST /api/settings/optimize:
   • Runs PRAGMA wal_checkpoint(TRUNCATE) to fold write frames into main .db.
   • Executes VACUUM to reclaim freelist pages and physically defragment B-tree nodes.
   • Issues PRAGMA optimize to refresh query planner statistics.
   • Returns reclaimed KB count and shrinks file size.
       │
       ▼
Graceful Workstation Exit:
1. Pharmacist clicks "Exit" in Navbar -> ExitConfirmModal.jsx opens.
2. Options: Clean shutdown or Immediate backup before closing.
3. POST /api/backup/exit:
   • Issues PRAGMA wal_checkpoint(TRUNCATE).
   • Writes WORKSTATION_EXIT event to audit_logs.
   • Closes database connections cleanly.
   • Terminates background Node.js server process (process.exit(0)) within 300ms.
```

---

## 5. Deep Architectural Concepts

---

### Concept 1: Offline SQLite Architecture in WAL Mode
The database layer uses `better-sqlite3`, a high-performance, synchronous C++ binding for Node.js. 

```javascript
// server/db.js
const prodDb = new Database(prodDbPath);
prodDb.pragma('foreign_keys = ON');
prodDb.pragma('journal_mode = WAL');
```

#### Why Write-Ahead Logging (WAL)?
1. **Concurrent Non-Blocking Operations:** In standard rollback journal mode, writing locks the entire database, preventing concurrent reads. In WAL mode, writes append to a separate `-wal` file while readers query the main database without contention.
2. **Crash Resilience:** Sudden power loss or laptop battery disconnection does not corrupt the database. Uncommitted WAL pages are safely discarded or replayed upon restart.
3. **Query Optimization:** Periodic checkpoints (`PRAGMA wal_checkpoint(TRUNCATE)`) merge WAL frames back into the main database file during backups and shutdowns.

#### B-Tree Indexing Strategy
To maintain sub-5ms lookups as transactions grow, critical foreign keys and filter columns are indexed:
* `idx_batches_med_status`: Fast retrieval of active batches for a given medicine.
* `idx_batches_expiry`: Instant ascending sorting for FEFO allocation.
* `idx_medicines_barcode` & `idx_medicines_code`: Instant barcode scanner lookups.
* `idx_batches_med_id` & `idx_po_items_med_id`: Optimized join indexes for inventory valuations.
* `idx_batches_dr`: Rapid traceability across supplier delivery receipt numbers.

---

### Concept 2: Dual-Database Demo Sandbox Architecture
The application supports an isolated demonstration mode allowing interns, new staff, or thesis evaluators to perform mock sales, stock-ins, and resets without risking actual clinic inventory.

```javascript
// server/db.js
const { AsyncLocalStorage } = require('async_hooks');
const dbContext = new AsyncLocalStorage();

// Transparent dynamic database proxy routing
const db = new Proxy({}, {
  get(target, prop) {
    const active = getActiveDb();
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  }
});
```

#### How It Operates:
1. `AsyncLocalStorage` maintains an execution context store across the asynchronous lifespan of each HTTP request.
2. `server/index.js` inspects incoming `x-demo-mode` headers:
   ```javascript
   app.use((req, res, next) => {
     const isDemo = req.headers['x-demo-mode'] === 'true';
     dbContext.run({ isDemo }, () => next());
   });
   ```
3. Whenever any controller or helper invokes `db.prepare(...)`, the ES6 `Proxy` transparently checks `dbContext.getStore()?.isDemo`. If demo mode is active, queries execute against `server/data/pharmacy_demo.db`. Otherwise, they execute against `server/data/pharmacy_inventory.db`.
4. **1-Click Sandbox Reset (`/api/settings/demo-reset`):** Deletes `pharmacy_demo.db` and its WAL files, then re-seeds pristine demo records from `server/seed.js`.

---

### Concept 3: Scrypt Cryptographic Key Derivation, Dynamic HMAC Gate & RBAC

#### Password Storage
Passwords use Node.js native `crypto.scryptSync`:
```javascript
// server/db.js
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
```
* `scrypt` is deliberately memory-hard and CPU-intensive, preventing offline rainbow table and GPU dictionary attacks.

#### Dynamic Machine-Unique HMAC Session Secret
Located in `server/middleware/authMiddleware.js`:
* On server boot, the system loads or initializes a dynamic 256-bit machine-unique secret persisted at `server/data/.session_secret` (with restricted `0o600` file permissions).
* If missing, `crypto.randomBytes(32)` generates a fresh 64-character hexadecimal key. This guarantees that independent clinic workstation deployments never share a static hardcoded signature key.

#### Route-Level Authentication Gate
* Mutating methods (`POST`, `PUT`, `DELETE`, `PATCH`) require an authenticated session token.
* Tokens are formatted as `rka_session_<base64UrlPayload>_<sha256HmacSignature>`.
* Incoming requests are validated against both an in-memory active session cache and cryptographic HMAC signatures using `crypto.timingSafeEqual` to prevent timing attacks.

#### Role-Based Access Control (RBAC)
* High-impact administrative endpoints (`POST /api/settings/system-reset`, `PUT /api/settings`, and `POST /api/backup/restore`) are guarded by `requireAdminRole`.
* If the decoded token role is not `'admin'`, the request is immediately rejected with HTTP 403 Forbidden:
  ```javascript
  function requireAdminRole(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required for this operation' });
    }
    next();
  }
  ```

#### Default Credential Rotation Advisory
* The login API inspects whether the account has `password_changed === 0` or is still using default credentials (`rka2026`).
* When flagged, `require_password_change: true` is returned, rendering an unmissable security reminder banner in the workstation navigation bar and login dialog prompting counter staff to set a unique credential in Settings.

---

### Concept 4: 5-Tier Expiration Countdown & Confirmation Gate

All active batches are evaluated against 5 clinical countdown tiers:

| Tier | Days Remaining ($\text{DTE}$) | Color Indicator | Dispensing Behavior |
| :--- | :--- | :--- | :--- |
| **Safe** | $> 180\text{ days}$ | 🟢 Emerald Green | Direct, frictionless release |
| **Monitor** | $91\text{--}180\text{ days}$ | 🔘 Slate Gray | Standard counter dispensing |
| **Warning** | $31\text{--}90\text{ days}$ | 🟡 Amber Yellow | Requires operator confirmation modal |
| **Critical** | $1\text{--}30\text{ days}$ | 🔴 Rose Red | High-priority release alert; requires explicit confirmation |
| **Expired** | $\le 0\text{ days}$ | 🛑 Dark Red | **Strictly blocked.** Hard stop banner; quarantined |

* **Rapid Scan Safety Gate:** In high-speed barcode scanning mode, batches in Safe and Monitor tiers add instantly to the cart. However, if the allocated FEFO batch is in the **Critical ($1\text{--}30\text{ days}$)** or **Warning ($31\text{--}90\text{ days}$)** tier, silent addition is intercepted: `BatchStatusConfirmModal` appears with audio telemetry, forcing the pharmacist to visually inspect the box and acknowledge near-expiry release before proceeding.
* Batches reaching $\le 0\text{ days}$ are automatically updated to `status = 'expired'` during system startup and daily maintenance routines.

---

### Concept 5: Mathematical Demand Forecasting & Expiry Risk Margin ($\Delta T$)

#### Average Daily Demand
Calculates moving average consumption over a configurable baseline window $N \in \{10, 20, 30\}$ operational days:
$$\text{Daily Demand} = \frac{\sum_{i=1}^{N} \text{Units Sold on Day } i}{N}$$

#### Days to Depletion ($T_{\text{consume}}$)
$$\text{Days to Depletion} = \frac{\text{Current Active Quantity}}{\text{Daily Demand}}$$

#### Expiry Risk Margin ($\Delta T$)
$$\Delta T = T_{\text{expiry}} - T_{\text{consume}} - \text{Safety Buffer}$$
* **$\Delta T \ge 0$ (Surplus Margin):** Stock will deplete safely before expiration.
* **$\Delta T < 0$ (Deficit Margin / At-Risk):** Stock consumption is too slow; batch is predicted to expire before depletion.

#### Predicted Expired Waste ($Q_{\text{waste}}$)
When $\Delta T < 0$:
$$Q_{\text{waste}} = \text{Current Batch Quantity} - (\text{Daily Demand} \times T_{\text{expiry}})$$

---

### Concept 6: Procurement State Machine & Dynamic Reorder Points (ROP)

#### Purchase Order State Machine
```
[DRAFT] ───(Place Order)───> [PLACED] ───(Receive Delivery)───> [RECEIVED]
   │                            │
   └───(Cancel)───> [CANCELLED] <───(Cancel)
```

#### Dynamic Reorder Point Formula
$$\text{ROP} = (\text{Daily Demand} \times \text{Supplier Lead Time}) + \text{Safety Buffer}$$
* **Manual Review Mode:** Low-stock items appear in the Suggested Reorder Planner for operator adjustment before drafting.
* **Instant Auto Mode:** System automatically generates draft POs upon reaching the ROP threshold.

---

### Concept 7: Workstation UI Ergonomics, Domain Navigation & Async Code-Splitting

#### Three Functional Navigation Domains
The navigation bar (`client/src/components/Navbar.jsx`) groups application views into 3 logical operational domains to prevent cognitive overload:
1. **Dispensary Counter (Counter Operations):** Essential fast-paced tools (*Dashboard, Dispense / POS, Stock In, Inventory*).
2. **Management & Governance (Administrative & Compliance):** Operations and regulatory tools (*Purchase Orders, FEFO+ Risk Analysis, Audit Trail, Settings*).
3. **Academic Research (Evaluation & Modeling):** Research tools (*FIFO vs FEFO Policy Simulation, SUS Usability Survey*).

#### Dual UI Modes (Clean & Simple vs. Maximalist)
* **Clean & Simple Mode:** Limits navigation to the 4 primary dispensary tabs with enlarged hit targets, simplified table columns, and zero administrative clutter for peak counter hours.
* **Maximalist Mode:** Exposes all 9 views across all 3 domains for deep clinical audits and administrative governance.

#### Asynchronous Code-Splitting (`React.lazy` & `<Suspense>`)
To maintain instant cold-start loading on counter laptops, `App.jsx` dynamically code-splits large views using native `React.lazy()`:
```javascript
const SimulationView = React.lazy(() => import('./views/SimulationView'));
const EvaluationsView = React.lazy(() => import('./views/EvaluationsView'));
const FefoRiskView = React.lazy(() => import('./views/FefoRiskView'));
```
* **Performance Impact:** The initial client production bundle shrank from **1,195 KB** to **742 KB** (~38% reduction). Non-dispensary views load on-demand in lightweight asynchronous chunks wrapped in a seamless clinical loading fallback.

#### Extracted Thermal Receipt Dialog
Thermal receipt generation logic is modularized into `client/src/components/PrintableReceiptModal.jsx`. It contains CSS `@media print` styling specifically calibrated for 80mm/58mm thermal printers with automatic focus trapping on the "Print" action.

---

### Concept 8: Offline Tri-Lingual Localization System (`LanguageContext`)
* 100% offline client-side dictionary located in `client/src/i18n/locales/`:
  * `en.json` (English)
  * `fil.json` (Simple Filipino)
  * `taglish.json` (Colloquial Taglish)
* Verified by `tests/self_check.js` to ensure 100% key symmetry (1,313 keys per language, 0 missing translations) across all 9 views, action dialogs, and verification popups.

---

### Concept 9: Hardware Barcode Scanners, Capture-Phase Redirection & Audio Synthesizer
* Standard USB barcode scanners act as **HID Keyboard Wedges**, transmitting characters with rapid inter-keystroke intervals followed by `Enter`.
* **Global Window Capture-Phase Interception:**
  In high-throughput dispensary environments, the counter pharmacist might accidentally leave focus in the "Customer Notes" or "Reference #" field while scanning. `StockOutView.jsx` mounts a window capture-phase listener (`useCapture: true`):
  ```javascript
  // Intercepts scanner bursts (<65ms between characters) before focused inputs consume them
  if (isFocusedOnTextInput && delta < 65) {
    e.preventDefault();
    scannerBufferRef.current += e.key;
  }
  ```
  This prevents scanner text from polluting customer notes and automatically routes the scan to the FEFO dispensing engine.
* `client/src/utils/audioTelemetry.js` synthesizes audio waveforms using the browser's native Web Audio API:
  * **Success Scan:** Dual-tone ascending sine wave ($880\text{Hz} \rightarrow 1320\text{Hz}$).
  * **Error / Mismatch:** Double square wave buzz ($220\text{Hz}$).
  * **Critical Alert:** Triple descending triangle wave alert ($660\text{Hz} \rightarrow 440\text{Hz}$).

---

### Concept 10: Multi-Tab Workstation Sync via Native `BroadcastChannel`
* Built on the browser-native `BroadcastChannel` API (`client/src/utils/syncChannel.js`).
* Channel: `rka_inventory_sync`.
* Whenever a stock-in, dispensing sale, or alert acknowledgment occurs in Tab A, an event is broadcast to Tab B and Tab C, triggering background state re-fetches without WebSockets.

---

### Concept 11: Collision-Resistant POS Receipt Entropy
POS receipt codes use 24-bit cryptographic hexadecimal entropy:
$$\text{Receipt Code} = \text{RCPT-YYYYMMDD-XXXXXX}$$
Where `XXXXXX` is generated via `crypto.randomBytes(3).toString('hex').toUpperCase()`. This yields $16,777,216$ unique receipts per day, completely eliminating receipt number collisions during rapid sales.

---

### Concept 12: Dual-Layer Disaster Recovery, Integrity Checks & Safety Snapshots
Disaster recovery guarantees zero data loss through automated safety snapshots and integrity verification:
1. **Automated Pre-Backup `PRAGMA integrity_check`:** Before any daily backup, pre-restore snapshot, or USB flash drive export is written, `server/db.js` executes `PRAGMA integrity_check`. If any page corruption or index desynchronization is detected, the process halts immediately to prevent backing up compromised data.
2. **Pre-Restore Snapshot:** Before any backup is restored, `safelyRestoreDatabase()` automatically exports the active database to `server/data/backups/pharmacy_pre_restore_<timestamp>_<date>.db`.
3. **Pre-Reset Snapshot:** Before any factory wipe is executed, `performSystemReset()` creates `server/data/backups/pharmacy_pre_reset_<timestamp>.db`.
4. **Candidate Validation:** Candidate backups must pass `PRAGMA integrity_check` and contain all core tables before the restoration is committed.

---

### Concept 13: Factory System Reset with Wipe Prevention
The factory reset routine (`/api/settings/system-reset`) allows clinical staff to clear test data before deploying to a live pharmacy:
1. Wipes `transactions`, `batches`, `medicines`, `purchase_orders`, and `audit_logs`.
2. Resets `sqlite_sequence` table counters.
3. Sets `system_wiped = 'true'` in the `settings` table.
4. On subsequent server boots, `server/seed.js` detects the `system_wiped` flag and **suppresses auto-seeding**, maintaining a clean zero-inventory state.
5. Preserves operator login credentials in the `users` table.

---

### Concept 14: Database Storage Compaction, Freelist Pages & SQLite VACUUM Optimization
Over time, frequent stock deductions, batch status updates, and audit logging create fragmented SQLite pages. SQLite marks deleted pages as `freelist` slots rather than immediately shrinking the `.db` file on disk.

1. **Storage Metrics API (`GET /api/settings/db-stats`):**
   Inspects low-level database page allocations:
   ```javascript
   const pageCount = Number(db.pragma('page_count', { simple: true }));
   const pageSize = Number(db.pragma('page_size', { simple: true }));
   const freelistCount = Number(db.pragma('freelist_count', { simple: true }));
   ```
2. **Three-Phase Compaction Protocol (`POST /api/settings/optimize`):**
   * **Phase 1: WAL Frame Flush:** `db.pragma('wal_checkpoint(TRUNCATE)')` merges outstanding write frames back into the main database file.
   * **Phase 2: B-Tree Defragmentation:** `db.exec('VACUUM')` rebuilds the database file from scratch, permanently eliminating freelist pages and shrinking disk usage.
   * **Phase 3: Query Planner Statistics Refresh:** `db.pragma('optimize')` analyzes index usage distribution, ensuring sub-5ms query performance on future lookups.

---

### Concept 15: Clean Workstation Shutdown & Process Termination
Counter laptops are frequently powered down at closing time. Simply killing the browser tab leaves the background Node.js server running in the background.

1. **Exit Dialog (`client/src/components/ExitConfirmModal.jsx`):**
   Prompted when the pharmacist clicks "Exit" in the navigation bar.
2. **Clean Shutdown Pipeline (`POST /api/backup/exit`):**
   * Forces SQLite `PRAGMA wal_checkpoint(TRUNCATE)` to ensure zero uncommitted pages remain in `-wal`.
   * Records a timestamped `WORKSTATION_EXIT` entry in `audit_logs`.
   * Sends an HTTP 200 response confirming termination.
   * Gracefully invokes `db.close()` and triggers `process.exit(0)` after a 300ms delay.

---

## 6. Developer Playbook: "How Do I Make Changes?"

---

### Recipe 1: Adding a New Backend REST Endpoint
Suppose you want to add an endpoint returning total batch counts by status:

1. Open `server/routes/batches.js`.
2. Add your route handler:
   ```javascript
   // GET /api/batches/status-summary
   router.get('/status-summary', (req, res) => {
     try {
       const rows = db.prepare(`
         SELECT status, COUNT(*) AS count, SUM(current_quantity) AS total_units 
         FROM batches 
         GROUP BY status
       `).all();
       res.json({ summary: rows });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });
   ```
3. Test your endpoint:
   ```powershell
   Invoke-RestMethod http://localhost:5000/api/batches/status-summary
   ```

---

### Recipe 2: Modifying Database Schema & Running Migrations
Suppose you want to add a `packaging_type` column to the `medicines` table:

1. Open `server/db.js`.
2. In the `initSchema(targetDb)` function, add your schema migration block:
   ```javascript
   try {
     targetDb.exec(`ALTER TABLE medicines ADD COLUMN packaging_type TEXT DEFAULT 'Box';`);
   } catch (e) {
     // Column already exists in database
   }
   ```
3. Restart the server. SQLite will non-destructively add the column to both production and demo databases on startup!

---

### Recipe 3: Adding or Modifying a React UI View
Suppose you want to edit `DashboardView.jsx`:

1. Open `client/src/views/DashboardView.jsx`.
2. Make your JSX and Tailwind CSS adjustments.
3. Recompile the production frontend bundle (see Recipe 5).
4. Refresh your browser with **`Ctrl + F5`** (bypasses browser caching).

---

### Recipe 4: Adding New Translation Strings Across All 3 Languages
When adding a new UI label, add the key to all 3 JSON locale files to maintain symmetry:

1. Open `client/src/i18n/locales/en.json`:
   ```json
   "lbl_packaging_type": "Packaging Type"
   ```
2. Open `client/src/i18n/locales/fil.json`:
   ```json
   "lbl_packaging_type": "Uri ng Pakete"
   ```
3. Open `client/src/i18n/locales/taglish.json`:
   ```json
   "lbl_packaging_type": "Packaging Type"
   ```
4. In your React component:
   ```jsx
   const { t } = useLanguage();
   return <label>{t('lbl_packaging_type')}</label>;
   ```
5. Run `node tests/self_check.js` to verify 100% dictionary symmetry!

---

### Recipe 5: Linting, Building, and Testing the Production Bundle
Whenever you make frontend changes, build the production bundle:

```powershell
# 1. Navigate to the client folder
cd "c:\Users\emman\OneDrive\Desktop\RKA PHARMACY\RKA-Pharmacy-IMS-Client-Offline\client"

# 2. Check for syntax and React linter errors
npm.cmd run lint

# 3. Compile the production bundle with Vite
npm.cmd run build

# 4. Run the comprehensive 18-step database and logic integrity test
cd ..
node tests/self_check.js
```

---

### Recipe 6: Using the Administrative CLI Database Restore Tool
To recover a database without opening the browser:

```powershell
cd RKA-Pharmacy-IMS-Client-Offline
node server/restore.js
```
The interactive terminal utility will list all available daily backups and pre-restore safety snapshots. Select the number, type `RESTORE` to confirm, and the database will be safely restored with pre-restore safety guarantees.

To restore a specific backup file directly:
```powershell
node server/restore.js "server/data/backups/pharmacy_backup_2026-09-24.db"
```

---

## 7. Working with Hardware Barcode Scanners

### How Barcode Scanners Work
USB barcode scanners operate as **HID Keyboard Wedge** hardware:
1. When a barcode is scanned, the device emulates a rapid keyboard typing sequence ($<20\text{ms}$ total duration).
2. The scanner terminates the sequence by sending an **`Enter` key (`\r\n`)**.
3. `StockOutView.jsx` captures the `Enter` keypress on the barcode input and executes batch lookup.

### Testing Without Physical Hardware
You can simulate a barcode scanner during development:
1. Navigate to the **Dispense / POS** tab (`F2`).
2. Click into the barcode search field.
3. Type any sample barcode (e.g. `MED-001-AMOXI` or `880123456789`) and hit **`Enter`**.
4. The system executes the exact same multi-batch FEFO allocation and audio telemetry as a laser scanner.

---

## 8. Common Developer Pitfalls & Troubleshooting

### Pitfall 1: "I edited a React component, but changes don't appear in the browser!"
* **Cause:** Express serves static assets from `client/dist/`, NOT from `client/src/`.
* **Fix:** Run `npm.cmd run build` inside `client/` and refresh the browser with `Ctrl + F5`.

### Pitfall 2: "Port 5000 is already in use (`EADDRINUSE`)!"
* **Cause:** A previous instance of the Node server is still running in the background.
* **Fix:** Open PowerShell and terminate the lingering process:
  ```powershell
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  ```

### Pitfall 3: "PowerShell Script Execution Policy Error (`npm.ps1 cannot be loaded`)"
* **Cause:** Windows PowerShell restricts running unsigned `.ps1` scripts by default.
* **Fix:** Use `npm.cmd` instead of `npm`, e.g., `npm.cmd run build`.

### Pitfall 4: "Changes in Demo Mode are not visible in Production (or vice versa)!"
* **Cause:** This is intended behavior. The Dual-DB Proxy isolates `pharmacy_demo.db` from `pharmacy_inventory.db`.
* **Fix:** Toggle Demo Mode off in the navbar capsule or Settings to view production records.

---

## 9. Comprehensive Clinical & Technical Glossary

| Term | Full Name | Plain English Meaning |
| :--- | :--- | :--- |
| **FEFO** | First-Expiry, First-Out | Inventory strategy prioritizing the sale of batches with the earliest expiration date to minimize spoilage. |
| **FEFO+** | Enhanced FEFO Algorithm | Proprietary algorithm combining FEFO ordering with rolling daily demand, Expiry Risk Margin ($\Delta T$), and multi-batch auto-allocation. |
| **WAL** | Write-Ahead Logging | Crash-resilient SQLite transaction mode writing updates to a log file first, preventing corruption during power outages. |
| **$N$** | Observation Window | Configurable operational baseline window ($10, 20,\text{ or } 30\text{ days}$) used to compute moving average daily demand. |
| **Cold-Start** | Cold-Start Safeguard | Condition where transaction history $t < N$ days; automated reorders are suppressed in favor of static thresholds. |
| **Daily Demand** | Average Daily Consumption | The average number of units of a medicine sold per operational day over the selected $N$-day window. |
| **$T_{\text{expiry}}$ / DTE** | Days to Expiry | Calendar days remaining between the current date and a batch's expiration date. |
| **$T_{\text{consume}}$ / DTC** | Days to Depletion | Number of operational days current stock will last at current daily demand velocity ($\text{Stock} / \text{Daily Demand}$). |
| **$\Delta T$ / ERM** | Expiry Risk Margin | Margin metric ($T_{\text{expiry}} - T_{\text{consume}} - \text{Buffer}$). If negative, stock is at risk of expiring before depletion. |
| **$Q_{\text{waste}}$** | Predicted Expired Waste | Estimated units that will spoil if dispensing velocity does not increase prior to expiration. |
| **ROP** | Reorder Point | Inventory threshold triggering a replenishment purchase order ($[\text{Demand} \times \text{Lead Time}] + \text{Buffer}$). |
| **Lead Time** | Supplier Lead Time | Number of business days required for a pharmaceutical distributor to deliver stock after an order is placed. |
| **Safety Buffer** | Safety Stock Cushion | Additional days of demand factored into ROP calculations to prevent stockouts during delivery delays. |
| **HID Wedge** | Human Interface Device Wedge | Standard hardware protocol where a barcode scanner emulates a physical USB keyboard. |
| **AsyncLocalStorage** | Node.js Async Context | Execution context hook (`dbContext`) scoping demo database routing on a per-request basis. |
| **Scrypt** | Scrypt Key Derivation | CPU/memory-intensive password hashing algorithm providing offline brute-force protection. |
| **HMAC** | Hash-Based Message Auth Code | Cryptographic SHA-256 signature attached to session tokens ensuring tamper-proof authentication. |
| **BroadcastChannel** | Native Cross-Tab Sync | HTML5 IPC channel (`rka_inventory_sync`) keeping stock counts identical across open browser tabs without WebSockets. |
| **Supplier DR / SI** | Delivery Receipt / Sales Invoice | Distributor delivery tracking number recorded on POs and linked to active batches for regulatory compliance. |
| **Safety Snapshot** | Pre-Restore Database Copy | Automated point-in-time `.db` snapshot created prior to database restores or resets to prevent data loss. |
| **Factory Reset** | System Wipe Protocol | Clean-wipe routine purging operational records while preserving administrator credentials and preventing auto-reseeding. |

---

*Document Version:* 4.0.0 (Production & Architecture Edition)  
*Last Updated:* October 2026  
*Target Workstation:* R.K.A Pharmacy IMS (San Antonio, Agoo, La Union)
