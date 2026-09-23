// Client-side offline i18n dictionary
// Supports: English (default), Simple Filipino (Pormal na Tagalog), and Taglish (Conversational pharmacy Tagalog-English mix)

export const translations = {
  en: {
    // Brand & Header
    app_title: "R.K.A PHARMACY",
    app_subtitle: "Clinic Pharmacy Supplies with Automated Stock Alert & Expiration Tracking",
    workstation_tag: "Workstation Mode",
    operator_label: "Operator",

    // Navigation Tabs
    nav_dashboard: "Dashboard",
    nav_inventory: "Inventory",
    nav_stock_in: "Stock-In",
    nav_purchase_orders: "Purchase Orders",
    nav_dispense: "Dispense",
    nav_fefo_risk: "FEFO+ Risk",
    nav_audit_trail: "Audit Trail",
    nav_simulation: "Simulation",
    nav_settings: "Settings",

    // Quick Actions & Buttons
    btn_scan_f2: "Scan (F2)",
    btn_how_to_use: "How to Use",
    btn_exit: "Exit",
    btn_logout: "Log Out",
    btn_add_medicine: "Add Medicine Profile",
    btn_complete_dispense: "Complete Dispense",
    btn_confirm: "Confirm",
    btn_cancel: "Cancel",
    btn_save: "Save",
    btn_apply: "Apply",
    btn_export_csv: "Export to CSV",
    btn_print_receipt: "Print Receipt",
    btn_print_po_slip: "Print PO Slip",
    btn_print_labels: "Print Barcode Labels",
    btn_backup_usb: "Backup to USB",
    btn_accept_suggested: "Accept Suggested",
    btn_accept_all_draft_po: "Accept All Suggested / Bulk Draft PO",
    btn_create_po: "Create Purchase Order",
    btn_place_order: "Place Order",
    btn_receive_delivery: "Receive Delivery",
    btn_cancel_order: "Cancel Order",
    btn_load_benchmark: "Load Benchmark Multi-Batch Scenario",
    btn_run_simulation: "Run Simulation",
    btn_low_stock_only: "Low Stock Only",
    btn_all_items: "All Items",
    btn_clear_filter: "Clear Filter",

    // Expiry Countdown Tiers & Badges
    tier_safe: "Safe (>180d)",
    tier_monitor: "Monitor (91-180d)",
    tier_warning: "Warning (31-90d)",
    tier_critical: "Critical (1-30d)",
    tier_expired: "Expired (Blocked)",
    badge_at_risk: "At-Risk",
    badge_low_stock: "Low Stock",
    badge_out_of_stock: "Out of Stock",
    badge_fefo_active: "FEFO Engine Active",

    // Status & Modals
    modal_exit_title: "Exit Workstation",
    modal_login_title: "Workstation Lock Screen",
    modal_confirm_release_title: "Review Expiry Status Before Release",
    modal_override_title: "Override Standard FEFO Sequence",
    modal_add_med_title: "Register New Medicine Profile",
    modal_receive_delivery_title: "Receive Order Delivery",
    toast_po_created: "Draft Purchase Order created successfully!",
    toast_settings_saved: "Settings updated successfully!",
    toast_backup_success: "Database backup completed successfully!",

    // Quick date pills
    pill_plus_6m: "+6 Mos",
    pill_plus_1y: "+1 Yr",
    pill_plus_2y: "+2 Yrs",
    pill_plus_3y: "+3 Yrs",

    // Exit Dialog
    exit_dialog_title: "Exit Confirmation",
    exit_dialog_desc: "Closing the application will end the active counter session. Please ensure all pending transactions or receiving records are completed.",
    exit_backup_btn: "Backup to USB & Exit",
    exit_now_btn: "Exit Without Backup",
    exit_cancel_btn: "Cancel (Stay in App)"
  },

  fil: {
    // Brand & Header
    app_title: "R.K.A BOTIKA",
    app_subtitle: "Kagamitan sa Botika ng Klinika na may Awtomatikong Alerto sa Stock at Pagtukoy ng Paso",
    workstation_tag: "Modo ng Istasyon",
    operator_label: "Tagapangasiwa",

    // Navigation Tabs
    nav_dashboard: "Talaarawan",
    nav_inventory: "Imbentaryo",
    nav_stock_in: "Pasok na Gamot",
    nav_purchase_orders: "Mga Purchase Order",
    nav_dispense: "Mag-dispense",
    nav_fefo_risk: "Panganib sa Expiry",
    nav_audit_trail: "Talaan ng Audit",
    nav_simulation: "Simulasyon",
    nav_settings: "Mga Setting",

    // Quick Actions & Buttons
    btn_scan_f2: "I-scan (F2)",
    btn_how_to_use: "Gabay sa Paggamit",
    btn_exit: "Umalis",
    btn_logout: "Mag-log Out",
    btn_add_medicine: "Magdagdag ng Gamot",
    btn_complete_dispense: "Tapusin ang Pag-dispense",
    btn_confirm: "Kumpirmahin",
    btn_cancel: "Kanselahin",
    btn_save: "I-save",
    btn_apply: "Ilapat",
    btn_export_csv: "I-export sa CSV",
    btn_print_receipt: "I-print ang Resibo",
    btn_print_po_slip: "I-print ang PO Slip",
    btn_print_labels: "I-print ang mga Label",
    btn_backup_usb: "Mag-backup sa USB",
    btn_accept_suggested: "Tanggapin ang Mungkahi",
    btn_accept_all_draft_po: "Tanggapin Lahat / Gumawa ng Draft PO",
    btn_create_po: "Gumawa ng Purchase Order",
    btn_place_order: "Ipadala ang Order",
    btn_receive_delivery: "Tanggapin ang Delivery",
    btn_cancel_order: "Kanselahin ang Order",
    btn_load_benchmark: "I-load ang Benchmark Multi-Batch Scenario",
    btn_run_simulation: "Patakbuhin ang Simulasyon",
    btn_low_stock_only: "Mababang Stock Lamang",
    btn_all_items: "Lahat ng Gamot",
    btn_clear_filter: "Alisin ang Filter",

    // Expiry Countdown Tiers & Badges
    tier_safe: "Ligtas (>180 araw)",
    tier_monitor: "Bantayan (91-180 araw)",
    tier_warning: "Babala (31-90 araw)",
    tier_critical: "Kritikal (1-30 araw)",
    tier_expired: "Paso na (Bawal)",
    badge_at_risk: "Nanganganib Mapaso",
    badge_low_stock: "Mababang Stock",
    badge_out_of_stock: "Ubos na Stock",
    badge_fefo_active: "Aktibo ang FEFO Engine",

    // Status & Modals
    modal_exit_title: "Umalis sa Sistema",
    modal_login_title: "Kandado ng Istasyon",
    modal_confirm_release_title: "Suriin ang Katayuan Bago Ilabas",
    modal_override_title: "I-override ang Pagkakasunod-sunod ng FEFO",
    modal_add_med_title: "Magrehistro ng Bagong Gamot",
    modal_receive_delivery_title: "Pagtanggap ng Delivery ng Order",
    toast_po_created: "Matagumpay na nagawa ang Draft Purchase Order!",
    toast_settings_saved: "Matagumpay na na-update ang mga setting!",
    toast_backup_success: "Matagumpay ang pag-backup ng database!",

    // Quick date pills
    pill_plus_6m: "+6 Buwan",
    pill_plus_1y: "+1 Taon",
    pill_plus_2y: "+2 Taon",
    pill_plus_3y: "+3 Taon",

    // Exit Dialog
    exit_dialog_title: "Kumpirmasyon sa Pag-alis",
    exit_dialog_desc: "Ang pagsasara ng application ay magtatapos sa aktibong sesyon sa counter. Pakitiyak na ang lahat ng transaksyon o tala ng delivery ay nai-save na.",
    exit_backup_btn: "Mag-backup sa USB at Umalis",
    exit_now_btn: "Umalis Nang Walang Backup",
    exit_cancel_btn: "Kanselahin (Manatili)"
  },

  taglish: {
    // Brand & Header
    app_title: "R.K.A PHARMACY",
    app_subtitle: "Clinic Supplies IMS with Stock Alert & Expiration Tracking",
    workstation_tag: "Counter Mode",
    operator_label: "Pharmacist on Duty",

    // Navigation Tabs
    nav_dashboard: "Dashboard",
    nav_inventory: "Inventory",
    nav_stock_in: "Stock-In (Pasok)",
    nav_purchase_orders: "Purchase Orders",
    nav_dispense: "Mag-Dispense",
    nav_fefo_risk: "FEFO+ Risk Check",
    nav_audit_trail: "Audit Logs",
    nav_simulation: "Simulation",
    nav_settings: "Settings",

    // Quick Actions & Buttons
    btn_scan_f2: "Scan Barcode (F2)",
    btn_how_to_use: "How to Use Guide",
    btn_exit: "Exit App",
    btn_logout: "Logout",
    btn_add_medicine: "Add Gamot Profile",
    btn_complete_dispense: "Complete Dispense",
    btn_confirm: "Confirm Release",
    btn_cancel: "Cancel",
    btn_save: "Save Changes",
    btn_apply: "Apply",
    btn_export_csv: "Export CSV",
    btn_print_receipt: "Print Resibo",
    btn_print_po_slip: "Print PO Slip",
    btn_print_labels: "Print Barcode Tags",
    btn_backup_usb: "Backup sa Flash Drive",
    btn_accept_suggested: "Accept Reorder Qty",
    btn_accept_all_draft_po: "Accept All / Bulk Draft PO",
    btn_create_po: "New Purchase Order",
    btn_place_order: "Send Order kay Supplier",
    btn_receive_delivery: "Receive Delivery Cartons",
    btn_cancel_order: "Cancel itong Order",
    btn_load_benchmark: "Load Benchmark Multi-Batch Scenario",
    btn_run_simulation: "Run Policy Simulation",
    btn_low_stock_only: "Low Stock Lang",
    btn_all_items: "Lahat ng Gamot",
    btn_clear_filter: "Clear Filters",

    // Expiry Countdown Tiers & Badges
    tier_safe: "Safe (>180d)",
    tier_monitor: "Monitor (91-180d)",
    tier_warning: "Warning (31-90d)",
    tier_critical: "Critical (1-30d)",
    tier_expired: "Expired (Bawal I-release)",
    badge_at_risk: "At-Risk Mapaso",
    badge_low_stock: "Kulang sa Stock",
    badge_out_of_stock: "Out of Stock Na",
    badge_fefo_active: "FEFO Auto-Split Active",

    // Status & Modals
    modal_exit_title: "Exit Workstation",
    modal_login_title: "Workstation Lock Screen",
    modal_confirm_release_title: "Confirm Muna ang Expiry Status",
    modal_override_title: "Override FEFO Batch Sequence",
    modal_add_med_title: "Register Bagong Medicine Profile",
    modal_receive_delivery_title: "Receive Distributor Delivery",
    toast_po_created: "Draft Purchase Order created na!",
    toast_settings_saved: "Settings updated na!",
    toast_backup_success: "Database backup na sa flash drive!",

    // Quick date pills
    pill_plus_6m: "+6 Mos",
    pill_plus_1y: "+1 Taon",
    pill_plus_2y: "+2 Taon",
    pill_plus_3y: "+3 Taon",

    // Exit Dialog
    exit_dialog_title: "Exit Workstation Confirmation",
    exit_dialog_desc: "Maco-close ang pharmacy app counter session. Siguraduhin na na-save ang lahat ng benta o deliveries bago umalis.",
    exit_backup_btn: "Backup muna sa Flash Drive & Exit",
    exit_now_btn: "Exit Agad (No Backup)",
    exit_cancel_btn: "Cancel (Huwag muna)"
  }
};
