// stress_test_error_handling.js
// Probes edge cases, invalid inputs, and error boundaries for RKA Pharmacy IMS
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
        try { json = JSON.parse(rawData); } catch (e) { json = rawData; }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runEdgeCaseTests() {
  console.log('================================================================');
  console.log(' STARTING EDGE CASE & FAULT RESILIENCE AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // 1. Stock-Out Edge Cases
    // ---------------------------------------------------------
    console.log('1. Dispensing / Stock-Out Edge Cases:');

    // 1a. Negative quantity
    const negQtyRes = await request('POST', '/api/transactions/stock-out', {
      items: [{ medicine_id: 1, quantity: -5 }]
    });
    assert(negQtyRes.statusCode === 400, 'Rejects negative quantity dispensing with 400 Bad Request');

    // 1b. Zero quantity
    const zeroQtyRes = await request('POST', '/api/transactions/stock-out', {
      items: [{ medicine_id: 1, quantity: 0 }]
    });
    assert(zeroQtyRes.statusCode === 400, 'Rejects zero quantity dispensing with 400 Bad Request');

    // 1c. Empty items list
    const emptyItemsRes = await request('POST', '/api/transactions/stock-out', {
      items: []
    });
    assert(emptyItemsRes.statusCode === 400, 'Rejects empty items array with 400 Bad Request');

    // 1d. Non-existent medicine ID
    const badMedRes = await request('POST', '/api/transactions/stock-out', {
      items: [{ medicine_id: 999999, quantity: 1 }]
    });
    assert(badMedRes.statusCode === 400, 'Rejects non-existent medicine ID with 400 Bad Request');

    // 1e. Excessive quantity beyond available stock
    const excessiveRes = await request('POST', '/api/transactions/stock-out', {
      items: [{ medicine_id: 1, quantity: 999999 }]
    });
    assert(excessiveRes.statusCode === 400, 'Rejects quantity exceeding total available inventory with 400 Bad Request');

    // 1f. Non-FEFO batch override with empty justification
    const allBatches = (await request('GET', '/api/batches')).data;
    const med1Batches = allBatches.filter(b => b.medicine_id === 1 && b.days_to_expiry > 0);
    if (med1Batches.length > 1) {
      const nonFefoBatch = med1Batches[med1Batches.length - 1]; // latest expiring
      const noReasonRes = await request('POST', '/api/transactions/stock-out', {
        items: [{
          medicine_id: 1,
          batch_id: nonFefoBatch.id,
          quantity: 1,
          override_reason: ''
        }]
      });
      assert(noReasonRes.statusCode === 400, 'Rejects non-FEFO manual override without mandatory reason');
    }

    // ---------------------------------------------------------
    // 2. Purchase Orders Edge Cases
    // ---------------------------------------------------------
    console.log('\n2. Purchase Order Module Edge Cases:');

    // 2a. Create PO with missing supplier
    const noSupplierRes = await request('POST', '/api/purchase-orders', {
      supplier_name: '',
      items: [{ medicine_id: 1, quantity_ordered: 10, unit_cost: 5 }]
    });
    assert(noSupplierRes.statusCode === 400, 'Rejects PO creation without supplier name');

    // 2b. Create PO with negative quantity
    const negPoQtyRes = await request('POST', '/api/purchase-orders', {
      supplier_name: 'Test Supplier',
      items: [{ medicine_id: 1, quantity_ordered: -10, unit_cost: 5 }]
    });
    assert(negPoQtyRes.statusCode === 400, 'Rejects PO item with negative quantity');

    // 2c. Create PO with negative unit cost
    const negPoCostRes = await request('POST', '/api/purchase-orders', {
      supplier_name: 'Test Supplier',
      items: [{ medicine_id: 1, quantity_ordered: 10, unit_cost: -5 }]
    });
    assert(negPoCostRes.statusCode === 400, 'Rejects PO item with negative unit cost');

    // 2d. Create valid draft PO for transition tests
    const draftPoRes = await request('POST', '/api/purchase-orders', {
      supplier_name: 'Quality Pharma Inc.',
      items: [{ medicine_id: 1, quantity_ordered: 25, unit_cost: 10.0 }]
    });
    assert(draftPoRes.statusCode === 201, 'Creates valid test draft PO');
    const testPoId = draftPoRes.data.po.id;

    // 2e. Attempt to receive delivery on Draft PO (must be placed first)
    const prematureReceiveRes = await request('POST', `/api/purchase-orders/${testPoId}/receive`, {
      deliveries: [{ item_id: 1, quantity_received: 25, batch_number: 'LOT-X', expiration_date: '2028-01-01' }]
    });
    assert(prematureReceiveRes.statusCode === 400, 'Rejects receiving delivery for PO that is still in Draft status');

    // 2f. Attempt to cancel outstanding on Draft PO (must be placed)
    const prematureCancelRes = await request('PATCH', `/api/purchase-orders/${testPoId}/cancel-outstanding`, {
      cancellation_reason: 'Testing cancellation'
    });
    assert(prematureCancelRes.statusCode === 400, 'Rejects canceling outstanding lines on Draft PO');

    // 2g. Delete Draft PO successfully
    const deleteDraftRes = await request('DELETE', `/api/purchase-orders/${testPoId}`);
    assert(deleteDraftRes.statusCode === 200, 'Successfully deletes draft PO');

    // 2h. Create new PO, place it, and test placed restrictions
    const placedPoRes = await request('POST', '/api/purchase-orders', {
      supplier_name: 'Medix Distribution',
      items: [{ medicine_id: 1, quantity_ordered: 20, unit_cost: 8.5 }]
    });
    const placedPoId = placedPoRes.data.po.id;
    await request('PATCH', `/api/purchase-orders/${placedPoId}/place`);

    // 2i. Attempt to delete a PLACED PO (strictly forbidden)
    const deletePlacedRes = await request('DELETE', `/api/purchase-orders/${placedPoId}`);
    assert(deletePlacedRes.statusCode === 400, 'Strictly forbids deletion of placed PO');

    // 2j. Attempt to receive delivery with an EXPIRED date
    const placedDetails = (await request('GET', `/api/purchase-orders/${placedPoId}`)).data;
    const poItemId = placedDetails.items[0].id;
    const expiredReceiveRes = await request('POST', `/api/purchase-orders/${placedPoId}/receive`, {
      deliveries: [{
        item_id: poItemId,
        quantity_received: 20,
        batch_number: 'LOT-EXPIRED-TEST',
        expiration_date: '2023-01-01'
      }]
    });
    assert(expiredReceiveRes.statusCode === 400, 'Strictly rejects receiving an expired batch from supplier');

    // 2k. Cancel outstanding lines without a reason
    const noReasonCancelRes = await request('PATCH', `/api/purchase-orders/${placedPoId}/cancel-outstanding`, {
      cancellation_reason: ''
    });
    assert(noReasonCancelRes.statusCode === 400, 'Rejects cancellation of PO without mandatory reason');

    // 2l. Cancel with valid reason
    const validCancelRes = await request('PATCH', `/api/purchase-orders/${placedPoId}/cancel-outstanding`, {
      cancellation_reason: 'Supplier reported discontinued stock'
    });
    assert(validCancelRes.statusCode === 200, 'Accepts cancellation with mandatory reason and marks cancelled');

    // ---------------------------------------------------------
    // 3. System Configuration & Boundary Limits
    // ---------------------------------------------------------
    console.log('\n3. Settings & Boundary Validation:');

    // 3a. Invalid window days
    const invalidWindow = await request('PUT', '/api/settings', { forecasting_window_days: '50' });
    assert(invalidWindow.statusCode === 400, 'Rejects non-whitelisted forecasting window (only 10, 20, 30 permitted)');

    // 3b. Boundary values (10, 20, 30)
    for (const validN of ['10', '20', '30']) {
      const setN = await request('PUT', '/api/settings', { forecasting_window_days: validN });
      assert(setN.statusCode === 200, `Accepts valid forecasting window N = ${validN}`);
    }

    // ---------------------------------------------------------
    // 4. Analytics & Suggested Threshold Boundaries
    // ---------------------------------------------------------
    console.log('\n4. Analytics & Threshold Boundaries:');

    // 4a. Apply negative threshold
    const negThreshRes = await request('POST', '/api/fefo-plus/apply-suggested-threshold/1', {
      suggested_value: -10
    });
    assert(negThreshRes.statusCode === 400, 'Rejects negative suggested threshold');

    // 4b. Apply threshold to non-existent medicine
    const nonExistMedThreshRes = await request('POST', '/api/fefo-plus/apply-suggested-threshold/999999', {
      suggested_value: 25
    });
    assert(nonExistMedThreshRes.statusCode === 404, 'Returns 404 when applying threshold to non-existent medicine');

    // 4c. Verify FEFO+ analysis responds cleanly without error
    const analysisRes = await request('GET', '/api/fefo-plus/analysis');
    assert(analysisRes.statusCode === 200, 'FEFO+ analysis endpoint executes and returns 200 OK');

    console.log('\n================================================================');
    console.log(` EDGE CASE & RESILIENCE AUDIT COMPLETED:`);
    console.log(` ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  }
}

runEdgeCaseTests();
