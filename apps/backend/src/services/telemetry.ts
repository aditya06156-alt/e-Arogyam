import { TelemetryReading, Alert, Batch } from '@pharma/types';
import { isTemperatureInBreach } from '@pharma/utils';
import { v4 as uuidv4 } from 'uuid';
import { inMemoryStore, pool } from '../db';
import { broadcastWsEvent } from '../realtime';
import { sendSmsNotification } from '../sms';

export interface IngestPayload {
  deviceId: string;
  facilityId: string;
  batchId: string;
  temperature: number;
  unit: 'CELSIUS';
  timestamp: string;
}

export async function processTelemetryIngest(payload: IngestPayload) {
  const { deviceId, facilityId, batchId, temperature, unit, timestamp } = payload;

  // 1. Find batch
  let batch = inMemoryStore.batches.find(b => b.id === batchId || b.batchNumber === batchId);
  if (!batch && pool) {
    const res = await pool.query('SELECT * FROM batches WHERE id = $1 OR batch_number = $1', [batchId]);
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
  const medicine = inMemoryStore.medicines.find(m => m.id === batch!.medicineId);
  const minAllowed = medicine ? medicine.temperatureMin : 2;
  const maxAllowed = medicine ? medicine.temperatureMax : 8;

  // 3. Save telemetry reading
  const telemetryId = `TEL-${uuidv4().substring(0, 8)}`;
  const reading: TelemetryReading = {
    id: telemetryId,
    deviceId,
    facilityId,
    batchId: batch.id,
    temperature,
    unit: unit || 'CELSIUS',
    timestamp: timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  inMemoryStore.telemetry.push(reading);

  if (pool) {
    await pool.query(
      'INSERT INTO telemetry (id, device_id, facility_id, batch_id, temperature, unit, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [telemetryId, deviceId, facilityId, batch.id, temperature, unit || 'CELSIUS', reading.timestamp]
    );
  }

  // 4. Evaluate Rule Engine Threshold
  const isBreach = isTemperatureInBreach(temperature, minAllowed, maxAllowed);

  if (isBreach) {
    console.warn(`🚨 THERMAL BREACH DETECTED! Batch: ${batch.batchNumber} | Temp: ${temperature}°C | Range: ${minAllowed}°C-${maxAllowed}°C`);

    // Atomic mutation: Batch status = SPOILED
    batch.status = 'SPOILED';
    batch.updatedAt = new Date().toISOString();

    if (pool) {
      await pool.query('UPDATE batches SET status = $1, updated_at = NOW() WHERE id = $2', ['SPOILED', batch.id]);
    }

    // Create Alert
    const alertId = `ALT-${uuidv4().substring(0, 8)}`;
    const alert: Alert = {
      id: alertId,
      type: 'THERMAL_BREACH',
      severity: 'CRITICAL',
      batchId: batch.id,
      facilityId,
      message: `Critical thermal breach detected for batch ${batch.batchNumber}. Reading: ${temperature}°C (Allowed: ${minAllowed}°C - ${maxAllowed}°C). Batch status set to SPOILED.`,
      createdAt: new Date().toISOString()
    };
    inMemoryStore.alerts.push(alert);

    if (pool) {
      await pool.query(
        'INSERT INTO alerts (id, type, severity, batch_id, facility_id, message) VALUES ($1, $2, $3, $4, $5, $6)',
        [alertId, 'THERMAL_BREACH', 'CRITICAL', batch.id, facilityId, alert.message]
      );
    }

    // Broadcast Realtime Events
    broadcastWsEvent('thermal.breach', {
      batchId: batch.id,
      facilityId,
      temperature,
      minAllowed,
      maxAllowed,
      timestamp: reading.timestamp
    });

    broadcastWsEvent('batch.spoiled', {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      facilityId,
      reason: `Thermal breach: ${temperature}°C detected`
    });

    broadcastWsEvent('alert.created', alert);

    // Queue SMS Notification to Manager (+91 7379413212)
    const managerPhone = process.env.MANAGER_PHONE || '+917379413212';
    const smsMessage = `CRITICAL ALERT: Thermal breach on batch ${batch.batchNumber} at facility ${facilityId}. Temperature: ${temperature}°C. Batch marked SPOILED. - MoHFW Cold Chain`;
    sendSmsNotification(managerPhone, smsMessage, alertId).catch(err => console.error('SMS send error:', err));

    return {
      telemetryId,
      temperature,
      status: 'BREACH',
      batchStatus: 'SPOILED'
    };
  } else {
    // Normal Reading
    broadcastWsEvent('temperature.updated', {
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
