"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const telemetry_1 = require("../services/telemetry");
const sms_1 = require("../sms");
const realtime_1 = require("../realtime");
const utils_1 = require("@pharma/utils");
const uuid_1 = require("uuid");
exports.apiRouter = (0, express_1.Router)();
// Standard API response wrappers
function successResponse(res, data, meta = {}) {
    return res.json({ success: true, data, meta });
}
function errorResponse(res, statusCode, code, message) {
    return res.status(statusCode).json({
        success: false,
        error: { code, message },
        requestId: `req-${Date.now()}`
    });
}
// -------------------------------------------------------------
// HEALTH ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));
exports.apiRouter.get('/health/ready', (req, res) => res.json({ status: 'READY', db: db_1.pool ? 'NEON_CONNECTED' : 'IN_MEMORY' }));
exports.apiRouter.get('/health/live', (req, res) => res.json({ status: 'ALIVE' }));
// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db_1.inMemoryStore.users.find(u => u.email === email && u.password === password);
    if (!user) {
        return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password. Please check credentials.');
    }
    const { password: _, ...userWithoutPassword } = user;
    return successResponse(res, {
        token: `demo-jwt-token-${user.id}`,
        refreshToken: `demo-refresh-token-${user.id}`,
        user: userWithoutPassword
    });
});
exports.apiRouter.get('/auth/me', (req, res) => {
    return successResponse(res, db_1.inMemoryStore.users[0]);
});
// -------------------------------------------------------------
// FACILITIES ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/facilities', (req, res) => {
    return successResponse(res, db_1.inMemoryStore.facilities);
});
exports.apiRouter.get('/facilities/:id', (req, res) => {
    const facility = db_1.inMemoryStore.facilities.find(f => f.id === req.params.id);
    if (!facility)
        return errorResponse(res, 404, 'FACILITY_NOT_FOUND', 'Facility not found');
    return successResponse(res, facility);
});
exports.apiRouter.get('/facilities/:id/stock', (req, res) => {
    const facilityId = req.params.id;
    const facilityBatches = db_1.inMemoryStore.batches.filter(b => b.currentFacilityId === facilityId);
    const totalUnits = facilityBatches.reduce((acc, b) => acc + b.quantity, 0);
    const criticalStockouts = facilityBatches.filter(b => b.quantity < 100).length;
    const nearExpiry = facilityBatches.filter(b => (0, utils_1.calculateDaysToExpiry)(b.expiryDate) <= 30 && b.status !== 'EXPIRED').length;
    return successResponse(res, {
        facilityId,
        totalUnits,
        criticalStockouts,
        nearExpiry,
        totalBatches: facilityBatches.length
    });
});
exports.apiRouter.get('/facilities/:id/inventory', (req, res) => {
    const facilityId = req.params.id;
    const batches = db_1.inMemoryStore.batches
        .filter(b => b.currentFacilityId === facilityId)
        .map(b => ({
        ...b,
        medicine: db_1.inMemoryStore.medicines.find(m => m.id === b.medicineId),
        facility: db_1.inMemoryStore.facilities.find(f => f.id === b.currentFacilityId)
    }));
    return successResponse(res, batches);
});
// -------------------------------------------------------------
// MEDICINES ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/medicines', (req, res) => {
    return successResponse(res, db_1.inMemoryStore.medicines);
});
exports.apiRouter.post('/medicines', (req, res) => {
    const newMed = {
        id: `med-${(0, uuid_1.v4)().substring(0, 8)}`,
        name: req.body.name,
        sku: req.body.sku || `SKU-${Date.now()}`,
        temperatureMin: req.body.temperatureMin || 2,
        temperatureMax: req.body.temperatureMax || 8,
        unit: 'CELSIUS',
        createdAt: new Date().toISOString()
    };
    db_1.inMemoryStore.medicines.push(newMed);
    return successResponse(res, newMed);
});
// -------------------------------------------------------------
// BATCHES ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/batches', (req, res) => {
    const batches = db_1.inMemoryStore.batches.map(b => ({
        ...b,
        medicine: db_1.inMemoryStore.medicines.find(m => m.id === b.medicineId),
        facility: db_1.inMemoryStore.facilities.find(f => f.id === b.currentFacilityId)
    }));
    return successResponse(res, batches);
});
exports.apiRouter.post('/batches', (req, res) => {
    const newBatch = {
        id: `batch-${(0, uuid_1.v4)().substring(0, 8)}`,
        medicineId: req.body.medicineId,
        batchNumber: req.body.batchNumber,
        expiryDate: req.body.expiryDate,
        status: 'AVAILABLE',
        currentFacilityId: req.body.currentFacilityId,
        quantity: req.body.quantity || 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db_1.inMemoryStore.batches.push(newBatch);
    return successResponse(res, newBatch);
});
exports.apiRouter.get('/batches/:id', (req, res) => {
    const batch = db_1.inMemoryStore.batches.find(b => b.id === req.params.id || b.batchNumber === req.params.id);
    if (!batch)
        return errorResponse(res, 404, 'BATCH_NOT_FOUND', 'Batch not found');
    return successResponse(res, {
        ...batch,
        medicine: db_1.inMemoryStore.medicines.find(m => m.id === batch.medicineId),
        facility: db_1.inMemoryStore.facilities.find(f => f.id === batch.currentFacilityId)
    });
});
// Authoritative Batch Trace Timeline Endpoint (PRD §7.9)
exports.apiRouter.get('/batches/:id/trace', (req, res) => {
    const batch = db_1.inMemoryStore.batches.find(b => b.id === req.params.id || b.batchNumber === req.params.id);
    if (!batch)
        return errorResponse(res, 404, 'BATCH_NOT_FOUND', 'Batch not found');
    const medicine = db_1.inMemoryStore.medicines.find(m => m.id === batch.medicineId);
    const facility = db_1.inMemoryStore.facilities.find(f => f.id === batch.currentFacilityId);
    const txns = db_1.inMemoryStore.transactions.filter(t => t.batchId === batch.id);
    const telemetry = db_1.inMemoryStore.telemetry.filter(t => t.batchId === batch.id);
    const alerts = db_1.inMemoryStore.alerts.filter(a => a.batchId === batch.id);
    // Construct chronological audit timeline
    const timeline = [];
    timeline.push({
        type: 'BATCH_CREATED',
        timestamp: batch.createdAt,
        description: `Batch ${batch.batchNumber} created with quantity ${batch.quantity}`
    });
    txns.forEach(t => {
        timeline.push({
            type: `TRANSACTION_${t.type}`,
            timestamp: t.scannedAt || t.createdAt,
            description: `${t.type} movement of ${t.quantity} units recorded`
        });
    });
    telemetry.forEach(t => {
        timeline.push({
            type: 'TELEMETRY_READING',
            timestamp: t.timestamp,
            description: `Temperature recorded: ${t.temperature}°C`
        });
    });
    alerts.forEach(a => {
        timeline.push({
            type: 'ALERT_TRIGGERED',
            timestamp: a.createdAt,
            description: `Alert: ${a.message}`
        });
    });
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return successResponse(res, {
        batch: { ...batch, medicine, facility },
        timeline,
        alerts,
        recentTelemetry: telemetry.slice(-10)
    });
});
// -------------------------------------------------------------
// TRANSACTIONS & SCANNER ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.post('/transactions/scan', (req, res) => {
    const { clientTransactionId, batchId, facilityId, type, quantity, scannedAt } = req.body;
    let batch = db_1.inMemoryStore.batches.find(b => b.id === batchId || b.batchNumber === batchId);
    if (!batch)
        return errorResponse(res, 404, 'BATCH_NOT_FOUND', 'Batch not found');
    if (type === 'OUTWARD' && batch.status === 'SPOILED') {
        return errorResponse(res, 400, 'BATCH_SPOILED', 'Cannot dispense a SPOILED batch');
    }
    // Idempotency check
    if (clientTransactionId && db_1.inMemoryStore.transactions.some(t => t.clientTransactionId === clientTransactionId)) {
        const existing = db_1.inMemoryStore.transactions.find(t => t.clientTransactionId === clientTransactionId);
        return successResponse(res, existing);
    }
    // Mutate quantity
    if (type === 'INWARD') {
        batch.quantity += quantity;
    }
    else if (type === 'OUTWARD') {
        if (batch.quantity < quantity) {
            return errorResponse(res, 400, 'INSUFFICIENT_STOCK', `Available stock (${batch.quantity}) is less than requested outward quantity (${quantity})`);
        }
        batch.quantity -= quantity;
    }
    const txn = {
        id: `TXN-${(0, uuid_1.v4)().substring(0, 8)}`,
        clientTransactionId,
        batchId: batch.id,
        facilityId: facilityId || batch.currentFacilityId,
        type,
        quantity,
        userId: 'usr-admin-01',
        scannedAt: scannedAt || new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    db_1.inMemoryStore.transactions.push(txn);
    (0, realtime_1.broadcastWsEvent)('inventory.updated', {
        batchId: batch.id,
        facilityId: txn.facilityId,
        newQuantity: batch.quantity,
        type
    });
    (0, realtime_1.broadcastWsEvent)('transaction.created', txn);
    return successResponse(res, txn);
});
exports.apiRouter.post('/transactions/sync', (req, res) => {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
        return errorResponse(res, 400, 'INVALID_PAYLOAD', 'Expected transactions array');
    }
    const results = transactions.map(item => {
        const { clientTransactionId, batchId, facilityId, type, quantity, scannedAt } = item;
        const existing = db_1.inMemoryStore.transactions.find(t => t.clientTransactionId === clientTransactionId);
        if (existing) {
            return { clientTransactionId, status: 'SYNCED', serverTransactionId: existing.id };
        }
        const batch = db_1.inMemoryStore.batches.find(b => b.id === batchId || b.batchNumber === batchId);
        if (!batch) {
            return { clientTransactionId, status: 'REJECTED', reason: 'BATCH_NOT_FOUND' };
        }
        if (type === 'OUTWARD' && batch.status === 'SPOILED') {
            return { clientTransactionId, status: 'REJECTED', reason: 'BATCH_SPOILED' };
        }
        if (type === 'OUTWARD' && batch.quantity < quantity) {
            return { clientTransactionId, status: 'REJECTED', reason: 'INSUFFICIENT_STOCK' };
        }
        if (type === 'INWARD')
            batch.quantity += quantity;
        else if (type === 'OUTWARD')
            batch.quantity -= quantity;
        const txnId = `TXN-${(0, uuid_1.v4)().substring(0, 8)}`;
        const txn = {
            id: txnId,
            clientTransactionId,
            batchId: batch.id,
            facilityId: facilityId || batch.currentFacilityId,
            type,
            quantity,
            userId: 'usr-admin-01',
            scannedAt: scannedAt || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        db_1.inMemoryStore.transactions.push(txn);
        return { clientTransactionId, status: 'SYNCED', serverTransactionId: txnId };
    });
    return successResponse(res, { results });
});
// -------------------------------------------------------------
// TELEMETRY ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.post('/telemetry/ingest', async (req, res) => {
    try {
        const result = await (0, telemetry_1.processTelemetryIngest)(req.body);
        return successResponse(res, result);
    }
    catch (err) {
        if (err.statusCode) {
            return errorResponse(res, err.statusCode, err.code, err.message);
        }
        return errorResponse(res, 500, 'TELEMETRY_ERROR', err.message || 'Internal telemetry processing error');
    }
});
exports.apiRouter.get('/telemetry/history', (req, res) => {
    const { batchId, facilityId } = req.query;
    let items = db_1.inMemoryStore.telemetry;
    if (batchId)
        items = items.filter(t => t.batchId === batchId);
    if (facilityId)
        items = items.filter(t => t.facilityId === facilityId);
    return successResponse(res, items.slice(-50));
});
// -------------------------------------------------------------
// SIMULATOR ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/simulator/devices', (req, res) => {
    const devices = db_1.inMemoryStore.virtualDevices.map(d => ({
        ...d,
        facility: db_1.inMemoryStore.facilities.find(f => f.id === d.facilityId),
        batch: db_1.inMemoryStore.batches.find(b => b.id === d.batchId)
    }));
    return successResponse(res, devices);
});
exports.apiRouter.post('/simulator/trigger-breach', async (req, res) => {
    const { batchId, temperature } = req.body;
    const targetBatchId = batchId || 'batch-je-brd-01';
    const breachTemp = temperature || 18;
    try {
        const result = await (0, telemetry_1.processTelemetryIngest)({
            deviceId: 'VIRTUAL-SENSOR-BRD',
            facilityId: 'fac-brd-01',
            batchId: targetBatchId,
            temperature: breachTemp,
            unit: 'CELSIUS',
            timestamp: new Date().toISOString()
        });
        return successResponse(res, {
            triggerId: `TRG-${(0, uuid_1.v4)().substring(0, 8)}`,
            temperature: breachTemp,
            status: 'BREACH',
            result
        });
    }
    catch (err) {
        return errorResponse(res, 500, 'BREACH_TRIGGER_FAILED', err.message);
    }
});
exports.apiRouter.post('/simulator/reset', (req, res) => {
    const { batchId } = req.body;
    const targetBatch = db_1.inMemoryStore.batches.find(b => b.id === batchId || b.batchNumber === batchId) || db_1.inMemoryStore.batches[0];
    targetBatch.status = 'AVAILABLE';
    targetBatch.updatedAt = new Date().toISOString();
    return successResponse(res, { message: `Batch ${targetBatch.batchNumber} status reset to AVAILABLE for demo reuse.` });
});
// -------------------------------------------------------------
// DASHBOARD OVERVIEW ENDPOINT
// -------------------------------------------------------------
exports.apiRouter.get('/dashboard/overview', (req, res) => {
    const totalInventory = db_1.inMemoryStore.batches.reduce((acc, b) => acc + b.quantity, 0);
    const activeBreaches = db_1.inMemoryStore.batches.filter(b => b.status === 'SPOILED').length;
    const spoiledBatches = activeBreaches;
    const expiredBatches = db_1.inMemoryStore.batches.filter(b => b.status === 'EXPIRED').length;
    const criticalStockouts = db_1.inMemoryStore.batches.filter(b => b.quantity < 100).length;
    let expiring30Days = 0;
    let expiring60Days = 0;
    let expiring90Days = 0;
    db_1.inMemoryStore.batches.forEach(b => {
        const days = (0, utils_1.calculateDaysToExpiry)(b.expiryDate);
        if (days <= 30 && days > 0)
            expiring30Days++;
        else if (days <= 60 && days > 30)
            expiring60Days++;
        else if (days <= 90 && days > 60)
            expiring90Days++;
    });
    return successResponse(res, {
        totalInventory,
        criticalStockouts,
        expiring30Days,
        expiring60Days,
        expiring90Days,
        activeBreaches,
        spoiledBatches,
        expiredBatches
    });
});
// -------------------------------------------------------------
// ALERTS & NOTIFICATIONS ENDPOINTS
// -------------------------------------------------------------
exports.apiRouter.get('/alerts', (req, res) => {
    const alerts = db_1.inMemoryStore.alerts.map(a => ({
        ...a,
        batch: db_1.inMemoryStore.batches.find(b => b.id === a.batchId),
        facility: db_1.inMemoryStore.facilities.find(f => f.id === a.facilityId)
    }));
    return successResponse(res, alerts);
});
exports.apiRouter.post('/alerts/:id/acknowledge', (req, res) => {
    const alert = db_1.inMemoryStore.alerts.find(a => a.id === req.params.id);
    if (!alert)
        return errorResponse(res, 404, 'ALERT_NOT_FOUND', 'Alert not found');
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = 'usr-admin-01';
    return successResponse(res, alert);
});
exports.apiRouter.post('/notifications/sms', async (req, res) => {
    const { recipient, message } = req.body;
    const notif = await (0, sms_1.sendSmsNotification)(recipient || '+919876543210', message || 'Test alert message');
    return successResponse(res, notif);
});
