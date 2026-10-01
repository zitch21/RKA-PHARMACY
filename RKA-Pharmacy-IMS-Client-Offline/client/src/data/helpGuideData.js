/**
 * R.K.A Pharmacy IMS - Help Guide Content Dictionary
 * Tri-lingual Step-by-Step Operating Manual for Pharmacy Staff & Administrators
 * Languages: English (en), Filipino (fil), Taglish (taglish)
 */

export const helpGuideData = {
  // =========================================================================
  // ENGLISH (EN) - Plain Language & Step-by-Step Instructions
  // =========================================================================
  en: {
    meta: {
      title: "R.K.A Pharmacy IMS • Operating Manual & User Guide",
      basicGuideLabel: "Basic Guide",
      basicGuideSub: "Counter Quick",
      advanceGuideLabel: "Advance Guide",
      advanceGuideSub: "System & Admin",
      descBasic: "Simple step-by-step guide for counter dispensing, stock receiving, and daily pharmacy tasks.",
      descAdvance: "Detailed guide for smart inventory forecasting, supplier purchase orders, audit trails, and data backup.",
      closeBtn: "Close Guide",
      footerNote: "R.K.A Pharmacy IMS • Simple & Reliable Offline System"
    },
    v1: {
      dispense: {
        id: "dispense",
        title: "Sell / Dispense Medicine",
        sub: "FEFO Order & Auto-Split",
        bannerTitle: "How to Dispense Medicine at the Counter",
        bannerDesc: "The system automatically selects the medicine batch that expires first (FEFO). If a customer needs more than one batch has, the system smoothly splits the quantity across batches.",
        steps: [
          {
            title: "1. Scan Barcode or Search",
            desc: "Aim your scanner at the box barcode, or press F2 on your keyboard, or type the medicine name in the search box."
          },
          {
            title: "2. Enter the Quantity",
            desc: "Type the number of items needed. You can also tap the quick buttons (+1, +5, +10) or tap Max to take all available stock."
          },
          {
            title: "3. Automatic Earliest-Expiry Selection (FEFO)",
            desc: "The system always gives you the safe batch that expires earliest. If you need 50 pieces and Batch 1 only has 30, it takes 30 from Batch 1 and 20 from Batch 2 automatically."
          },
          {
            title: "4. Senior Citizen or PWD 20% Discount",
            desc: "If the customer is a Senior Citizen or PWD, check the 20% discount box and enter their ID or name. The system automatically computes the discounted total."
          },
          {
            title: "5. Enter Cash Tender & Print Receipt",
            desc: "Type the cash given by the customer. The exact change appears on screen. Click 'Complete Dispense & Print Receipt' to finish and print the receipt."
          }
        ],
        ctaText: "Go to Dispense / POS View",
        ctaTarget: "stock-out"
      },
      stockin: {
        id: "stockin",
        title: "Stock-In Delivery Intake",
        sub: "DR Tracking & Expiry Dates",
        bannerTitle: "How to Record Incoming Deliveries (Stock-In)",
        bannerDesc: "When distributors deliver medicines, record the batch details, expiration dates, and delivery receipt (DR) numbers here so your inventory stays accurate.",
        steps: [
          {
            title: "1. Select the Medicine",
            desc: "Choose the medicine from your catalog. If it is a completely new medicine not yet in your list, click '+ Add Medicine' first."
          },
          {
            title: "2. Enter the Delivery Receipt (DR) / Invoice Number",
            desc: "Look at your delivery paper from the supplier and enter the DR or Sales Invoice number. This makes it easy to track where medicines came from."
          },
          {
            title: "3. Enter Batch / Lot Number and Quantity",
            desc: "Type the Lot or Batch number printed on the medicine box and enter the total quantity received (boxes, bottles, or blister packs)."
          },
          {
            title: "4. Set the Expiration Date",
            desc: "Enter the expiration date printed on the box. You can also use the quick buttons (+6 Mos, +1 Yr, +2 Yrs) to pick the date faster."
          },
          {
            title: "5. Verify Cost & Selling Price",
            desc: "Check your purchase cost and retail selling price. The system remembers your previous price so you can easily notice if the supplier raised their price."
          },
          {
            title: "6. Click 'Commit Stock-In'",
            desc: "Click the Commit button. The medicine is immediately saved to your inventory and is ready to be sold at the counter."
          }
        ],
        ctaText: "Go to Stock-In View",
        ctaTarget: "stock-in"
      },
      inventory: {
        id: "inventory",
        title: "Inventory & Shelf Labels",
        sub: "Stock Lists & Barcode Stickers",
        bannerTitle: "Managing Your Medicine Inventory & Shelf Labels",
        bannerDesc: "Search all medicines in stock, check batch details, and print shelf barcode labels for boxes and drawers.",
        steps: [
          {
            title: "1. Search and Filter Medicines",
            desc: "Browse your full list of medicines. Use the top filter buttons to quickly see All, In Stock, Low Stock (medicines that need reordering), or Expired."
          },
          {
            title: "2. Click Any Row to See Batches",
            desc: "Click on any medicine row to open its batch breakdown. You can see each batch number, its expiration date, how many units are left, and its supplier receipt."
          },
          {
            title: "3. Print Shelf Barcode Stickers",
            desc: "For repacked tablets or boxes without barcodes, click the Barcode icon next to the medicine. You can print clean barcode stickers to stick on your shelves or containers."
          },
          {
            title: "4. Physical Recounts (Stock Adjustment)",
            desc: "If you do a physical inventory count and find a discrepancy, click 'Stock Adjustment' on the medicine. Enter the real physical count and write a brief reason."
          }
        ],
        ctaText: "Go to Inventory View",
        ctaTarget: "inventory"
      },
      ui_modes: {
        id: "ui_modes",
        title: "Clean Mode & Languages",
        sub: "Simple UI & Tab Sync",
        bannerTitle: "Display Modes, Languages & Multi-Tab Sync",
        bannerDesc: "Make the screen simple during busy counter hours, switch languages easily, and keep multiple browser tabs in sync.",
        steps: [
          {
            title: "1. Clean Mode for Busy Hours",
            desc: "In Settings, switch to 'Clean Mode'. This shows only the 4 essential counter tabs (Dashboard, Dispense, Stock-In, Inventory), hiding advanced screens to reduce clutter and mistakes during busy rush hours."
          },
          {
            title: "2. Switching Languages (English, Filipino, Taglish)",
            desc: "Click the Globe icon at the top right of your screen anytime. You can switch between English, Filipino (formal Tagalog), and Taglish (everyday conversational pharmacy language). It works 100% offline."
          },
          {
            title: "3. Automatic Multi-Tab Sync",
            desc: "If you have two or three tabs open on your computer (for example, one for selling and one for checking stock), any sale or delivery in one tab updates all other tabs instantly without manual refreshing."
          }
        ],
        ctaText: "Open Settings",
        ctaTarget: "settings"
      },
      expired: {
        id: "expired",
        title: "Expired Medicine Lockout",
        sub: "Strict Safety Quarantine",
        bannerTitle: "Strict Safety Rule: Expired Medicine Lockout",
        bannerDesc: "To protect patient safety and comply with health regulations, expired medicines can NEVER be sold or dispensed under any condition.",
        steps: [
          {
            title: "1. Automatic System Lockout",
            desc: "When a batch reaches its expiration date (0 days remaining or past date), the system automatically locks it. The computer strictly refuses to add it to any cart or receipt."
          },
          {
            title: "2. Remove from Shelf (Physical Quarantine)",
            desc: "Immediately take the expired box off the retail sales shelf. Put it in your pharmacy's designated 'Quarantine / For Disposal' storage box or cabinet."
          },
          {
            title: "3. Record Disposal in the System",
            desc: "In the Inventory tab, find the expired batch and click the red Trash (Disposal) button. Enter how it was disposed of (e.g. returned to supplier, chemical waste) and who witnessed it. This creates a permanent official record."
          }
        ],
        ctaText: "View Quarantine & Expired Stock",
        ctaTarget: "inventory"
      },
      alerts: {
        id: "alerts",
        title: "Expiry Countdown Tiers",
        sub: "Color Warnings & Overrides",
        bannerTitle: "Expiry Countdown Colors & Confirmation Prompts",
        bannerDesc: "Every medicine batch has a color badge showing how many days it has left before expiration so you always know what to sell first.",
        steps: [
          {
            title: "Safe (> 180 Days / Green)",
            desc: "More than 6 months left. Sell normally without any prompts."
          },
          {
            title: "Monitor (91–180 Days / Blue)",
            desc: "Between 3 to 6 months left. Good condition. The system monitors how fast it sells."
          },
          {
            title: "Warning (31–90 Days / Yellow)",
            desc: "Between 1 to 3 months left. Expiring soon. Adding this batch shows a quick reminder prompt so the dispenser double-checks."
          },
          {
            title: "Critical (1–30 Days / Red)",
            desc: "Less than 30 days left! High priority to dispense first before it expires. Requires confirmation before checkout."
          },
          {
            title: "Customer Requests a Newer Batch? (Manual Override)",
            desc: "If a customer specifically asks for a batch that expires later (for example, for overseas travel), you can pick the newer batch. The system will ask for a short reason and log it in the audit trail for transparency."
          }
        ],
        ctaText: "View Stock Alerts",
        ctaTarget: "dashboard"
      },
      backup_exit: {
        id: "backup_exit",
        title: "Daily USB Backup & Exit",
        sub: "Safe Workstation Shutdown",
        bannerTitle: "Daily USB Backup & Closing the Workstation",
        bannerDesc: "Protect your pharmacy records every evening before turning off the computer with our 1-click USB backup.",
        steps: [
          {
            title: "1. Insert the Pharmacy USB Flash Drive",
            desc: "Before closing your shift, plug the designated pharmacy USB flash drive into your computer."
          },
          {
            title: "2. Click 'Exit Workstation'",
            desc: "Click the user icon at the top right, or click the Exit button on the screen."
          },
          {
            title: "3. Choose Your USB Drive",
            desc: "The system scans your computer and shows your connected USB drive (e.g. Drive E: or F:). Select your USB drive."
          },
          {
            title: "4. Click 'Backup to USB & Exit'",
            desc: "Click the backup button. The system saves a complete backup of all sales, stock, and medicines to your USB drive, and then cleanly closes the application and background process."
          }
        ],
        ctaText: "Open Exit Dialog",
        ctaTarget: "exit"
      }
    },
    v2: {
      fefo_intelligence: {
        id: "fefo_intelligence",
        title: "FEFO+ Smart Forecasting",
        sub: "Daily Sales & Waste Prevention",
        bannerTitle: "How FEFO+ Predicts and Prevents Expired Waste",
        bannerDesc: "Standard FEFO only looks at expiry dates. FEFO+ also measures your daily sales speed to warn you if a medicine will expire before you can finish selling it.",
        steps: [
          {
            title: "1. Average Daily Sales Speed",
            desc: "The system calculates how many units of each medicine you sell per day over a recent window (10, 20, or 30 days, configured in Settings)."
          },
          {
            title: "2. Predicting Days to Sell Out",
            desc: "The system compares remaining stock against your sales speed: 'At our current sales rate, will we finish selling this batch before its expiration date?'"
          },
          {
            title: "3. Flagging 'At-Risk' Batches",
            desc: "If you have 60 tablets of a medicine expiring in 20 days, but you only sell 1 tablet per day, 40 tablets will likely expire unsold. The system flags this batch as 'At-Risk' so you can take action early."
          },
          {
            title: "4. Clearance Pricing & Priority Dispense",
            desc: "In the FEFO+ Risk tab, you can see suggested clearance discounts to help sell near-expiry medicines faster while still protecting your profit margin."
          }
        ],
        ctaText: "Go to FEFO+ Risk View",
        ctaTarget: "fefo-plus"
      },
      po_procurement: {
        id: "po_procurement",
        title: "Purchase Orders & Suppliers",
        sub: "Reordering & Deliveries",
        bannerTitle: "Purchase Order Workflow & Supplier Deliveries",
        bannerDesc: "Easily create purchase orders for low-stock medicines, send them to distributors, and receive items directly into your inventory.",
        steps: [
          {
            title: "1. Review Low-Stock Recommendations",
            desc: "In Purchase Orders or FEFO+ Risk, the system lists all medicines that have dropped below their minimum safe stock level."
          },
          {
            title: "2. Create or Auto-Draft an Order",
            desc: "Click 'Bulk Draft Purchase Orders'. The system bundles needed medicines by supplier (e.g. Unilab, Zuellig). You can adjust suggested quantities or delete items you don't need."
          },
          {
            title: "3. Print Official Purchase Order Slip",
            desc: "Open any order and click 'Print PO Slip'. This creates a clean, professional order form with your pharmacy header and signature lines to give to your supplier sales representative."
          },
          {
            title: "4. Receive Delivery with 1 Click",
            desc: "When the supplier delivers the items, open the order and click 'Receive Delivery'. Simply enter the batch number and expiry date from the box. The system automatically creates the new inventory batches!"
          }
        ],
        ctaText: "Go to Purchase Orders",
        ctaTarget: "purchase-orders"
      },
      audit_compliance: {
        id: "audit_compliance",
        title: "Audit Trail & Compliance",
        sub: "FDA / DOH Regulatory Ledger",
        bannerTitle: "Tamper-Evident Audit Trail for Regulatory Inspections",
        bannerDesc: "Every sensitive action in the clinic is permanently recorded to satisfy Philippine FDA and DOH recordkeeping requirements.",
        steps: [
          {
            title: "1. Automatic Activity Logging",
            desc: "Every login, medicine sale, batch override, price adjustment, and stock reconciliation is recorded automatically with the operator's name, date, and exact timestamp."
          },
          {
            title: "2. Permanent & Tamper-Evident",
            desc: "Audit logs are written to a permanent database ledger that cannot be edited, altered, or deleted by any user."
          },
          {
            title: "3. 1-Click CSV Export for FDA / DOH Inspectors",
            desc: "When pharmacy inspectors or clinic auditors visit, go to the Audit Trail tab and click 'Export to CSV'. It immediately downloads a complete, organized spreadsheet ready for inspection."
          }
        ],
        ctaText: "Go to Audit Trail",
        ctaTarget: "audit"
      },
      simulation_engine: {
        id: "simulation_engine",
        title: "Inventory Policy Simulation",
        sub: "FIFO vs FEFO vs FEFO+",
        bannerTitle: "Scientific Policy Simulation: FIFO vs FEFO vs FEFO+",
        bannerDesc: "Test and compare how different inventory dispatching rules perform across 30 to 180 days using simulated customer demand.",
        steps: [
          {
            title: "1. FIFO (First-In, First-Out)",
            desc: "Sells the oldest delivered box regardless of expiry date. This strategy causes the highest expired waste because older batches get stuck behind newer deliveries."
          },
          {
            title: "2. Standard FEFO (First-Expiry, First-Out)",
            desc: "Sells nearest-expiry batches first. Good, but does not anticipate future sales speed or lead times."
          },
          {
            title: "3. FEFO+ (Smart Demand-Aware)",
            desc: "Combines expiry order with daily sales velocity and safety buffers. Cuts expired medicine waste by up to 80% and prevents sudden stockouts."
          },
          {
            title: "4. 100% Safe (Zero Effect on Real Stock)",
            desc: "Simulations run entirely in temporary memory. They never alter, delete, or touch any real medicines or sales in your active database."
          }
        ],
        ctaText: "Go to Simulation View",
        ctaTarget: "simulation"
      },
      disaster_recovery: {
        id: "disaster_recovery",
        title: "Database Backup & Recovery",
        sub: "Safe Restore & Emergency Tool",
        bannerTitle: "Database Safety, Backups & Disaster Recovery",
        bannerDesc: "How to safely restore backups if your computer encounters problems or if you need to recover past records.",
        steps: [
          {
            title: "1. Automatic Safety Snapshot Before Every Restore",
            desc: "Whenever you restore a database backup, the system automatically takes a safety snapshot of your current data first. You can never accidentally lose today's records!"
          },
          {
            title: "2. Restoring from Settings (Simple Web Screen)",
            desc: "In Settings under 'Database Backup & Recovery', view all previous backups. Select the date you want, type your administrator password, and click Restore."
          },
          {
            title: "3. Emergency Command-Line Tool (restore.js)",
            desc: "If the computer will not start the web browser after a sudden power outage, open PowerShell in the app folder and run: .\\runtime\\node.exe server\\restore.js for an easy recovery menu."
          }
        ],
        ctaText: "Go to Settings Backup Panel",
        ctaTarget: "settings"
      }
    }
  },

  // =========================================================================
  // FILIPINO (FIL) - Pormal, Malinaw at Simpleng Tagalog
  // =========================================================================
  fil: {
    meta: {
      title: "R.K.A Botika IMS • Manwal sa Pagpapatakbo at Gabay sa Paggamit",
      basicGuideLabel: "Pangunahing Gabay",
      basicGuideSub: "Mabilisang Counter",
      advanceGuideLabel: "Masusing Gabay",
      advanceGuideSub: "Sistema at Pamamahala",
      descBasic: "Simpleng hakbang-hakbang na gabay para sa pagbenta sa counter, pagtanggap ng gamot, at araw-araw na gawain sa botika.",
      descAdvance: "Detalyadong gabay para sa matalinong pagtataya ng stock, purchase order sa supplier, audit trail, at backup ng datos.",
      closeBtn: "Isara ang Gabay",
      footerNote: "R.K.A Botika IMS • Simple at Maasahang Offline na Sistema"
    },
    v1: {
      dispense: {
        id: "dispense",
        title: "Magbenta / Mag-dispense ng Gamot",
        sub: "Pagkakasunod ng FEFO at Auto-Split",
        bannerTitle: "Paano Magbenta ng Gamot sa Counter",
        bannerDesc: "Kusang pinipili ng sistema ang batch ng gamot na mauunang mag-expire (FEFO). Kung kailangan ng kostumer ng higit sa laman ng isang batch, kusang hinahati ng sistema ang bilang sa susunod na batch.",
        steps: [
          {
            title: "1. I-scan ang Barcode o Hanapin ang Gamot",
            desc: "Itutok ang scanner sa barcode ng kahon, o pindutin ang F2 sa keyboard, o i-type ang pangalan ng gamot sa search box."
          },
          {
            title: "2. Ilagay ang Dami ng Bibilhin",
            desc: "I-type kung ilang piraso o kahon ang kailangan. Maaari ring gamitin ang mga pindutan ng mabilisang dagdag (+1, +5, +10) o pindutin ang Max para kunin ang lahat ng natitirang stock."
          },
          {
            title: "3. Kusang Pagpili ng Mauunang Mag-expire (FEFO)",
            desc: "Laging ang pinakalumang ligtas na batch ang ibinibigay ng sistema. Kung 50 piraso ang kailangan at 30 lang ang nasa unang batch, kukunin ng sistema ang 30 sa unang batch at ang natitirang 20 sa susunod na batch."
          },
          {
            title: "4. Diskwento para sa Senior Citizen o PWD (20%)",
            desc: "Kung ang bumibili ay Senior Citizen o PWD, lagyan ng tsek ang 20% discount box at ilagay ang kanilang ID o pangalan. Kusang bibilangin ng sistema ang may-diskwentong kabuuang halaga."
          },
          {
            title: "5. Ilagay ang Bayad at Mag-print ng Resibo",
            desc: "I-type ang perang ibinayad ng kostumer. Lalabas agad ang eksaktong sukli sa screen. Pindutin ang 'Kumpletuhin at Mag-print ng Resibo' upang tapusin ang transaksyon."
          }
        ],
        ctaText: "Pumunta sa Dispense / POS View",
        ctaTarget: "stock-out"
      },
      stockin: {
        id: "stockin",
        title: "Pagtanggap ng Gamot (Stock-In)",
        sub: "Pagsubaybay sa DR at Expiry Date",
        bannerTitle: "Paano Magtala ng Bagong Dating na Gamot (Stock-In)",
        bannerDesc: "Kapag naghatid ang supplier o distributor ng mga gamot, itala rito ang batch number, expiration date, at Delivery Receipt (DR) number upang laging wasto ang inyong imbentaryo.",
        steps: [
          {
            title: "1. Piliin ang Gamot",
            desc: "Piliin ang gamot mula sa listahan. Kung bago pa itong gamot at wala pa sa listahan, pindutin muna ang '+ Magdagdag ng Gamot'."
          },
          {
            title: "2. Ilagay ang Delivery Receipt (DR) o Invoice Number",
            desc: "Tingnan ang resibo o DR mula sa supplier at ilagay ang numero nito. Mahalaga ito upang madaling matunton kung saan nanggaling ang gamot."
          },
          {
            title: "3. Ilagay ang Batch / Lot Number at Dami",
            desc: "I-type ang Lot o Batch number na nakatatak sa kahon ng gamot, at ilagay kung ilang piraso, banig, o kahon ang dumating."
          },
          {
            title: "4. Piliin ang Expiration Date",
            desc: "Ilagay ang expiration date na nakaimprenta sa kahon. Maaari ring gamitin ang mga mabilisang pindutan (+6 Buwan, +1 Taon, +2 Taon) para mas mabilis pumili ng petsa."
          },
          {
            title: "5. Suriin ang Puhunan at Presyo ng Tinda",
            desc: "Tiyakin ang presyo ng puhunan at ang presyo ng tinda sa publiko. Naaalala ng sistema ang nakaraang presyo upang madali mong mapansin kung nagtaas ang supplier."
          },
          {
            title: "6. Pindutin ang 'Commit Stock-In'",
            desc: "Pindutin ang Commit button. Agad na papasok ang gamot sa imbentaryo at handa na itong ibenta sa counter."
          }
        ],
        ctaText: "Pumunta sa Stock-In View",
        ctaTarget: "stock-in"
      },
      inventory: {
        id: "inventory",
        title: "Imbentaryo at Barcode sa Istante",
        sub: "Talaan ng Stock at Sticker",
        bannerTitle: "Pamamahala ng Imbentaryo at Barcode sa Istante",
        bannerDesc: "Tingnan ang lahat ng gamot sa istante, suriin ang mga batch, at mag-print ng barcode sticker para sa mga kahon at lalagyan.",
        steps: [
          {
            title: "1. Maghanap at Mag-filter ng Gamot",
            desc: "Tingnan ang buong listahan ng gamot. Gamitin ang mga pindutan sa itaas upang mabilis makita ang Lahat, May Stock, Kaunti Na (kailangan nang mag-order), o Paso (Expired)."
          },
          {
            title: "2. Pindutin ang Gamot para Makita ang mga Batch",
            desc: "Pindutin ang kahit anong gamot upang lumabas ang mga batch nito. Makikita ang batch number, expiration date, natitirang piraso, at numero ng resibo ng supplier."
          },
          {
            title: "3. Mag-print ng Barcode Sticker sa Istante",
            desc: "Para sa mga gamot na binalot o walang barcode sa kahon, pindutin ang Barcode icon sa tabi ng gamot. Maaari kang mag-print ng malinaw na sticker na ididikit sa istante."
          },
          {
            title: "4. Pagwawasto ng Bilang (Stock Adjustment)",
            desc: "Kung nagbilang ka ng pisikal na stock at may kulang o sobra, pindutin ang 'Stock Adjustment'. Ilagay ang totoong bilang at magbigay ng maikling dahilan."
          }
        ],
        ctaText: "Pumunta sa Inventory View",
        ctaTarget: "inventory"
      },
      ui_modes: {
        id: "ui_modes",
        title: "Simpleng Mode at Wika",
        sub: "Malinis na UI at Sabayang Tab",
        bannerTitle: "Mga Mode ng Screen, Wika at Sabayang Tab",
        bannerDesc: "Gawing simple ang screen kapag maraming bumibili, madaling magpalit ng wika, at panatilihing tugma ang maramihang bukas na tab.",
        steps: [
          {
            title: "1. Clean Mode para sa Mabilisang Pagbenta",
            desc: "Sa Settings, piliin ang 'Clean Mode'. Ipapakita lamang nito ang 4 na pangunahing tab sa counter (Dashboard, Dispense, Stock-In, Inventory), upang hindi maguluhan ang staff sa oras ng dagsaan ng kostumer."
          },
          {
            title: "2. Pagpalit ng Wika (English, Filipino, Taglish)",
            desc: "Pindutin ang Globe icon sa kanang itaas ng screen anumang oras. Maaari kang pumili sa pagitan ng English, Filipino (pormal), o Taglish (pangkaraniwang usapan sa botika). Gumagana ito kahit walang internet."
          },
          {
            title: "3. Sabayang Pag-update ng Maramihang Tab",
            desc: "Kung may dalawa o higit pang tab na nakabukas sa inyong computer, anumang benta o tanggap ng gamot sa Tab 1 ay agad ding makikita sa Tab 2 nang hindi na kailangang mag-refresh."
          }
        ],
        ctaText: "Buksan ang Settings",
        ctaTarget: "settings"
      },
      expired: {
        id: "expired",
        title: "Mahigpit na Harang sa Pasong Gamot",
        sub: "Pangangalaga sa Kaligtasan",
        bannerTitle: "Mahigpit na Alituntunin: Bawal ang Pasong Gamot",
        bannerDesc: "Upang maprotektahan ang kalusugan ng mga pasyente at sumunod sa batas, HINDI kailanman maaaring ibenta o i-dispense ang pasong gamot.",
        steps: [
          {
            title: "1. Kusang Pagharang ng Sistema",
            desc: "Kapag sumapit na ang expiration date ng isang gamot (0 araw o lumipas na), kusa itong ihaharang ng computer. Hindi ito papayagang maisama sa kahit anong resibo o benta."
          },
          {
            title: "2. Alisin Agad sa Istante (Quarantine)",
            desc: "Agad na tanggalin ang pasong kahon mula sa istante ng tinda. Ilagay ito sa nakatalagang kahon o lalagyan ng 'Quarantine / For Disposal' sa botika."
          },
          {
            title: "3. Itala ang Pagtatapon sa Sistema",
            desc: "Sa Inventory tab, hanapin ang pasong batch at pindutin ang pulang basurahan (Disposal) button. Itala kung paano ito itinapon (hal. ibinalik sa supplier o sinira) at kung sino ang saksi. Ito ay magiging permanenteng opisyal na ulat."
          }
        ],
        ctaText: "Tingnan ang Pasong Gamot sa Imbentaryo",
        ctaTarget: "inventory"
      },
      alerts: {
        id: "alerts",
        title: "Mga Kulay ng Babala sa Expiry",
        sub: "Alerto at Pagpapalit ng Batch",
        bannerTitle: "Mga Antas ng Babala sa Expiration Date",
        bannerDesc: "Bawat batch ng gamot ay may kulay na badge na nagpapakita kung ilang araw na lamang ang nalalabi bago ito mag-expire.",
        steps: [
          {
            title: "Ligtas / Safe (> 180 Araw / Berde)",
            desc: "Mahigit 6 na buwan pa ang nalalabi. Ibenta nang normal nang walang babala."
          },
          {
            title: "Bantayan / Monitor (91–180 Araw / Asul)",
            desc: "Nasa 3 hanggang 6 na buwan ang nalalabi. Maayos ang kalagayan. Binabantayan ng sistema kung gaano kabilis maubos."
          },
          {
            title: "Babala / Warning (31–90 Araw / Dilaw)",
            desc: "Nasa 1 hanggang 3 buwan na lamang. Malapit nang mag-expire. Kapag pinili ito, may lalabas na paalala upang masuri muli ng staff."
          },
          {
            title: "Kritikal / Critical (1–30 Araw / Pula)",
            desc: "Kulang na sa 30 araw! Kailangang unahing ibenta bago mapaso. Hihingi ng kumpirmasyon bago maibenta."
          },
          {
            title: "Paano kung humingi ng mas bagong gamot ang kostumer?",
            desc: "Kung partikular na humiling ang kostumer ng gamot na mas matagal mag-expire (halimbawa, para sa paglalakbay sa ibang bansa), maaari mong piliin ang mas bagong batch. Magtatanong ang sistema ng maikling dahilan at itatala ito sa audit trail."
          }
        ],
        ctaText: "Tingnan ang mga Babala sa Dashboard",
        ctaTarget: "dashboard"
      },
      backup_exit: {
        id: "backup_exit",
        title: "Araw-araw na Backup sa USB at Pagsara",
        sub: "Ligtas na Pagpatay ng Workstation",
        bannerTitle: "Araw-araw na Pag-backup sa USB at Pagsara ng Computer",
        bannerDesc: "Pangalagaan ang talaan ng botika bago umuwi sa gabi sa pamamagitan ng 1-click backup sa USB.",
        steps: [
          {
            title: "1. Isaksak ang USB Flash Drive ng Botika",
            desc: "Bago magsara ng botika sa hapon o gabi, isaksak ang nakalaang USB flash drive sa computer."
          },
          {
            title: "2. Pindutin ang 'Exit Workstation'",
            desc: "Pindutin ang user icon sa kanang itaas, o pindutin ang Exit button sa screen."
          },
          {
            title: "3. Piliin ang Inyong USB Drive",
            desc: "Hahanapin ng computer ang inyong USB drive (halimbawa, Drive E: o F:). Tiyaking napili ang tamang drive."
          },
          {
            title: "4. Pindutin ang 'Backup to USB & Exit'",
            desc: "Pindutin ang backup button. Kusang kokopyahin ng sistema ang kumpletong kopya ng lahat ng benta, gamot, at resibo sa inyong USB bago ligtas na isara ang programa."
          }
        ],
        ctaText: "Buksan ang Exit Window",
        ctaTarget: "exit"
      }
    },
    v2: {
      fefo_intelligence: {
        id: "fefo_intelligence",
        title: "Katalinuhan ng FEFO+ sa Demand",
        sub: "Pagtataya ng Benta at Pag-iwas sa Sayang",
        bannerTitle: "Paano Hinuhulaan at Pinipigilan ng FEFO+ ang Pasong Gamot",
        bannerDesc: "Ang karaniwang FEFO ay tumitingin lamang sa petsa. Ang FEFO+ naman ay sinusukat din kung gaano kabilis mabili ang gamot upang magbabala bago pa ito mapaso sa istante.",
        steps: [
          {
            title: "1. Bilis ng Pang-araw-araw na Benta",
            desc: "Sinusukat ng sistema kung ilang piraso ng gamot ang nabebenta bawat araw sa nakalipas na 10, 20, o 30 araw (maaaring baguhin sa Settings)."
          },
          {
            title: "2. Pagtataya kung Aabot Bago Mapaso",
            desc: "Inihahambing ng sistema ang dami ng natitirang gamot sa bilis ng benta: 'Sa bilis ng ating benta ngayon, mauubos ba natin ito bago sumapit ang expiration date?'"
          },
          {
            title: "3. Pagmamarka sa mga 'Nanganganib' (At-Risk)",
            desc: "Kung may 60 piraso ka ng gamot na mag-eexpire sa loob ng 20 araw, ngunit 1 piraso lamang ang nabebenta kada araw, 40 piraso ang malamang na mapaso. Mamarkahan ito ng sistema bilang 'At-Risk' upang maaksyunan agad."
          },
          {
            title: "4. Clearance Discount at Unang Pagbenta",
            desc: "Sa FEFO+ Risk tab, makikita mo ang mga suhestiyong diskwento upang mas mabilis maibenta ang mga gamot na malapit nang mapaso habang may proteksyon pa rin ang inyong kita."
          }
        ],
        ctaText: "Pumunta sa FEFO+ Risk View",
        ctaTarget: "fefo-plus"
      },
      po_procurement: {
        id: "po_procurement",
        title: "Purchase Orders at mga Supplier",
        sub: "Pag-order at Pagtanggap ng Gamot",
        bannerTitle: "Proseso ng Pag-order sa Supplier at Pagtanggap",
        bannerDesc: "Madaling gumawa ng opisyal na order sa supplier kapag kaunti na ang gamot, at agad itong tanggapin sa imbentaryo pagdating ng delivery.",
        steps: [
          {
            title: "1. Suriin ang mga Gamot na Kaunti Na",
            desc: "Sa Purchase Orders o FEFO+ Risk tab, inililista ng computer ang lahat ng gamot na bumaba na sa kanilang pinakamababang ligtas na bilang."
          },
          {
            title: "2. Kusang Paggawa ng Draft Order",
            desc: "Pindutin ang 'Bulk Draft Purchase Orders'. Papangkatin ng sistema ang mga kailangang gamot ayon sa supplier (hal. Unilab, Zuellig). Maaari mong baguhin ang dami o alisin ang hindi pa kailangan."
          },
          {
            title: "3. Mag-print ng Opisyal na PO Slip",
            desc: "Buksan ang order at pindutin ang 'Print PO Slip'. Makakagawa ito ng pormal na dokumento na may pangalan ng inyong botika at linya para sa pirma upang ibigay sa ahente ng supplier."
          },
          {
            title: "4. Pagtanggap ng Delivery sa Isang Pindot",
            desc: "Kapag dumating na ang delivery, buksan ang PO at pindutin ang 'Receive Delivery'. Ilagay lamang ang batch number at expiry date mula sa kahon. Kusa nang papasok ang mga bagong gamot sa inyong imbentaryo nang hindi na kailangang i-type muli ang lahat!"
          }
        ],
        ctaText: "Pumunta sa Purchase Orders",
        ctaTarget: "purchase-orders"
      },
      audit_compliance: {
        id: "audit_compliance",
        title: "Audit Trail at Pagsunod sa Batas",
        sub: "Talaan para sa FDA at DOH",
        bannerTitle: "Hindi Mababagong Talaan para sa Inspeksyon ng FDA at DOH",
        bannerDesc: "Bawat mahalagang gawain sa botika ay permanenteng naitatala upang matugunan ang mga patakaran ng FDA at Department of Health.",
        steps: [
          {
            title: "1. Kusang Pagtatala ng Bawat Gawain",
            desc: "Ang bawat pag-login, benta ng gamot, pagpalit ng batch, pagbago ng presyo, at pagbilang ng stock ay kusang naitatala kasama ang pangalan ng staff, petsa, at eksaktong oras."
          },
          {
            title: "2. Ligtas at Hindi Mababago",
            desc: "Ang mga talaang ito ay nakasulat sa isang permanenteng database ledger na hindi maaaring burahin, baguhin, o dayain ng kahit sinong gumagamit."
          },
          {
            title: "3. 1-Click CSV Export para sa Inspeksyon",
            desc: "Kapag may bumisitang inspektor mula sa FDA o DOH, pumunta lamang sa Audit Trail tab at pindutin ang 'Export to CSV'. Agad itong magda-download ng malinis na spreadsheet na handang ipakita sa inspeksyon."
          }
        ],
        ctaText: "Pumunta sa Audit Trail",
        ctaTarget: "audit"
      },
      simulation_engine: {
        id: "simulation_engine",
        title: "Pagsusuri ng Patakaran sa Imbentaryo",
        sub: "Paghahambing ng FIFO, FEFO at FEFO+",
        bannerTitle: "Siyentipikong Pagsusuri: FIFO vs FEFO vs FEFO+",
        bannerDesc: "Subukan at ihambing kung paano gumagana ang iba't ibang patakaran sa pagbenta sa loob ng 30 hanggang 180 araw gamit ang kunwaring benta.",
        steps: [
          {
            title: "1. FIFO (Unang Dumating, Unang Labas)",
            desc: "Ibinebenta ang pinakamatagal nang nadeliver kahit ano pa ang expiry date. Ang estilong ito ang nagdudulot ng pinakamaraming pasong gamot dahil nababaon ang mga lumang batch sa likod ng mga bagong dating."
          },
          {
            title: "2. Karaniwang FEFO (Unang Mag-eexpire, Unang Labas)",
            desc: "Inuuna ang pinakamalapit mag-expire. Mabuti, ngunit hindi nito nahuhulaan ang bilis ng benta sa hinaharap."
          },
          {
            title: "3. FEFO+ (Matalinong Gabay sa Demand)",
            desc: "Pinagsasama ang expiration date at bilis ng benta araw-araw. Nababawasan nito ang tapong gamot nang hanggang 80% at iniiwasan ang biglaang pagkaubos ng gamot."
          },
          {
            title: "4. 100% Ligtas (Walang Bawas sa Tunay na Stock)",
            desc: "Ang pagsusuring ito ay tumatakbo lamang sa pansamantalang memorya ng computer. Hindi nito kailanman gagalawin, babaguhin, o buburahin ang inyong tunay na gamot at benta sa botika."
          }
        ],
        ctaText: "Pumunta sa Simulation View",
        ctaTarget: "simulation"
      },
      disaster_recovery: {
        id: "disaster_recovery",
        title: "Pagbawi ng Datos at Pangangasiwa",
        sub: "Ligtas na Restore at Emergency Tool",
        bannerTitle: "Kaligtasan ng Datos, Backup at Pagbawi (Disaster Recovery)",
        bannerDesc: "Paano ligtas na ibabalik ang inyong mga talaan kung sakaling magkaproblema ang computer o kailangang ibalik ang lumang kopya.",
        steps: [
          {
            title: "1. Kusang Safety Backup Bago Mag-restore",
            desc: "Sa tuwing magbabalik ka ng backup, kusa munang gumagawa ang computer ng pansamantalang safety snapshot ng kasalukuyang datos. Hindi ka kailanman magkakamaling mawalan ng bagong talaan!"
          },
          {
            title: "2. Pag-restore sa Pamamagitan ng Settings",
            desc: "Sa Settings sa ilalim ng 'Database Backup & Recovery', makikita ang listahan ng mga nakaraang backup. Piliin ang petsang nais mo, ilagay ang administrator password, at pindutin ang Restore."
          },
          {
            title: "3. Emergency Command-Line Tool (restore.js)",
            desc: "Kung nagkaroon ng biglaang brownout at ayaw bumukas ng browser, buksan lamang ang PowerShell sa folder ng app at patakbuhin ang: .\\runtime\\node.exe server\\restore.js para sa mabilisang menu ng pagbawi."
          }
        ],
        ctaText: "Pumunta sa Settings Backup Panel",
        ctaTarget: "settings"
      }
    }
  },

  // =========================================================================
  // TAGLISH (TAGLISH) - Natural, Conversational Everyday Philippine Pharmacy
  // =========================================================================
  taglish: {
    meta: {
      title: "R.K.A Pharmacy IMS • Operating Manual at Gabay sa Paggamit",
      basicGuideLabel: "Basic Guide",
      basicGuideSub: "Counter Quick",
      advanceGuideLabel: "Advance Guide",
      advanceGuideSub: "System & Admin",
      descBasic: "Simple at step-by-step na guide para sa pag-dispense sa counter, pagtanggap ng delivery, at daily pharmacy routine.",
      descAdvance: "Detailed guide para sa smart inventory forecasting, supplier purchase orders, audit trails, at data backup.",
      closeBtn: "Isara ang Guide",
      footerNote: "R.K.A Pharmacy IMS • Simple at Maasahang Offline System"
    },
    v1: {
      dispense: {
        id: "dispense",
        title: "Mag-Dispense / Magbenta sa Counter",
        sub: "FEFO Queue at Auto-Split",
        bannerTitle: "Paano Mag-Dispense ng Gamot sa Counter (POS)",
        bannerDesc: "Automatic na pipiliin ng system ang batch na mauunang mag-expire (FEFO). Kapag kulang ang laman ng unang batch para sa order ng customer, automatic itong hahatiin sa susunod na batch.",
        steps: [
          {
            title: "1. I-scan ang Barcode o I-search ang Gamot",
            desc: "Itutok ang barcode scanner sa kahon ng gamot, o i-press ang F2 sa keyboard para mag-focus sa search bar, o i-type ang brand/generic name."
          },
          {
            title: "2. Ilagay ang Dami o Quantity",
            desc: "I-type kung ilang piraso o banig ang kailangan. Pwede ring i-click ang quick buttons (+1, +5, +10) o i-click ang Max para kunin lahat ng available stock."
          },
          {
            title: "3. Automatic Earliest-Expiry Allocation (FEFO)",
            desc: "Laging ang batch na pinakamalapit mag-expire ang uunahin ng system. Halimbawa, kung 50 pieces ang bibilhin at 30 lang ang nasa unang batch, kukunin ng system ang 30 sa Batch 1 at ang natitirang 20 sa Batch 2 nang automatic."
          },
          {
            title: "4. Senior Citizen o PWD 20% Discount",
            desc: "Kapag Senior Citizen o PWD ang customer, i-check ang 20% discount box at ilagay ang kanilang ID number o pangalan. Automatic na ikakaltas ng system ang diskwento."
          },
          {
            title: "5. Ilagay ang Bayad at Mag-print ng Resibo",
            desc: "I-type ang perang iniabot ng customer sa Amount Paid. Lalabas agad ang eksaktong sukli. I-click ang 'Complete Dispense & Print Receipt' para matapos ang benta at mag-print ng resibo."
          }
        ],
        ctaText: "Pumunta sa Dispense / POS View",
        ctaTarget: "stock-out"
      },
      stockin: {
        id: "stockin",
        title: "Stock-In at Delivery Intake",
        sub: "DR Tracking at Expiry Dates",
        bannerTitle: "Paano Mag-Stock In ng Bagong Dating na Gamot",
        bannerDesc: "Kapag may bagong dating na delivery mula sa distributor o supplier, i-record dito ang batch number, expiration date, at Delivery Receipt (DR) number para laging updated ang stock.",
        steps: [
          {
            title: "1. Piliin ang Gamot sa Listahan",
            desc: "Piliin ang gamot na dumating. Kung bago itong gamot at wala pa sa listahan, i-click muna ang '+ Add Medicine Profile'."
          },
          {
            title: "2. Ilagay ang Supplier DR / Sales Invoice Number",
            desc: "Tingnan ang delivery slip mula sa supplier at i-type ang DR o SI number. Importante ito para madaling ma-trace ang pinanggalingan ng bawat kahon."
          },
          {
            title: "3. Ilagay ang Batch / Lot Number at Quantity",
            desc: "I-type ang Lot o Batch number na nakatatak sa kahon at ilagay kung ilang units (kahon, bote, o piraso) ang natanggap."
          },
          {
            title: "4. Ilagay ang Expiration Date",
            desc: "Piliin ang expiration date mula sa kahon. Pwede ring gamitin ang quick date jump buttons (+6 Mos, +1 Yr, +2 Yrs) para mas mabilis mag-input."
          },
          {
            title: "5. I-check ang Puhunan (Cost) at Selling Price",
            desc: "I-verify ang purchase cost at selling price. Naaalala ng system ang huling presyo kaya madali mong makikita kung nagmahal ang gamot mula sa supplier."
          },
          {
            title: "6. I-click ang 'Commit Stock-In'",
            desc: "Pindutin ang Commit button. Agad na papasok ang mga gamot sa inyong active inventory at pwede na itong ibenta sa counter."
          }
        ],
        ctaText: "Pumunta sa Stock-In View",
        ctaTarget: "stock-in"
      },
      inventory: {
        id: "inventory",
        title: "Inventory & Shelf Barcodes",
        sub: "Stock List at Printing ng Labels",
        bannerTitle: "Pamamahala ng Inventory at Shelf Barcodes",
        bannerDesc: "I-check ang lahat ng gamot sa istante, silipin ang bawat batch, at mag-print ng shelf barcode stickers para sa mga kahon at drawer.",
        steps: [
          {
            title: "1. Mag-search at Mag-filter ng Stock",
            desc: "I-browse ang full catalog. Gamitin ang filter buttons sa taas para makita ang All, In Stock, Low Stock (mga paubos na kailangan nang i-order), o Expired."
          },
          {
            title: "2. I-click ang Gamot para Makakita ng Batches",
            desc: "I-click ang kahit anong medicine row para bumukas ang batch table nito. Makikita mo ang batch number, expiration date, natitirang piraso, at DR number."
          },
          {
            title: "3. Mag-print ng Barcode Stickers para sa Istante",
            desc: "Para sa mga ni-repack na gamot o mga kahon na walang barcode, i-click ang Barcode icon sa tabi ng gamot para mag-print ng malinaw na Code 128 sticker na ididikit sa istante."
          },
          {
            title: "4. Physical Inventory Recounts (Stock Adjustment)",
            desc: "Kapag nag-count kayo sa istante at may discrepancy, i-click ang 'Stock Adjustment'. Ilagay ang totoong physical count at maglagay ng maikling reason."
          }
        ],
        ctaText: "Pumunta sa Inventory View",
        ctaTarget: "inventory"
      },
      ui_modes: {
        id: "ui_modes",
        title: "Clean Mode at Language Switch",
        sub: "Simple UI at Multi-Tab Sync",
        bannerTitle: "Display Modes, Wika at Multi-Tab Sync",
        bannerDesc: "Gawing simple ang screen kapag dagsaan ang pasyente, magpalit ng wika anumang oras, at panatilihing updated ang maraming bukas na tab.",
        steps: [
          {
            title: "1. Clean Mode para sa Rush Hours",
            desc: "Sa Settings, pwede mong i-on ang 'Clean Mode'. 4 na basic tabs lang ang ipapakita (Dashboard, Dispense, Stock-In, Inventory) para iwas kalat at iwas pindot sa oras ng dagsaan ng customer."
          },
          {
            title: "2. Magpalit ng Wika (English, Filipino, Taglish)",
            desc: "I-click ang Globe icon sa upper right corner anytime. Pwede kang pumili ng English, Filipino (formal Tagalog), o Taglish (natural na usapang botika). 100% offline itong gumagana."
          },
          {
            title: "3. Automatic Multi-Tab Sync",
            desc: "Kung may 2 o 3 tabs na nakabukas sa laptop ninyo, anumang benta o delivery na na-record sa Tab 1 ay agad ding magre-reflect sa Tab 2 nang hindi na kailangang mag-refresh."
          }
        ],
        ctaText: "Buksan ang Settings",
        ctaTarget: "settings"
      },
      expired: {
        id: "expired",
        title: "Expired Medicine Lockout",
        sub: "Strict Safety Quarantine",
        bannerTitle: "Strict Safety Rule: Bawal Ibenta ang Expired na Gamot",
        bannerDesc: "Para sa kaligtasan ng mga pasyente at pagsunod sa regulasyon, STRICTLY BLOCKED at hinding-hindi pwedeng ibenta ang pasong gamot.",
        steps: [
          {
            title: "1. Automatic System Lockout",
            desc: "Kapag sumapit na ang expiration date ng gamot (0 days left o lagpas na sa petsa), automatic itong i-lo-lockout ng system. Hindi ito papayagang ma-add sa cart o ma-issue sa resibo."
          },
          {
            title: "2. Alisin sa Istante (Quarantine)",
            desc: "Agad na tanggalin ang expired box mula sa retail shelf. Ilipat ito sa designated 'Quarantine / For Disposal' container o cabinet sa inyong pharmacy."
          },
          {
            title: "3. I-record ang Disposal sa System",
            desc: "Sa Inventory tab, hanapin ang expired batch at i-click ang red Trash (Disposal) button. I-record kung paano ito itinapon (hal. ibinalik sa supplier o sinira) at kung sino ang witness. Permanent record ito para sa regulatory audits."
          }
        ],
        ctaText: "Tingnan ang Expired Stock",
        ctaTarget: "inventory"
      },
      alerts: {
        id: "alerts",
        title: "Expiry Countdown Color Tiers",
        sub: "Color Warnings at Overrides",
        bannerTitle: "Mga Kulay ng Countdown sa Expiration Date",
        bannerDesc: "May color badge ang bawat batch para alam agad ng counter staff kung anong gamot ang dapat unahing i-dispense.",
        steps: [
          {
            title: "Safe (> 180 Days / Green)",
            desc: "Mahigit 6 na buwan pa ang shelf life. Ibenta normally nang walang prompt."
          },
          {
            title: "Monitor (91–180 Days / Blue)",
            desc: "3 hanggang 6 na buwan ang natitira. Good condition. Mino-monitor ng system ang bilis ng benta."
          },
          {
            title: "Warning (31–90 Days / Yellow)",
            desc: "1 hanggang 3 buwan na lang. Malapit nang mag-expire. May lalabas na confirmation prompt kapag pinili para ma-double check ng staff."
          },
          {
            title: "Critical (1–30 Days / Red)",
            desc: "Less than 30 days na lang! Urgent priority na maunang ma-dispense bago mag-expire. Requires confirmation bago ma-checkout."
          },
          {
            title: "Paano kung humingi ng mas malayong expiry ang customer?",
            desc: "Kung nag-request ang customer ng mas malayong expiry (halimbawa, para sa biyahe sa ibang bansa), pwede mong piliin ang mas bagong batch. Magtatanong ang system ng maikling override reason at ilalagay ito sa audit trail."
          }
        ],
        ctaText: "Tingnan ang Alerts sa Dashboard",
        ctaTarget: "dashboard"
      },
      backup_exit: {
        id: "backup_exit",
        title: "Daily USB Backup at Safe Exit",
        sub: "Ligtas na Pagsara ng System",
        bannerTitle: "Daily USB Backup at Pagsara ng Workstation",
        bannerDesc: "Ingatan ang inyong pharmacy data bago magsara sa gabi gamit ang 1-click USB backup.",
        steps: [
          {
            title: "1. Isaksak ang Clinic USB Flash Drive",
            desc: "Bago magsara ng botika araw-araw, isaksak ang nakatalagang pharmacy USB flash drive sa computer."
          },
          {
            title: "2. I-click ang 'Exit Workstation'",
            desc: "I-click ang user icon sa bandang kanan sa itaas, o i-click ang Exit button sa screen."
          },
          {
            title: "3. Piliin ang Inyong USB Drive",
            desc: "I-de-detect ng computer ang inyong USB drive (halimbawa, Drive E: o F:). Siguraduhing napili ang tamang drive."
          },
          {
            title: "4. I-click ang 'Backup to USB & Exit'",
            desc: "I-click ang backup button. Automatic na gagawa ng complete backup ang system sa inyong USB drive at ligtas na ipapasara ang buong application at server."
          }
        ],
        ctaText: "Buksan ang Exit Window",
        ctaTarget: "exit"
      }
    },
    v2: {
      fefo_intelligence: {
        id: "fefo_intelligence",
        title: "FEFO+ Smart Demand Forecasting",
        sub: "Araw-araw na Benta at Waste Prevention",
        bannerTitle: "Paano Pinipigilan ng FEFO+ ang Tapong Gamot",
        bannerDesc: "Ang basic FEFO ay tumitingin lang sa expiration date. Ang FEFO+ ay sinusukat din ang daily sales speed para mag-warning bago pa mag-expire ang gamot sa shelf.",
        steps: [
          {
            title: "1. Bilis ng Araw-araw na Benta (Daily Demand)",
            desc: "Sinusukat ng system kung ilang pieces ng bawat gamot ang nabebenta kada araw sa nakaraang 10, 20, o 30 days (naka-configure sa Settings)."
          },
          {
            title: "2. Pagtataya kung Mauubos Bago Mag-expire",
            desc: "Ikinukumpara ng system ang natitirang stock sa bilis ng benta: 'Sa current sales rate natin, mauubos ba natin ang batch na ito bago sumapit ang expiration date?'"
          },
          {
            title: "3. Pag-flag sa mga 'At-Risk' Batches",
            desc: "Kung may 60 pieces ka ng gamot na mag-eexpire sa loob ng 20 days, pero 1 piece lang ang nabebenta kada araw, mga 40 pieces ang posibleng mapaso. I-fa-flag ito ng system as 'At-Risk' para maagapan agad."
          },
          {
            title: "4. Clearance Pricing at Priority Dispensing",
            desc: "Sa FEFO+ Risk tab, makakakita ka ng suggested clearance discounts para mas mabilis maibenta ang mga gamot na malapit nang mag-expire nang may proteksyon pa rin sa puhunan."
          }
        ],
        ctaText: "Pumunta sa FEFO+ Risk View",
        ctaTarget: "fefo-plus"
      },
      po_procurement: {
        id: "po_procurement",
        title: "Purchase Orders at Suppliers",
        sub: "Pag-reorder at Delivery Receiving",
        bannerTitle: "Workflow ng Purchase Orders at Supplier Deliveries",
        bannerDesc: "Madaling gumawa ng official purchase orders para sa mga paubos na gamot, ipadala sa distributors, at i-receive ang delivery diretso sa stock.",
        steps: [
          {
            title: "1. I-check ang Low-Stock Recommendations",
            desc: "Sa Purchase Orders o FEFO+ Risk tab, ililista ng system ang lahat ng gamot na bumaba na sa kanilang reorder threshold."
          },
          {
            title: "2. Gumawa ng Auto-Draft Order",
            desc: "I-click ang 'Bulk Draft Purchase Orders'. Ipu-pangkat ng system ang mga kailangang gamot ayon sa supplier (hal. Unilab, Zuellig). Pwede mong i-adjust ang quantity o tanggalin ang hindi pa kailangan."
          },
          {
            title: "3. Mag-print ng Opisyal na PO Voucher",
            desc: "Buksan ang order at i-click ang 'Print PO Slip'. Makakagawa ito ng professional order form na may header ng botika at signature lines para ibigay sa ahente ng supplier."
          },
          {
            title: "4. I-receive ang Delivery nang 1-Click",
            desc: "Kapag dumating ang delivery, buksan ang PO at i-click ang 'Receive Delivery'. Ilagay lang ang batch number at expiration date mula sa kahon. Automatic nang malilikha ang mga bagong batch sa inyong inventory!"
          }
        ],
        ctaText: "Pumunta sa Purchase Orders",
        ctaTarget: "purchase-orders"
      },
      audit_compliance: {
        id: "audit_compliance",
        title: "Audit Trail at Regulatory Compliance",
        sub: "Permanent Ledger para sa FDA at DOH",
        bannerTitle: "Tamper-Evident Audit Trail para sa FDA at DOH Inspections",
        bannerDesc: "Bawat critical action sa botika ay permanently recorded para sumunod sa requirements ng Philippine FDA at Department of Health.",
        steps: [
          {
            title: "1. Automatic Activity Logging",
            desc: "Bawat user login, benta ng gamot, manual batch override, price adjustment, at inventory recount ay automatic na naitatala kasama ang pangalan ng staff, petsa, at exact timestamp."
          },
          {
            title: "2. Permanent at Tamper-Evident",
            desc: "Nakasulat ang logs sa isang permanent database ledger na hindi pwedeng i-edit, baguhin, o burahin ng kahit sinong staff o user."
          },
          {
            title: "3. 1-Click CSV Export para sa Inspeksyon",
            desc: "Kapag bumisita ang FDA o DOH inspectors, pumunta lang sa Audit Trail tab at i-click ang 'Export to CSV'. Magda-download agad ito ng kumpletong spreadsheet na handang i-present sa inspection."
          }
        ],
        ctaText: "Pumunta sa Audit Trail",
        ctaTarget: "audit"
      },
      simulation_engine: {
        id: "simulation_engine",
        title: "Policy Simulation at Forecasting",
        sub: "FIFO vs FEFO vs FEFO+",
        bannerTitle: "Scientific Policy Simulation: FIFO vs FEFO vs FEFO+",
        bannerDesc: "I-test at ikumpara kung paano gumagana ang iba't ibang dispensing rules sa loob ng 30 hanggang 180 days gamit ang simulated customer demand.",
        steps: [
          {
            title: "1. FIFO (First-In, First-Out)",
            desc: "Inuunang ibenta ang unang nadeliver kahit ano ang expiry date. Ito ang nagdudulot ng pinakamataas na expired waste dahil naiiwan sa ilalim ang mga lumang batch."
          },
          {
            title: "2. Standard FEFO (First-Expiry, First-Out)",
            desc: "Inuunang ibenta ang pinakamalapit mag-expire. Maganda, pero hindi nito tinitingnan ang bilis ng benta sa hinaharap."
          },
          {
            title: "3. FEFO+ (Smart Demand-Aware)",
            desc: "Pinagsasama ang expiration date sa bilis ng benta at safety stock buffers. Nababawasan nito ang expired medicine waste nang hanggang 80% habang iniiwasan ang biglaang stockout."
          },
          {
            title: "4. 100% Ligtas (Walang Bawas sa Tunay na Stock)",
            desc: "Tumatakbo ang simulation purely sa temporary memory. Hinding-hindi nito babaguhin o buburahin ang inyong actual medicines at sales sa active database."
          }
        ],
        ctaText: "Pumunta sa Simulation View",
        ctaTarget: "simulation"
      },
      disaster_recovery: {
        id: "disaster_recovery",
        title: "Database Backup at Disaster Recovery",
        sub: "Safe Restore at Emergency Tool",
        bannerTitle: "Database Safety, Backups at Disaster Recovery",
        bannerDesc: "Paano ligtas na ibabalik ang inyong records kung sakaling magkaproblema ang computer o kailanganing mag-restore ng lumang kopya.",
        steps: [
          {
            title: "1. Automatic Safety Snapshot Bago Mag-Restore",
            desc: "Sa tuwing mag-re-restore ka ng database backup, automatic na gagawa muna ang system ng safety snapshot ng current data ninyo. Hindi ka aksidenteng mawawalan ng bagong records!"
          },
          {
            title: "2. Pag-restore Gamit ang Settings Screen",
            desc: "Sa Settings under 'Database Backup & Recovery', makikita ang listahan ng past backups. Piliin ang date na gusto mo, i-type ang administrator password, at i-click ang Restore."
          },
          {
            title: "3. Emergency Command-Line Tool (restore.js)",
            desc: "Kung nagka-brownout at ayaw bumukas ng browser, buksan lang ang PowerShell sa app folder at i-run ang: .\\runtime\\node.exe server\\restore.js para sa mabilisang interactive recovery menu."
          }
        ],
        ctaText: "Pumunta sa Settings Backup Panel",
        ctaTarget: "settings"
      }
    }
  }
};

/**
 * Returns help guide data for the requested language code, falling back to 'en'.
 */
export function getHelpGuideData(lang) {
  const code = (lang || 'en').toLowerCase();
  if (code.startsWith('fil') || code.startsWith('tl')) {
    return helpGuideData.fil;
  }
  if (code.startsWith('tag') || code.includes('taglish')) {
    return helpGuideData.taglish;
  }
  return helpGuideData.en;
}
