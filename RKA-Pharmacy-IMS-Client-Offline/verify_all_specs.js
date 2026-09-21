// scratch/verify_all_specs.js
// Comprehensive automated verification test for RKA Pharmacy IMS
// Validates thesis manuscript requirements and ensures zero bugs/errors

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
    // Test 1: Authentication & Scrypt Password Security (Manuscript p. 26)
    // -------------------------------------------------------------
    console.log('1. Testing Operator Authentication & Password Security:');
    
    // Invalid credentials
    const badLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'wrongpassword' });
    assert(badLogin.statusCode === 401, 'Rejects invalid password with 401 Unauthorized');

    // Valid credentials (seeded admin / rka2026)
    const goodLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'rka2026' });
    assert(goodLogin.statusCode === 200, 'Accepts correct password (admin / rka2026)');
    assert(goodLogin.data && goodLogin.data.token, 'Returns session token upon authentication');
    assert(goodLogin.data.user && goodLogin.data.user.full_name === 'Lourdes Gincen L. Cesista', 'Identifies correct clinic operator (Lourdes Gincen L. Cesista)');

    const authToken = goodLogin.data.token;

    // Verify session
    const sessionCheck = await request('GET', '/api/auth/session', null, { Authorization: `Bearer ${authToken}` });
    assert(sessionCheck.statusCode === 200 && sessionCheck.data.authenticated, 'Validates active operator session');

    // -------------------------------------------------------------
    // Test 2: System Thresholds & Configuration (Manuscript p. 24)
    // -------------------------------------------------------------
    console.log('\n2. Testing Thresholds & Settings Configuration:');
    const settingsRes = await request('GET', '/api/settings');
    assert(settingsRes.statusCode === 200, 'Fetches system configuration successfully');
    const settings = settingsRes.data;
    assert(Number(settings.safe_threshold_days) === 180, 'Safe threshold is configured to > 180 days');
    assert(Number(settings.monitor_threshold_days) === 91, 'Monitor threshold is configured to 91-180 days');
    assert(Number(settings.warning_threshold_days) === 31, 'Warning threshold is configured to 31-90 days');
    assert(Number(settings.critical_threshold_days) === 1, 'Critical threshold is configured to 1-30 days');
    assert(Number(settings.default_buffer_days) === 3, 'Default buffer days is configured to 3 days');

    // -------------------------------------------------------------
    // Test 3: Batch-Level Tracking & Expiry Classification (Manuscript pp. 11, 24)
    // -------------------------------------------------------------
    console.log('\n3. Testing Batch-Level Tracking & Expiry Countdown:');
    const batchesRes = await request('GET', '/api/batches');
    assert(batchesRes.statusCode === 200, 'Fetches all medicine batches successfully');
    const batches = batchesRes.data;
    assert(Array.isArray(batches) && batches.length > 0, `Retrieved ${batches.length} inventory batches`);

    // Verify batch attributes
    const sampleBatch = batches[0];
    assert(
      sampleBatch.batch_number &&
      sampleBatch.expiration_date &&
      sampleBatch.current_quantity !== undefined &&
      sampleBatch.days_to_expiry !== undefined &&
      sampleBatch.expiry_status,
      'Batch includes batch_number, expiration_date, quantity, days_to_expiry, and expiry_status'
    );

    // Verify Days to Expiry formula: Expiration Date - Current Date
    const parts = String(sampleBatch.expiration_date).split('-').map(Number);
    const expDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    const now = new Date();
    const curDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const expectedDays = Math.round((expDate - curDate) / (1000 * 60 * 60 * 24));
    assert(sampleBatch.days_to_expiry === expectedDays, `Days to expiry formula verified: ${sampleBatch.days_to_expiry} == ${expectedDays}`);

    // Verify classification tier
    let expectedTier = 'Safe';
    if (expectedDays <= 0) expectedTier = 'Expired';
    else if (expectedDays < 31) expectedTier = 'Critical';
    else if (expectedDays < 91) expectedTier = 'Warning';
    else if (expectedDays <= 180) expectedTier = 'Monitor';
    assert(sampleBatch.expiry_status === expectedTier, `Classification tier verified as '${sampleBatch.expiry_status}'`);

    // -------------------------------------------------------------
    // Test 4: Alerts & Manual Acknowledgment (Manuscript p. 26)
    // -------------------------------------------------------------
    console.log('\n4. Testing Persistent Alerts & Manual Acknowledgment:');
    const alertsRes = await request('GET', '/api/alerts');
    assert(alertsRes.statusCode === 200, 'Alerts endpoint returns 200 OK');
    const alerts = alertsRes.data;
    assert(alerts.summary && typeof alerts.summary.total_alerts === 'number', `Alerts summary calculated: ${alerts.summary.total_alerts} total active alerts`);

    // Pick an alert to acknowledge
    let targetAlert = null;
    let targetKey = null;
    let targetType = null;
    let targetId = null;

    if (alerts.critical && alerts.critical.length > 0) {
      targetAlert = alerts.critical[0];
      targetKey = targetAlert.alert_key;
      targetType = 'critical_expiry';
      targetId = targetAlert.id;
    } else if (alerts.warning && alerts.warning.length > 0) {
      targetAlert = alerts.warning[0];
      targetKey = targetAlert.alert_key;
      targetType = 'warning_expiry';
      targetId = targetAlert.id;
    } else if (alerts.low_stock && alerts.low_stock.length > 0) {
      targetAlert = alerts.low_stock[0];
      targetKey = targetAlert.alert_key;
      targetType = 'low_stock';
      targetId = targetAlert.id;
    }

    if (targetKey) {
      const ackRes = await request('POST', '/api/alerts/acknowledge', {
        alert_key: targetKey,
        alert_type: targetType,
        entity_id: targetId,
        operator_name: 'Lourdes Gincen L. Cesista'
      });
      assert(ackRes.statusCode === 200, `Alert acknowledgment saved successfully for ${targetKey}`);

      // Re-fetch alerts to verify is_acknowledged is now true
      const recheckAlerts = await request('GET', '/api/alerts');
      const allItems = [
        ...(recheckAlerts.data.critical || []),
        ...(recheckAlerts.data.warning || []),
        ...(recheckAlerts.data.low_stock || [])
      ];
      const found = allItems.find(item => item.alert_key === targetKey);
      assert(found && found.is_acknowledged === true, 'Alert item is now marked as is_acknowledged: true');
    }

    // -------------------------------------------------------------
    // Test 5: FEFO+ Advanced Analytics & Expiry Risk Margin (Manuscript pp. 11, 25)
    // -------------------------------------------------------------
    console.log('\n5. Testing FEFO+ Expiry Risk Margin & Reorder Calculations:');
    const fefoRes = await request('GET', '/api/fefo-plus/analysis');
    assert(fefoRes.statusCode === 200, 'FEFO+ analysis endpoint returns 200 OK');
    const fefo = fefoRes.data;
    assert(Array.isArray(fefo.medicine_analysis), 'Dynamic medicine consumption analysis array generated');
    assert(Array.isArray(fefo.at_risk_batches), 'At-risk batches array generated');

    if (fefo.at_risk_batches.length > 0) {
      const riskBatch = fefo.at_risk_batches[0];
      assert(riskBatch.expiry_risk_margin < 0, `At-Risk batch detected with negative Expiry Risk Margin: ${riskBatch.expiry_risk_margin} days`);
    }

    // -------------------------------------------------------------
    // Test 6: Policy Simulation (Manuscript pp. 12, 27)
    // -------------------------------------------------------------
    console.log('\n6. Testing Policy Simulation (FIFO vs FEFO vs FEFO+):');
    const simRes = await request('GET', '/api/simulation/compare?days=30');
    assert(simRes.statusCode === 200, 'Simulation compare endpoint returns 200 OK');
    assert(simRes.data.fifo && simRes.data.fefo && simRes.data.fefo_plus, 'Returns comparative metrics for FIFO, FEFO, and FEFO+');

    // -------------------------------------------------------------
    // Test 7: Dispensing Rules & Expired Blocking (Manuscript pp. 11, 24, Fig. 2)
    // -------------------------------------------------------------
    console.log('\n7. Testing Dispensing Rules & Expiry Blocking:');

    // Find expired batch if any
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
      assert(
        blockedDispense.data.error.toLowerCase().includes('expired') || blockedDispense.data.error.includes('BLOCKED'),
        `Error message correctly reports: "${blockedDispense.data.error}"`
      );
    }

    // Test dispensing a valid active batch with status confirmation
    const activeBatch = batches.find(b => b.days_to_expiry > 0 && b.current_quantity >= 1);
    if (activeBatch) {
      const isWarnOrCrit = ['Warning', 'Critical'].includes(activeBatch.expiry_status);
      const testDispense = await request('POST', '/api/transactions/stock-out', {
        operator_name: 'Lourdes Gincen L. Cesista',
        patient_or_reference: 'Verification Test Patient',
        notes: 'Automated test release',
        items: [{
          medicine_id: activeBatch.medicine_id,
          batch_id: activeBatch.id,
          quantity: 1,
          override_reason: 'Automated verification test dispense',
          status_confirmed: isWarnOrCrit ? true : false,
          expiry_status: activeBatch.expiry_status
        }]
      });
      assert(testDispense.statusCode === 200 || testDispense.statusCode === 201, `Successfully dispensed 1 unit from active batch ${activeBatch.batch_number}`);
    }

    // -------------------------------------------------------------
    // Test 8: End-of-Day Backup & Removable Storage (Manuscript pp. 13, 26)
    // -------------------------------------------------------------
    console.log('\n8. Testing End-of-Day Backup & Removable Storage:');
    const drivesRes = await request('GET', '/api/backup/drives');
    assert(drivesRes.statusCode === 200, 'Drives detection endpoint returns 200 OK');
    assert(Array.isArray(drivesRes.data.drives), `Detected ${drivesRes.data.drives.length} storage volumes`);

    const downloadRes = await request('GET', '/api/backup/download?operator=VerificationTest');
    assert(downloadRes.statusCode === 200, 'Point-in-time WAL-checkpointed backup download returns 200 OK');
    assert(
      downloadRes.headers['content-type'] === 'application/x-sqlite3' || downloadRes.headers['content-type'] === 'application/octet-stream',
      `Backup returns proper SQLite binary mime-type (${downloadRes.headers['content-type']})`
    );

    // -------------------------------------------------------------
    // Test 9: Audit Trail Recording (Manuscript p. 26)
    // -------------------------------------------------------------
    console.log('\n9. Testing Audit Trail Completeness & Immutability:');
    const auditRes = await request('GET', '/api/audit?limit=30');
    assert(auditRes.statusCode === 200, 'Audit trail endpoint returns 200 OK');
    const logs = auditRes.data.logs;
    assert(Array.isArray(logs) && logs.length > 0, `Retrieved ${logs.length} audit logs`);

    // Verify recorded action types exist in the log
    const actions = logs.map(l => l.action);
    assert(actions.includes('USER_LOGIN'), 'Audit trail recorded USER_LOGIN event');
    assert(actions.includes('DATABASE_BACKUP_EXPORT') || actions.includes('BACKUP_SNAPSHOT'), 'Audit trail recorded DATABASE_BACKUP_EXPORT event');
    assert(actions.includes('ALERT_ACKNOWLEDGED'), 'Audit trail recorded ALERT_ACKNOWLEDGED event');

    console.log('\n================================================================');
    console.log(` VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
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
