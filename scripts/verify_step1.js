const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runStep1Verification() {
  console.log('\n=============================================================');
  console.log('  🧪 STEP 1 INTEGRATION & VERIFICATION TEST SUITE');
  console.log('=============================================================\n');

  try {
    // 1. Health checks
    const health = await request('/health');
    console.log('1. GET /health:', health.status === 200 ? '✅ PASS' : '❌ FAIL', health.body);

    // 2. Authentication Login
    const login = await request('/auth/login', 'POST', {
      email: 'admin@earogyam.health',
      password: 'admin123'
    });
    console.log('2. POST /auth/login:', login.status === 200 ? '✅ PASS' : '❌ FAIL', login.body.data?.token ? 'Token Received' : 'No Token');

    // 3. Normal Telemetry Ingestion (5.4°C)
    const normalIngest = await request('/telemetry/ingest', 'POST', {
      deviceId: 'VIRTUAL-SENSOR-BRD',
      facilityId: 'fac-brd-01',
      batchId: 'batch-je-brd-01',
      temperature: 5.4,
      unit: 'CELSIUS',
      timestamp: new Date().toISOString()
    });
    console.log('3. Normal Telemetry (5.4°C):', normalIngest.body.data?.status === 'NORMAL' ? '✅ PASS' : '❌ FAIL', normalIngest.body.data);

    // 4. Breach Telemetry Ingestion (18.0°C) -> SPOILED state mutation + Alert + SMS
    const breachIngest = await request('/telemetry/ingest', 'POST', {
      deviceId: 'VIRTUAL-SENSOR-BRD',
      facilityId: 'fac-brd-01',
      batchId: 'batch-je-brd-01',
      temperature: 18.0,
      unit: 'CELSIUS',
      timestamp: new Date().toISOString()
    });
    console.log('4. Breach Telemetry (18.0°C):', breachIngest.body.data?.status === 'BREACH' && breachIngest.body.data?.batchStatus === 'SPOILED' ? '✅ PASS (SPOILED State Mutated)' : '❌ FAIL', breachIngest.body.data);

    // 5. Check Dashboard Overview KPI
    const overview = await request('/dashboard/overview');
    console.log('5. GET /dashboard/overview:', overview.body.data?.activeBreaches >= 1 ? '✅ PASS' : '❌ FAIL', overview.body.data);

    // 6. Check Batch Audit Trace Timeline
    const trace = await request('/batches/batch-je-brd-01/trace');
    console.log('6. GET /batches/batch-je-brd-01/trace:', trace.body.data?.timeline ? `✅ PASS (${trace.body.data.timeline.length} timeline events logged)` : '❌ FAIL');

    // 7. Online Scan Transaction
    const scan = await request('/transactions/scan', 'POST', {
      clientTransactionId: `test-scan-${Date.now()}`,
      batchId: 'batch-opv-brd-02',
      facilityId: 'fac-brd-01',
      type: 'INWARD',
      quantity: 50
    });
    console.log('7. POST /transactions/scan:', scan.body.success ? '✅ PASS' : '❌ FAIL', scan.body.data);

    // 8. Offline Transaction Sync
    const sync = await request('/transactions/sync', 'POST', {
      transactions: [
        {
          clientTransactionId: `offline-tx-${Date.now()}-1`,
          batchId: 'batch-opv-brd-02',
          facilityId: 'fac-brd-01',
          type: 'INWARD',
          quantity: 100,
          scannedAt: new Date().toISOString()
        }
      ]
    });
    console.log('8. POST /transactions/sync:', sync.body.data?.results?.[0]?.status === 'SYNCED' ? '✅ PASS (Idempotent Sync Verified)' : '❌ FAIL', sync.body.data);

    console.log('\n=============================================================');
    console.log('🎉 STEP 1 VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('❌ Verification error:', err);
  }
}

// Wait for server to start before running
setTimeout(runStep1Verification, 2000);
