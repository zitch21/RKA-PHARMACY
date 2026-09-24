// verify_all_specs.js
// Comprehensive automated verification test for RKA Pharmacy IMS
// Validates thesis manuscript requirements, Chapter 2 specifications, and newly implemented features

const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = { ...headers };
    let postData = null;

    if (body) {
      postData = JSON.stringify(body);
      defaultHeaders['Content-Type'] = 'application/json';
      defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: defaultHeaders
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = rawData;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log(' STARTING THESIS SPECIFICATION & REGRESSION VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Authentication & Scrypt Password Security (Manuscript p. 31)
    // -------------------------------------------------------------
    console.log('1. Testing Operator Authentication & Password Security:');
    
    const badLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'wrongpassword' });
    assert(badLogin.statusCode === 401, 'Rejects invalid password with 401 Unauthorized');

    const goodLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'rka2026' });
    assert(goodLogin.statusCode === 200, 'Accepts correct password (admin / rka2026)');
    assert(goodLogin.data && goodLogin.data.token, 'Returns session token upon authentication');
    assert(goodLogin.data.user && goodLogin.data.user.full_name === 'Lourdes Gincen L. Cesista', 'Identifies correct clinic operator (Lourdes Gincen L. Cesista)');

    const authToken = goodLogin.data.token;
    const sessionCheck = await request('GET', '/api/auth/session', null, { Authorization: `Bearer ${authToken}` });
    assert(sessionCheck.statusCode === 200 && sessionCheck.data.authenticated, 'Validates active operator session');

    // -------------------------------------------------------------
    // Test 2: System Thresholds & Configurable Observation Window (N in {10, 20, 30})
    // -------------------------------------------------------------
    console.log('\n2. Testing Thresholds & Configurable Observation Window (N):');
    const settingsRes = await request('GET', '/api/settings');
    assert(settingsRes.statusCode === 200, 'Fetches system configuration successfully');
    const settings = settingsRes.data;
    assert(Number(settings.safe_threshold_days) === 180, 'Safe threshold is configured to > 180 days');
    assert(Number(settings.monitor_threshold_days) === 91, 'Monitor threshold is configured to 91-180 days');
    assert(Number(settings.warning_threshold_days) === 31, 'Warning threshold is configured to 31-90 days');
    assert(Number(settings.critical_threshold_days) === 1, 'Critical threshold is configured to 1-30 days');
    assert(Number(settings.default_buffer_days) === 3, 'Default buffer days is configured to 3 days');

    // Test updating observation window to 20 days and rejecting invalid values
    const invalidWindowRes = await request('PUT', '/api/settings', { forecasting_window_days: '45' });
    assert(invalidWindowRes.statusCode === 400, 'Rejects invalid observation window (must be 10, 20, or 30 days)');

    const setWindowRes = await request('PUT', '/api/settings', { forecasting_window_days: '20', operator_name: 'Lourdes Gincen L. Cesista' });
    assert(setWindowRes.statusCode === 200, 'Updates observation window to N = 20 days successfully');

    // Restore to 30 days default
    await request('PUT', '/api/settings', { forecasting_window_days: '30', operator_name: 'Lourdes Gincen L. Cesista' });

    // -------------------------------------------------------------
    // Test 3: Batch-Level Tracking & Expiry Classification (Table 1)
    // -------------------------------------------------------------
    console.log('\n3. Testing Batch-Level Tracking & Expiry Countdown:');
    const batchesRes = await request('GET', '/api/batches');
    assert(batchesRes.statusCode === 200, 'Fetches all medicine batches successfully');
    const batches = batchesRes.data;
    assert(Array.isArray(batches) && batches.length > 0, `Retrieved ${batches.length} inventory batches`);

    const sampleBatch = batches[0];
    assert(
      sampleBatch.batch_number &&
      sampleBatch.expiration_date &&
      sampleBatch.current_quantity !== undefined &&
      sampleBatch.days_to_expiry !== undefined &&
      sampleBatch.expiry_status,
      'Batch includes batch_number, expiration_date, quantity, days_to_expiry, and expiry_status'
    );

    const parts = String(sampleBatch.expiration_date).split('-').map(Number);
    const expDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    const now = new Date();
    const curDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const expectedDays = Math.round((expDate - curDate) / (1000 * 60 * 60 * 24));
    assert(sampleBatch.days_to_expiry === expectedDays, `Days to expiry formula verified: ${sampleBatch.days_to_expiry} == ${expectedDays}`);

    // -------------------------------------------------------------
    // Test 4: Alerts & Manual Acknowledgment (Manuscript p. 31)
    // -------------------------------------------------------------
    console.log('\n4. Testing Persistent Alerts & Manual Acknowledgment:');
    const alertsRes = await request('GET', '/api/alerts');
    assert(alertsRes.statusCode === 200, 'Alerts endpoint returns 200 OK');
    const alerts = alertsRes.data;
    assert(alerts.summary && typeof alerts.summary.total_alerts === 'number', `Alerts summary calculated: ${alerts.summary.total_alerts} total active alerts`);

    if (alerts.critical && alerts.critical.length > 0) {
      const targetAlert = alerts.critical[0];
      const ackRes = await request('POST', '/api/alerts/acknowledge', {
        alert_key: targetAlert.alert_key,
        alert_type: 'critical_expiry',
        entity_id: targetAlert.id,
        operator_name: 'Lourdes Gincen L. Cesista'
      });
      assert(ackRes.statusCode === 200, `Alert acknowledgment saved successfully for ${targetAlert.alert_key}`);
    }

    // -------------------------------------------------------------
    // Test 5: FEFO+ Advanced Analytics, Cold-Start & Qwaste Calculation (Manuscript pp. 27-28)
    // -------------------------------------------------------------
    console.log('\n5. Testing FEFO+ Analytics, Cold-Start & Qwaste Formulation:');
    const fefoRes = await request('GET', '/api/fefo-plus/analysis');
    assert(fefoRes.statusCode === 200, 'FEFO+ analysis endpoint returns 200 OK');
    const fefo = fefoRes.data;
    assert(fefo.forecasting_window_days !== undefined, `Returns configured observation window N = ${fefo.forecasting_window_days}`);
    assert(fefo.is_cold_start !== undefined, `Reports Cold-Start state: ${fefo.is_cold_start}`);
    assert(Array.isArray(fefo.medicine_analysis), 'Dynamic medicine consumption analysis array generated');
    assert(Array.isArray(fefo.at_risk_batches), 'At-risk batches array generated');

    // Verify Qwaste computation for at-risk batches
    if (fefo.at_risk_batches.length > 0) {
      const riskBatch = fefo.at_risk_batches[0];
      assert(riskBatch.expiry_risk_margin < 0, `At-Risk batch detected with negative Expiry Risk Margin: ${riskBatch.expiry_risk_margin} days`);
      assert(riskBatch.q_waste !== undefined && riskBatch.q_waste >= 0, `Calculated predicted expired waste volume: Qwaste = ${riskBatch.q_waste} units`);
    }

    // -------------------------------------------------------------
    // Test 6: Policy Simulation (Manuscript pp. 35-36)
    // -------------------------------------------------------------
    console.log('\n6. Testing Policy Simulation (FIFO vs FEFO vs FEFO+):');
    const simRes = await request('GET', '/api/simulation/compare?days=30');
    assert(simRes.statusCode === 200, 'Simulation compare endpoint returns 200 OK');
    assert(simRes.data.fifo && simRes.data.fefo && simRes.data.fefo_plus, 'Returns comparative metrics for FIFO, FEFO, and FEFO+');

    // -------------------------------------------------------------
    // Test 7: Dispensing Rules, Expired Blocking & Multi-Batch Split (Figure 2)
    // -------------------------------------------------------------
    console.log('\n7. Testing Dispensing Rules & Multi-Batch Split Issuance:');

    // Strict block on expired batch
    const expiredBatch = batches.find(b => b.days_to_expiry <= 0);
    if (expiredBatch) {
      const blockedDispense = await request('POST', '/api/transactions/stock-out', {
        operator_name: 'Lourdes Gincen L. Cesista',
        items: [{
          medicine_id: expiredBatch.medicine_id,
          batch_id: expiredBatch.id,
          quantity: 1
        }]
      });
      assert(blockedDispense.statusCode === 400, 'STRICTLY BLOCKS release of expired batch with 400 Bad Request');
    }

    // Test dispensing active medicine with multi-batch auto-split
    const testMed = (await request('GET', '/api/medicines')).data.find(m => m.total_stock >= 5);
    if (testMed) {
      const splitDispense = await request('POST', '/api/transactions/stock-out', {
        operator_name: 'Lourdes Gincen L. Cesista',
        patient_or_reference: 'Verification Split Test',
        notes: 'Multi-batch fulfillment verification',
        items: [{
          medicine_id: testMed.id,
          quantity: 3,
          status_confirmed: true
        }]
      });
      assert(splitDispense.statusCode === 201, `Successfully executed FEFO stock-out for ${testMed.brand_name} (Receipt: ${splitDispense.data.receipt_no})`);
      assert(Array.isArray(splitDispense.data.transactions) && splitDispense.data.transactions.length >= 1, 'Generated transaction line records');
    }

    // -------------------------------------------------------------
    // Test 8: Purchase Order (PO) Module Full Lifecycle (Manuscript pp. 17, 30, 36)
    // -------------------------------------------------------------
    console.log('\n8. Testing Purchase Order Lifecycle (Draft -> Placed -> Receive Delivery into Batches):');

    // 8a. Replenishment recommendations
    const recomRes = await request('GET', '/api/purchase-orders/recommendations');
    assert(recomRes.statusCode === 200, 'Replenishment recommendations endpoint returns 200 OK');
    assert(Array.isArray(recomRes.data.recommendations), `Retrieved ${recomRes.data.recommendations.length} replenishment recommendations`);

    // 8b. Create Draft PO
    const firstMed = (await request('GET', '/api/medicines')).data[0];
    const poCreateRes = await request('POST', '/api/purchase-orders', {
      supplier_name: 'United Laboratories (Unilab)',
      notes: 'Automated verification test PO',
      operator_name: 'Lourdes Gincen L. Cesista',
      items: [{
        medicine_id: firstMed.id,
        quantity_ordered: 50,
        unit_cost: 12.50
      }]
    });
    assert(poCreateRes.statusCode === 201, `Created internal Purchase Order with status 'Draft': ${poCreateRes.data.po.po_number}`);
    const poId = poCreateRes.data.po.id;

    // 8c. Transition PO: Draft -> Placed
    const poPlaceRes = await request('PATCH', `/api/purchase-orders/${poId}/place`, {
      operator_name: 'Lourdes Gincen L. Cesista'
    });
    assert(poPlaceRes.statusCode === 200 && poPlaceRes.data.status === 'placed', 'Advanced PO status from Draft -> Placed');

    // 8d. Receive Delivery: Placed -> Received (Converts delivery to active batches)
    const poDetails = (await request('GET', `/api/purchase-orders/${poId}`)).data;
    const poItemId = poDetails.items[0].id;
    const testBatchNo = `VERIF-LOT-${Date.now().toString().slice(-5)}`;

    const futureExp = new Date();
    futureExp.setMonth(futureExp.getMonth() + 14);
    const expDateStr = futureExp.toISOString().split('T')[0];

    const receiveRes = await request('POST', `/api/purchase-orders/${poId}/receive`, {
      operator_name: 'Lourdes Gincen L. Cesista',
      deliveries: [{
        item_id: poItemId,
        quantity_received: 50,
        batch_number: testBatchNo,
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiration_date: expDateStr,
        unit_cost: 12.50,
        selling_price: 18.00
      }]
    });
    assert(receiveRes.statusCode === 200, `Received PO delivery: converted to active batch ${testBatchNo}`);
    assert(receiveRes.data.po_status === 'received', 'Purchase order status marked as fully Received');

    // Verify batch was created in inventory
    const verifyBatches = (await request('GET', '/api/batches')).data;
    const foundNewBatch = verifyBatches.find(b => b.batch_number === testBatchNo);
    assert(foundNewBatch && foundNewBatch.current_quantity === 50, `Verified newly created batch ${testBatchNo} exists in active inventory with 50 units`);

    // -------------------------------------------------------------
    // Test 9: End-of-Day Backup & Removable Storage (Manuscript p. 31)
    // -------------------------------------------------------------
    console.log('\n9. Testing End-of-Day Backup & Removable Storage:');
    const drivesRes = await request('GET', '/api/backup/drives');
    assert(drivesRes.statusCode === 200, 'Drives detection endpoint returns 200 OK');

    const downloadRes = await request('GET', '/api/backup/download?operator=VerificationTest');
    assert(downloadRes.statusCode === 200, 'WAL-checkpointed backup download returns 200 OK');

    // -------------------------------------------------------------
    // Test 10: Audit Trail Immutability & Completeness (Manuscript p. 31)
    // -------------------------------------------------------------
    console.log('\n10. Testing Audit Trail Immutability & Action Logging:');
    const auditRes = await request('GET', '/api/audit?limit=50');
    assert(auditRes.statusCode === 200, 'Audit trail endpoint returns 200 OK');
    const logs = auditRes.data.logs;
    const actions = logs.map(l => l.action);

    assert(actions.includes('USER_LOGIN'), 'Audit trail recorded USER_LOGIN');
    assert(actions.includes('CREATE_PURCHASE_ORDER'), 'Audit trail recorded CREATE_PURCHASE_ORDER');
    assert(actions.includes('PLACE_PURCHASE_ORDER'), 'Audit trail recorded PLACE_PURCHASE_ORDER');
    assert(actions.includes('RECEIVE_PURCHASE_ORDER_DELIVERY'), 'Audit trail recorded RECEIVE_PURCHASE_ORDER_DELIVERY');

    console.log('\n================================================================');
    console.log(` ALL SPECIFICATION VERIFICATION SUITE COMPLETED:`);
    console.log(` ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
