# R.K.A Pharmacy Inventory Management System (FEFO+)

> **Offline-First Clinic Pharmacy Inventory Management System with Automated Expiry Risk Tracking (FEFO+), Barcode-Assisted Dispensing, and Audit Logging.**

[![Platform: Windows 10 / 11](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(64--bit)-blue.svg)](#system-requirements)
[![Architecture: Offline-First](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20SQLite%20WAL-success.svg)](#system-overview--key-features)
[![License: Academic Research](https://img.shields.io/badge/License-Academic%20Research%20Project-orange.svg)](#project--research-attribution)

---

## 🏛️ Project & Research Attribution

* **Client Partner:** R.K.A Pharmacy, San Antonio, Agoo, La Union  
* **Owner / Clinic Administrator:** Lourdes Gincen L. Cesista  
* **Academic Institution:** Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)  
* **College:** College of Computer Science, Agoo, La Union  
* **Degree:** Bachelor of Science in Computer Science (S.Y. 2026–2027)  

### Research Team
* **Hadriane Jerwin G. Estepa** – *Team Leader*
* **Friah Yssabel D. Agbuya** – *Researcher*
* **Emmanuel John P. Bernal** – *Lead Developer & Researcher*
* **Krissha Mae D. Estolero** – *Researcher*
* **Mark Ivan G. Medrano** – *Researcher*
* **Rafael E. Tan** – *Researcher*

**Thesis Adviser:** Nema Rose D. Rivera, DIT  
**Dean, College of Computer Science:** Charlie S. Marzan, PhD CS  

---

## 🌟 System Overview & Key Features

The **R.K.A Pharmacy Inventory Management System** is engineered specifically for single-operator community and clinic pharmacies. It operates **100% offline**, eliminating cloud dependencies, internet outage downtime, and recurring SaaS subscription fees.

* 📦 **Barcode-Assisted Stock-In & Dispensing**: Full plug-and-play support for standard USB HID barcode scanners. Generates internal Code 128 barcodes and printable shelf labels for repacked items.
* ⏳ **Automated FEFO (First-Expiry-First-Out) Enforcement**: Automatically selects and deducts the earliest expiring active batch during dispensing. Expired batches ($\le 0$ days remaining) are strictly blocked from release.
* 🧠 **FEFO+ Expiry Risk Margin (ERM) Intelligence**: Calculates consumption velocity against remaining shelf life to flag **High Waste Risk** batches before medicines expire.
* 📈 **Dynamic Suggested Reorder Planner**: Dynamically calculates replenishment points based on sales velocity, supplier lead time, and safety buffer days.
* 🛡️ **Mandatory Override & Price Protection Audit Trail**: Any non-FEFO batch selection requires entering a mandatory justification reason. Dispensing prices are strictly locked at counter-level to prevent unauthorized price alterations.
* ⚡ **Crash-Proof Local Database**: SQLite database configured in Write-Ahead Logging (WAL) mode with automated 30-day rolling daily backups to safeguard clinic records against power failures.

---

## 📥 Installation Guide (Downloading ZIP from GitHub)

Follow these steps to download and run the complete system on any Windows PC. **No installation of Node.js, npm, or external database software is required.**

### Step 1: Download the Repository ZIP
1. Go to the GitHub repository:  
   👉 **[https://github.com/zitch21/RKA-PHARMACY](https://github.com/zitch21/RKA-PHARMACY)**
2. Click the green **`<> Code`** button at the top right of the page.
3. In the dropdown menu, click **`Download ZIP`**.
4. Your browser will download the archive (`RKA-PHARMACY-main.zip`).

---

### Step 2: Extract the ZIP Archive (Crucial Step)
> ⚠️ **IMPORTANT:** Do **NOT** run files directly from inside the Windows `.zip` preview window. Running directly from a `.zip` executes in a temporary Windows sandbox, which causes missing file errors and prevents saving database changes.

1. Open your **`Downloads`** folder.
2. Right-click **`RKA-PHARMACY-main.zip`**.
3. Click **Extract All...** from the context menu.
4. Choose a permanent location (e.g., `C:\RKA-PHARMACY`, `Documents`, or `Desktop`) and click **Extract**.

---

### Step 3: Create Desktop Shortcut (1-Click Installer)
1. Open the extracted folder:
   - Navigate to `RKA-Pharmacy-IMS-Client-Offline/` (or run directly from root).
2. Double-click **`Setup-Desktop-Shortcut.bat`**.
3. The script automatically identifies your Windows Desktop path (including PCs with Microsoft OneDrive Backup enabled) and creates an **R.K.A Pharmacy IMS** shortcut on your Desktop with the official application icon.

---

### Step 4: Launch the Application
1. Double-click the **R.K.A Pharmacy IMS** shortcut on your Desktop.  
   *(Alternative: Double-click `RKA-Pharmacy-IMS.exe` or `start-app.bat` inside the folder).*
2. **First-Launch SmartScreen Prompt:**  
   If Windows displays *"Windows protected your PC"* (Microsoft Defender SmartScreen):
   - Click **More info**.
   - Click **Run anyway**.
3. The system will start automatically in a clean, dedicated application window at:
   ```
   http://localhost:5000
   ```

---

## 💻 System Requirements

| Specification | Requirement |
| :--- | :--- |
| **Operating System** | Windows 10 or Windows 11 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 or higher |
| **RAM** | 4 GB minimum (8 GB recommended) |
| **Storage** | 500 MB available local disk space |
| **Peripherals (Optional)** | Standard handheld USB Barcode Scanner (HID Keyboard Wedge) |
| **Browser** | Microsoft Edge (pre-installed on Windows) or Google Chrome |

---

## 📂 Repository Structure

```text
RKA-PHARMACY/
├── README.md                          # Project documentation and quick start guide
├── DEVELOPER_GUIDE.md                 # Technical reference, architecture & developer manual
├── Setup-Desktop-Shortcut.bat         # 1-click desktop shortcut creator (OneDrive compatible)
├── start-app.bat                      # Fallback application launcher
└── RKA-Pharmacy-IMS-Client-Offline/   # Self-contained standalone distribution
    ├── RKA-Pharmacy-IMS.exe           # Native C# launcher (silent background server + app mode)
    ├── Setup-Desktop-Shortcut.bat     # Client-level shortcut installer
    ├── start-app.bat                  # Client-level batch launcher
    ├── app-icon.ico                   # Application icon
    ├── runtime/                       # Bundled portable Node.js v24.14.0 LTS runtime
    │   └── node.exe
    ├── server/                        # Express backend API & SQLite database
    │   ├── index.js                   # Application server entry point & static file server
    │   ├── db.js                      # SQLite WAL database configuration & backup engine
    │   ├── seed.js                    # Initial clinic medicine catalog & transaction seed
    │   ├── routes/                    # REST API endpoints (medicines, batches, alerts, audit)
    │   └── data/                      # Embedded database & automated 30-day rolling backups
    ├── client/dist/                   # Precompiled React 19 production bundle
    └── node_modules/                  # Bundled production dependencies (better-sqlite3 x64 native)
```

---

## 🖥️ Application Modules Summary

* **Dashboard**: Key operational metrics, daily sales totals, active inventory value, and countdown tier breakdown.
* **Medicines & Batches**: Medicine profile management, batch intake, batch cost/price adjustments, and printable Code 128 shelf labels.
* **Stock In (Receiving)**: Safe intake with pricing validation, previous batch price inheritance, and expiration date preview.
* **Stock Out (Dispensing / POS)**: Real-time barcode scanning, automated FEFO batch allocation, mandatory override justifications, locked counter pricing, and receipt printing.
* **FEFO+ Intelligence**: Consumption velocity analysis, Days to Expiry (DTE), Days to Consume (DTC), Expiry Risk Margin (ERM), and 1-click Suggested Reorder synchronization.
* **Audit Trail**: Tamper-evident ledger logging dispensing overrides, batch price adjustments, stock adjustments, and disposals with CSV export.
* **Policy Simulation**: Comparative historical evaluation between FIFO, standard FEFO, and FEFO+ models.
* **Settings**: Configurable expiration countdown tiers (Safe, Monitor, Warning, Critical), supplier lead time, and safety buffer days with 1-click default restoration.

---

## 📖 In-Depth Developer Guide

For complete technical documentation, mathematical formulas, SQLite B-tree index schemas, disaster recovery protocols, and troubleshooting FAQ, please refer to:

👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**

---

## 📄 License & Intellectual Property

Developed as an undergraduate thesis project for the **Bachelor of Science in Computer Science** program at **Don Mariano Marcos Memorial State University – South La Union Campus (DMMMSU-SLUC)** for the operational benefit of **R.K.A Pharmacy, San Antonio, Agoo, La Union**. All rights reserved © 2026.

