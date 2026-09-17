const { db, logAudit } = require('./db');

function seedDatabase() {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM medicines').get().count;
  if (existingCount > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  console.log('Seeding R.K.A Pharmacy database with initial clinic pharmacy supplies...');

  const medicinesData = [
    {
      code: 'MED-001',
      barcode: '4800016641012',
      brand_name: 'Amoxil',
      generic_name: 'Amoxicillin Trihydrate',
      dosage_strength: '500mg',
      dosage_form: 'Capsule',
      category: 'Antibiotic',
      unit_of_measure: 'Capsule',
      reorder_threshold: 50,
      supplier_lead_time_days: 4,
      buffer_days: 3,
      supplier_name: 'United Laboratories (Unilab)',
      description: 'Used for broad-spectrum bacterial infections.'
    },
    {
      code: 'MED-002',
      barcode: '4800016642029',
      brand_name: 'Biogesic',
      generic_name: 'Paracetamol',
      dosage_strength: '500mg',
      dosage_form: 'Tablet',
      category: 'Analgesic / Antipyretic',
      unit_of_measure: 'Tablet',
      reorder_threshold: 100,
      supplier_lead_time_days: 3,
      buffer_days: 4,
      supplier_name: 'United Laboratories (Unilab)',
      description: 'Fast relief for mild-to-moderate fever and headaches.'
    },
    {
      code: 'MED-003',
      barcode: '4800016643036',
      brand_name: 'Ponstan',
      generic_name: 'Mefenamic Acid',
      dosage_strength: '500mg',
      dosage_form: 'Capsule',
      category: 'Analgesic / NSAID',
      unit_of_measure: 'Capsule',
      reorder_threshold: 40,
      supplier_lead_time_days: 5,
      buffer_days: 3,
      supplier_name: 'Pfizer Philippines',
      description: 'Treatment for dental pain, dysmenorrhea, and body aches.'
    },
    {
      code: 'MED-004',
      barcode: '4800016644043',
      brand_name: 'Ceelin Plus',
      generic_name: 'Ascorbic Acid + Zinc',
      dosage_strength: '500mg / 10mg',
      dosage_form: 'Capsule',
      category: 'Vitamins & Supplements',
      unit_of_measure: 'Capsule',
      reorder_threshold: 60,
      supplier_lead_time_days: 3,
      buffer_days: 3,
      supplier_name: 'United Laboratories (Unilab)',
      description: 'Daily immune system defense and antioxidant support.'
    },
    {
      code: 'MED-005',
      barcode: '4800016645050',
      brand_name: 'Neurobion',
      generic_name: 'Vitamin B1 + B6 + B12',
      dosage_strength: '100mg / 200mg / 200mcg',
      dosage_form: 'Tablet',
      category: 'Vitamins & Supplements',
      unit_of_measure: 'Tablet',
      reorder_threshold: 50,
      supplier_lead_time_days: 7,
      buffer_days: 4,
      supplier_name: 'Procter & Gamble Health',
      description: 'Nerve care supplement for peripheral neuropathy and numbness.'
    },
    {
      code: 'MED-006',
      barcode: '4800016646067',
      brand_name: 'Alnix',
      generic_name: 'Cetirizine Dihydrochloride',
      dosage_strength: '10mg',
      dosage_form: 'Tablet',
      category: 'Antihistamine',
      unit_of_measure: 'Tablet',
      reorder_threshold: 40,
      supplier_lead_time_days: 4,
      buffer_days: 3,
      supplier_name: 'United Laboratories (Unilab)',
      description: 'Relief of allergy symptoms, sneezing, allergic rhinitis.'
    },
    {
      code: 'MED-007',
      barcode: '4800016647074',
      brand_name: 'Ventolin',
      generic_name: 'Salbutamol Sulfate',
      dosage_strength: '2mg / 5mL',
      dosage_form: 'Syrup 60mL',
      category: 'Respiratory',
      unit_of_measure: 'Bottle',
      reorder_threshold: 20,
      supplier_lead_time_days: 5,
      buffer_days: 3,
      supplier_name: 'GlaxoSmithKline Philippines',
      description: 'Fast-acting bronchodilator for asthma and bronchospasm.'
    },
    {
      code: 'MED-008',
      barcode: 'RKA-GEN-008-INT',
      brand_name: 'Generic Losartan',
      generic_name: 'Losartan Potassium',
      dosage_strength: '50mg',
      dosage_form: 'Tablet',
      category: 'Cardiovascular',
      unit_of_measure: 'Tablet',
      reorder_threshold: 70,
      supplier_lead_time_days: 5,
      buffer_days: 3,
      supplier_name: 'Ritemed Philippines',
      description: 'Maintenance therapy for essential hypertension.'
    },
    {
      code: 'MED-009',
      barcode: 'RKA-GEN-009-INT',
      brand_name: 'Generic Metformin',
      generic_name: 'Metformin Hydrochloride',
      dosage_strength: '500mg',
      dosage_form: 'Tablet',
      category: 'Antidiabetic',
      unit_of_measure: 'Tablet',
      reorder_threshold: 80,
      supplier_lead_time_days: 5,
      buffer_days: 3,
      supplier_name: 'Ritemed Philippines',
      description: 'First-line medication for type 2 diabetes mellitus.'
    },
    {
      code: 'MED-010',
      barcode: '4800016650109',
      brand_name: 'Augmentin',
      generic_name: 'Co-Amoxiclav (Amoxicillin + Clavulanate)',
      dosage_strength: '625mg',
      dosage_form: 'Tablet',
      category: 'Antibiotic',
      unit_of_measure: 'Tablet',
      reorder_threshold: 30,
      supplier_lead_time_days: 6,
      buffer_days: 3,
      supplier_name: 'GlaxoSmithKline Philippines',
      description: 'Potentiated penicillin for beta-lactamase producing bacteria.'
    }
  ];

  const insertMed = db.prepare(`
    INSERT INTO medicines (
      code, barcode, brand_name, generic_name, dosage_strength, dosage_form,
      category, unit_of_measure, reorder_threshold, supplier_lead_time_days,
      buffer_days, supplier_name, description
    ) VALUES (
      @code, @barcode, @brand_name, @generic_name, @dosage_strength, @dosage_form,
      @category, @unit_of_measure, @reorder_threshold, @supplier_lead_time_days,
      @buffer_days, @supplier_name, @description
    )
  `);

  const insertBatch = db.prepare(`
    INSERT INTO batches (
      medicine_id, batch_number, manufacturing_date, expiration_date,
      initial_quantity, current_quantity, unit_cost, selling_price,
      supplier_name, status, received_date
    ) VALUES (
      @medicine_id, @batch_number, @manufacturing_date, @expiration_date,
      @initial_quantity, @current_quantity, @unit_cost, @selling_price,
      @supplier_name, @status, @received_date
    )
  `);

  const insertTx = db.prepare(`
    INSERT INTO transactions (
      transaction_code, transaction_type, medicine_id, batch_id,
      quantity, unit_price, total_amount, reference_no,
      is_override, override_reason, operator_name, notes, created_at
    ) VALUES (
      @transaction_code, @transaction_type, @medicine_id, @batch_id,
      @quantity, @unit_price, @total_amount, @reference_no,
      @is_override, @override_reason, @operator_name, @notes, @created_at
    )
  `);

  // Helper to get formatted date string offset from today
  const today = new Date();
  function addDays(days) {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  function subDays(days) {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  // Insert medicines and capture their IDs
  const medIds = {};
  for (const m of medicinesData) {
    const res = insertMed.run(m);
    medIds[m.code] = res.lastInsertRowid;
  }

  // Seed batches across different tiers:
  // Safe (>180d), Monitor (91-180d), Warning (31-90d), Critical (1-30d), Expired (<=0d)
  const batchesData = [
    // Amoxicillin 500mg
    {
      medicine_id: medIds['MED-001'],
      batch_number: 'AMX-2025-01',
      manufacturing_date: subDays(400),
      expiration_date: addDays(25), // Critical tier (1-30d)
      initial_quantity: 100,
      current_quantity: 18,
      unit_cost: 6.50,
      selling_price: 11.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(380)
    },
    {
      medicine_id: medIds['MED-001'],
      batch_number: 'AMX-2025-02',
      manufacturing_date: subDays(200),
      expiration_date: addDays(210), // Safe tier (>180d)
      initial_quantity: 200,
      current_quantity: 140,
      unit_cost: 6.50,
      selling_price: 11.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(180)
    },

    // Biogesic (Paracetamol) - Fast moving item
    {
      medicine_id: medIds['MED-002'],
      batch_number: 'BIO-24A08',
      manufacturing_date: subDays(300),
      expiration_date: addDays(55), // Warning tier (31-90d)
      initial_quantity: 300,
      current_quantity: 45,
      unit_cost: 3.20,
      selling_price: 6.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(280)
    },
    {
      medicine_id: medIds['MED-002'],
      batch_number: 'BIO-25C12',
      manufacturing_date: subDays(90),
      expiration_date: addDays(360), // Safe tier (>180d)
      initial_quantity: 500,
      current_quantity: 380,
      unit_cost: 3.20,
      selling_price: 6.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(70)
    },

    // Ponstan (Mefenamic Acid)
    {
      medicine_id: medIds['MED-003'],
      batch_number: 'PON-8831',
      manufacturing_date: subDays(500),
      expiration_date: subDays(10), // EXPIRED! Blocked from dispensing!
      initial_quantity: 50,
      current_quantity: 8,
      unit_cost: 14.00,
      selling_price: 24.00,
      supplier_name: 'Pfizer Philippines',
      status: 'expired',
      received_date: subDays(480)
    },
    {
      medicine_id: medIds['MED-003'],
      batch_number: 'PON-9102',
      manufacturing_date: subDays(120),
      expiration_date: addDays(110), // Monitor tier (91-180d)
      initial_quantity: 100,
      current_quantity: 62,
      unit_cost: 14.00,
      selling_price: 24.00,
      supplier_name: 'Pfizer Philippines',
      status: 'active',
      received_date: subDays(100)
    },

    // Ceelin Plus (Ascorbic Acid + Zinc)
    {
      medicine_id: medIds['MED-004'],
      batch_number: 'CLN-2025-09',
      manufacturing_date: subDays(150),
      expiration_date: addDays(140), // Monitor tier (91-180d)
      initial_quantity: 200,
      current_quantity: 110,
      unit_cost: 7.00,
      selling_price: 12.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(130)
    },

    // Neurobion (Vitamin B-Complex) - Low sales velocity, negative Expiry Risk Margin!
    // Current stock: 120 tablets, sales velocity ~1 tablet/day, expires in 45 days -> ERM = 45 - 120 = -75 days! (High Waste Risk!)
    {
      medicine_id: medIds['MED-005'],
      batch_number: 'NEU-BATCH-04',
      manufacturing_date: subDays(320),
      expiration_date: addDays(45), // Warning tier (31-90d)
      initial_quantity: 150,
      current_quantity: 120,
      unit_cost: 18.00,
      selling_price: 28.00,
      supplier_name: 'Procter & Gamble Health',
      status: 'active',
      received_date: subDays(300)
    },

    // Alnix (Cetirizine 10mg) - Low stock item! (Total 18 pcs, threshold is 40 pcs)
    {
      medicine_id: medIds['MED-006'],
      batch_number: 'ALN-7741',
      manufacturing_date: subDays(200),
      expiration_date: addDays(80), // Warning tier (31-90d)
      initial_quantity: 100,
      current_quantity: 18,
      unit_cost: 8.50,
      selling_price: 15.00,
      supplier_name: 'United Laboratories (Unilab)',
      status: 'active',
      received_date: subDays(190)
    },

    // Ventolin Syrup - Slow moving, high waste risk!
    // 22 bottles remaining, sales ~ 0.2 bottles/day, expires in 40 days -> Days to consume = 110d -> ERM = 40 - 110 = -70 days!
    {
      medicine_id: medIds['MED-007'],
      batch_number: 'VEN-SYR-09',
      manufacturing_date: subDays(300),
      expiration_date: addDays(40), // Warning tier (31-90d)
      initial_quantity: 30,
      current_quantity: 22,
      unit_cost: 85.00,
      selling_price: 135.00,
      supplier_name: 'GlaxoSmithKline Philippines',
      status: 'active',
      received_date: subDays(290)
    },

    // Generic Losartan 50mg - High volume maintenance medicine
    {
      medicine_id: medIds['MED-008'],
      batch_number: 'LOS-2025-X1',
      manufacturing_date: subDays(150),
      expiration_date: addDays(75), // Warning tier (31-90d)
      initial_quantity: 200,
      current_quantity: 30,
      unit_cost: 4.00,
      selling_price: 8.50,
      supplier_name: 'Ritemed Philippines',
      status: 'active',
      received_date: subDays(140)
    },
    {
      medicine_id: medIds['MED-008'],
      batch_number: 'LOS-2025-X2',
      manufacturing_date: subDays(40),
      expiration_date: addDays(270), // Safe tier (>180d)
      initial_quantity: 300,
      current_quantity: 250,
      unit_cost: 4.00,
      selling_price: 8.50,
      supplier_name: 'Ritemed Philippines',
      status: 'active',
      received_date: subDays(30)
    },

    // Generic Metformin 500mg
    {
      medicine_id: medIds['MED-009'],
      batch_number: 'MET-500-A',
      manufacturing_date: subDays(180),
      expiration_date: addDays(160), // Monitor tier (91-180d)
      initial_quantity: 250,
      current_quantity: 135,
      unit_cost: 2.80,
      selling_price: 5.50,
      supplier_name: 'Ritemed Philippines',
      status: 'active',
      received_date: subDays(170)
    },

    // Augmentin 625mg
    {
      medicine_id: medIds['MED-010'],
      batch_number: 'AUG-625-K',
      manufacturing_date: subDays(100),
      expiration_date: addDays(220), // Safe tier (>180d)
      initial_quantity: 60,
      current_quantity: 42,
      unit_cost: 32.00,
      selling_price: 52.00,
      supplier_name: 'GlaxoSmithKline Philippines',
      status: 'active',
      received_date: subDays(90)
    }
  ];

  const batchIds = {};
  for (const b of batchesData) {
    const res = insertBatch.run(b);
    batchIds[b.batch_number] = res.lastInsertRowid;
  }

  // Seed realistic historical stock-out transactions across the past 35 days
  // This establishes the Average Daily Quantity Sold (ADQS) for FEFO+ calculations!
  console.log('Generating 35-day transaction history for consumption-based FEFO+ evaluation...');

  const transactionList = [];
  let txCounter = 1000;

  // Paracetamol (MED-002) - high sales (~12-15/day)
  for (let d = 35; d >= 1; d--) {
    const qty = Math.floor(Math.random() * 8) + 10; // 10 - 17 units/day
    transactionList.push({
      transaction_code: `TX-${++txCounter}`,
      transaction_type: 'stock_out',
      medicine_id: medIds['MED-002'],
      batch_id: batchIds['BIO-24A08'],
      quantity: qty,
      unit_price: 6.00,
      total_amount: qty * 6.00,
      reference_no: `RCPT-${202600 + txCounter}`,
      is_override: 0,
      override_reason: null,
      operator_name: 'Lourdes Gincen L. Cesista',
      notes: 'Direct clinic dispensing',
      created_at: `${subDays(d)} 10:${Math.floor(Math.random()*50)+10}:00`
    });
  }

  // Amoxicillin (MED-001) - medium sales (~5-7/day)
  for (let d = 35; d >= 1; d -= 2) {
    const qty = Math.floor(Math.random() * 6) + 8; // 8 - 13 units every 2 days
    transactionList.push({
      transaction_code: `TX-${++txCounter}`,
      transaction_type: 'stock_out',
      medicine_id: medIds['MED-001'],
      batch_id: batchIds['AMX-2025-01'],
      quantity: qty,
      unit_price: 11.00,
      total_amount: qty * 11.00,
      reference_no: `RCPT-${202600 + txCounter}`,
      is_override: 0,
      override_reason: null,
      operator_name: 'Lourdes Gincen L. Cesista',
      notes: 'Patient prescription dispense',
      created_at: `${subDays(d)} 14:${Math.floor(Math.random()*50)+10}:00`
    });
  }

  // Neurobion (MED-005) - low sales (~0.8-1/day)
  for (let d = 35; d >= 1; d -= 3) {
    const qty = Math.floor(Math.random() * 2) + 2; // 2-3 units every 3 days
    transactionList.push({
      transaction_code: `TX-${++txCounter}`,
      transaction_type: 'stock_out',
      medicine_id: medIds['MED-005'],
      batch_id: batchIds['NEU-BATCH-04'],
      quantity: qty,
      unit_price: 28.00,
      total_amount: qty * 28.00,
      reference_no: `RCPT-${202600 + txCounter}`,
      is_override: 0,
      override_reason: null,
      operator_name: 'Lourdes Gincen L. Cesista',
      notes: 'Over-the-counter vitamin sale',
      created_at: `${subDays(d)} 11:${Math.floor(Math.random()*50)+10}:00`
    });
  }

  // Ventolin Syrup (MED-007) - slow moving (~0.2/day)
  for (let d = 30; d >= 5; d -= 7) {
    const qty = 1;
    transactionList.push({
      transaction_code: `TX-${++txCounter}`,
      transaction_type: 'stock_out',
      medicine_id: medIds['MED-007'],
      batch_id: batchIds['VEN-SYR-09'],
      quantity: qty,
      unit_price: 135.00,
      total_amount: qty * 135.00,
      reference_no: `RCPT-${202600 + txCounter}`,
      is_override: 0,
      override_reason: null,
      operator_name: 'Lourdes Gincen L. Cesista',
      notes: 'Asthma pediatric syrup',
      created_at: `${subDays(d)} 15:30:00`
    });
  }

  // Losartan (MED-008) - steady maintenance (~6-8/day)
  for (let d = 35; d >= 1; d--) {
    const qty = Math.floor(Math.random() * 4) + 5;
    transactionList.push({
      transaction_code: `TX-${++txCounter}`,
      transaction_type: 'stock_out',
      medicine_id: medIds['MED-008'],
      batch_id: batchIds['LOS-2025-X1'],
      quantity: qty,
      unit_price: 8.50,
      total_amount: qty * 8.50,
      reference_no: `RCPT-${202600 + txCounter}`,
      is_override: 0,
      override_reason: null,
      operator_name: 'Lourdes Gincen L. Cesista',
      notes: 'Monthly maintenance medication',
      created_at: `${subDays(d)} 09:15:00`
    });
  }

  // Add 1 sample User Override transaction (to show audit trail tracking)
  transactionList.push({
    transaction_code: `TX-${++txCounter}`,
    transaction_type: 'stock_out',
    medicine_id: medIds['MED-008'],
    batch_id: batchIds['LOS-2025-X2'], // Not the earliest batch
    quantity: 10,
    unit_price: 8.50,
    total_amount: 85.00,
    reference_no: `RCPT-${202600 + txCounter}`,
    is_override: 1,
    override_reason: 'Customer specifically requested factory sealed blister box from newer shipment batch LOS-2025-X2',
    operator_name: 'Lourdes Gincen L. Cesista',
    notes: 'FEFO Override approved by owner',
    created_at: `${subDays(3)} 16:45:00`
  });

  // Insert all transactions
  const insertManyTx = db.transaction((txs) => {
    for (const tx of txs) {
      insertTx.run(tx);
    }
  });
  insertManyTx(transactionList);

  // Log system initialization in audit trail
  logAudit(
    'SYSTEM_INIT',
    'SYSTEM',
    'RKA-PHARMACY',
    'System initialized with baseline inventory, multi-tier batches, and 35-day historical movement ledger for R.K.A Pharmacy.'
  );

  console.log('Seed completed successfully!');
}

module.exports = {
  seedDatabase
};

if (require.main === module) {
  seedDatabase();
}
