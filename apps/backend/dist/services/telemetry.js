"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTelemetryIngest = processTelemetryIngest;
const utils_1 = require("../utils");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const realtime_1 = require("../realtime");
const sms_1 = require("../sms");
async function processTelemetryIngest(payload) {
    const { deviceId, facilityId, batchId, temperature, unit, timestamp } = payload;
    // 1. Find batch
    let batch = db_1.inMemoryStore.batches.find(b => b.id === batchId || b.batchNumber === batchId);
    if (!batch && db_1.pool) {
        const res = await db_1.pool.query('SELECT * FROM batches WHERE id = $1 OR batch_number = $1', [batchId]);
        if (res.rows.length > 0) {
            const r = res.rows[0];
            batch = {
                id: r.id,
                medicineId: r.medicine_id,
                batchNumber: r.batch_number,
                expiryDate: r.expiry_date,
                status: r.status,
                currentFacilityId: r.current_facility_id,
                quantity: r.quantity,
                createdAt: r.created_at,
                updatedAt: r.updated_at
            };
        }
    }
    if (!batch) {
        throw { statusCode: 404, code: 'BATCH_NOT_FOUND', message: `Batch ${batchId} could not be found.` };
    }
    // 2. Find medicine thresholds
    const medicine = db_1.inMemoryStore.medicines.find(m => m.id === batch.medicineId);
    const minAllowed = medicine ? medicine.temperatureMin : 2;
    const maxAllowed = medicine ? medicine.temperatureMax : 8;
    // 3. Save telemetry reading
    const telemetryId = `TEL-${(0, uuid_1.v4)().substring(0, 8)}`;
    const reading = {
        id: telemetryId,
        deviceId,
        facilityId,
        batchId: batch.id,
        temperature,
        unit: unit || 'CELSIUS',
        timestamp: timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    db_1.inMemoryStore.telemetry.push(reading);
    if (db_1.pool) {
        await db_1.pool.query('INSERT INTO telemetry (id, device_id, facility_id, batch_id, temperature, unit, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)', [telemetryId, deviceId, facilityId, batch.id, temperature, unit || 'CELSIUS', reading.timestamp]);
    }
    // 4. Evaluate Rule Engine Threshold
    const isBreach = (0, utils_1.isTemperatureInBreach)(temperature, minAllowed, maxAllowed);
    if (isBreach) {
        console.warn(`🚨 THERMAL BREACH DETECTED! Batch: ${batch.batchNumber} | Temp: ${temperature}°C | Range: ${minAllowed}°C-${maxAllowed}°C`);
        // Atomic mutation: Batch status = SPOILED
        batch.status = 'SPOILED';
        batch.updatedAt = new Date().toISOString();
        if (db_1.pool) {
            await db_1.pool.query('UPDATE batches SET status = $1, updated_at = NOW() WHERE id = $2', ['SPOILED', batch.id]);
        }
        // Create Alert
        const alertId = `ALT-${(0, uuid_1.v4)().substring(0, 8)}`;
        const alert = {
            id: alertId,
            type: 'THERMAL_BREACH',
            severity: 'CRITICAL',
            batchId: batch.id,
            facilityId,
            message: `Critical thermal breach detected for batch ${batch.batchNumber}. Reading: ${temperature}°C (Allowed: ${minAllowed}°C - ${maxAllowed}°C). Batch status set to SPOILED.`,
            createdAt: new Date().toISOString()
        };
        db_1.inMemoryStore.alerts.push(alert);
        if (db_1.pool) {
            await db_1.pool.query('INSERT INTO alerts (id, type, severity, batch_id, facility_id, message) VALUES ($1, $2, $3, $4, $5, $6)', [alertId, 'THERMAL_BREACH', 'CRITICAL', batch.id, facilityId, alert.message]);
        }
        // Broadcast Realtime Events
        (0, realtime_1.broadcastWsEvent)('thermal.breach', {
            batchId: batch.id,
            facilityId,
            temperature,
            minAllowed,
            maxAllowed,
            timestamp: reading.timestamp
        });
        (0, realtime_1.broadcastWsEvent)('batch.spoiled', {
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            facilityId,
            reason: `Thermal breach: ${temperature}°C detected`
        });
        (0, realtime_1.broadcastWsEvent)('alert.created', alert);
        // Queue SMS Notification to Manager (+91 7379413212)
        const managerPhone = process.env.MANAGER_PHONE || '+917379413212';
        const smsMessage = `CRITICAL ALERT: Thermal breach on batch ${batch.batchNumber} at facility ${facilityId}. Temperature: ${temperature}°C. Batch marked SPOILED. - MoHFW Cold Chain`;
        (0, sms_1.sendSmsNotification)(managerPhone, smsMessage, alertId).catch(err => console.error('SMS send error:', err));
        return {
            telemetryId,
            temperature,
            status: 'BREACH',
            batchStatus: 'SPOILED'
        };
    }
    else {
        // Normal Reading
        (0, realtime_1.broadcastWsEvent)('temperature.updated', {
            deviceId,
            batchId: batch.id,
            facilityId,
            temperature,
            timestamp: reading.timestamp
        });
        return {
            telemetryId,
            temperature,
            status: 'NORMAL',
            batchStatus: batch.status
        };
    }
}
