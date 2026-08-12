"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inMemoryStore = exports.isUsingNeonDb = exports.pool = void 0;
exports.initDbSchema = initDbSchema;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config();
const DATABASE_URL = process.env.DATABASE_URL;
exports.pool = null;
exports.isUsingNeonDb = false;
if (DATABASE_URL && DATABASE_URL.includes('postgres')) {
    try {
        exports.pool = new pg_1.Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
        });
        exports.isUsingNeonDb = true;
        console.log('✅ Initialized Neon PostgreSQL connection pool.');
    }
    catch (err) {
        console.warn('⚠️ Neon PostgreSQL connection failed. Falling back to local/in-memory store.', err);
        exports.pool = null;
        exports.isUsingNeonDb = false;
    }
}
else {
    console.log('ℹ️ DATABASE_URL not set or invalid. Running with in-memory persistence layer.');
}
// In-memory initial fallback seed dataset
exports.inMemoryStore = {
    users: [
        {
            id: 'usr-admin-01',
            name: 'Dr. Aditya Kumar (Chief District Admin)',
            email: 'admin@earogyam.health',
            password: 'admin123',
            role: 'ADMIN',
            facilityIds: ['fac-brd-01', 'fac-aiims-02', 'fac-nscb-03'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'usr-brd-02',
            name: 'Dr. Priya Singh (BRD Medical Nodal Officer)',
            email: 'brd@earogyam.health',
            password: 'brd123',
            role: 'FACILITY_MANAGER',
            facilityIds: ['fac-brd-01'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'usr-aiims-03',
            name: 'Dr. Rahul Gupta (AIIMS Cold Chain Lead)',
            email: 'aiims@earogyam.health',
            password: 'aiims123',
            role: 'FACILITY_MANAGER',
            facilityIds: ['fac-aiims-02'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'usr-nscb-04',
            name: 'Dr. Meena Verma (NSCB District Hospital Officer)',
            email: 'nscb@earogyam.health',
            password: 'nscb123',
            role: 'FACILITY_MANAGER',
            facilityIds: ['fac-nscb-03'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ],
    facilities: [
        {
            id: 'fac-brd-01',
            name: 'BRD Medical College & Hospital, Gorakhpur',
            type: 'HOSPITAL',
            district: 'Gorakhpur',
            state: 'Uttar Pradesh',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'fac-aiims-02',
            name: 'AIIMS Gorakhpur',
            type: 'HOSPITAL',
            district: 'Gorakhpur',
            state: 'Uttar Pradesh',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'fac-nscb-03',
            name: 'Netaji Subhash Chandra Bose District Hospital',
            type: 'HOSPITAL',
            district: 'Gorakhpur',
            state: 'Uttar Pradesh',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        }
    ],
    medicines: [
        {
            id: 'med-je-01',
            name: 'Japanese Encephalitis (JE) Vaccine',
            sku: 'GKP-VAC-001',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-opv-02',
            name: 'Oral Polio Vaccine (bOPV)',
            sku: 'GKP-VAC-002',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-covid-03',
            name: 'Covaxin (COVID-19)',
            sku: 'GKP-VAC-003',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-hep-04',
            name: 'Hepatitis B Vaccine',
            sku: 'GKP-VAC-004',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-meas-05',
            name: 'Measles-Rubella (MR) Vaccine',
            sku: 'GKP-VAC-005',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-ins-06',
            name: 'Human Insulin (Regular)',
            sku: 'GKP-MED-001',
            temperatureMin: 2,
            temperatureMax: 8,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-artem-07',
            name: 'Artesunate Injection (Anti-Malarial)',
            sku: 'GKP-MED-002',
            temperatureMin: 15,
            temperatureMax: 30,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'med-tb-08',
            name: 'Rifampicin + Isoniazid (TB Combo)',
            sku: 'GKP-MED-003',
            temperatureMin: 15,
            temperatureMax: 25,
            unit: 'CELSIUS',
            createdAt: new Date().toISOString(),
        }
    ],
    batches: [
        // BRD Medical College
        {
            id: 'batch-je-brd-01',
            medicineId: 'med-je-01',
            batchNumber: 'JE-BRD-001',
            expiryDate: '2027-06-10',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-brd-01',
            quantity: 1200,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-opv-brd-02',
            medicineId: 'med-opv-02',
            batchNumber: 'OPV-BRD-002',
            expiryDate: '2026-11-30',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-brd-01',
            quantity: 850,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-cov-brd-03',
            medicineId: 'med-covid-03',
            batchNumber: 'COV-BRD-003',
            expiryDate: '2026-08-28',
            status: 'EXPIRING_30',
            currentFacilityId: 'fac-brd-01',
            quantity: 320,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-hep-brd-04',
            medicineId: 'med-hep-04',
            batchNumber: 'HEP-BRD-004',
            expiryDate: '2027-09-01',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-brd-01',
            quantity: 2000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-mr-brd-14',
            medicineId: 'med-meas-05',
            batchNumber: 'MR-BRD-014',
            expiryDate: '2027-05-01',
            status: 'SPOILED',
            currentFacilityId: 'fac-brd-01',
            quantity: 520,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        // AIIMS Gorakhpur
        {
            id: 'batch-je-aiims-05',
            medicineId: 'med-je-01',
            batchNumber: 'JE-AIIMS-005',
            expiryDate: '2027-04-22',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-aiims-02',
            quantity: 900,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-mr-aiims-06',
            medicineId: 'med-meas-05',
            batchNumber: 'MR-AIIMS-006',
            expiryDate: '2026-12-15',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-aiims-02',
            quantity: 640,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-ins-aiims-07',
            medicineId: 'med-ins-06',
            batchNumber: 'INS-AIIMS-007',
            expiryDate: '2027-01-10',
            status: 'LOW_STOCK',
            currentFacilityId: 'fac-aiims-02',
            quantity: 180,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-opv-aiims-08',
            medicineId: 'med-opv-02',
            batchNumber: 'OPV-AIIMS-008',
            expiryDate: '2026-10-20',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-aiims-02',
            quantity: 450,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        // NSCB District Hospital
        {
            id: 'batch-je-nscb-09',
            medicineId: 'med-je-01',
            batchNumber: 'JE-NSCB-009',
            expiryDate: '2027-02-18',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-nscb-03',
            quantity: 600,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-artem-nscb-10',
            medicineId: 'med-artem-07',
            batchNumber: 'ARTEM-NSCB-010',
            expiryDate: '2026-09-30',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-nscb-03',
            quantity: 280,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-tb-nscb-11',
            medicineId: 'med-tb-08',
            batchNumber: 'TB-NSCB-011',
            expiryDate: '2027-08-01',
            status: 'AVAILABLE',
            currentFacilityId: 'fac-nscb-03',
            quantity: 1500,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-cov-nscb-12',
            medicineId: 'med-covid-03',
            batchNumber: 'COV-NSCB-012',
            expiryDate: '2026-11-01',
            status: 'LOW_STOCK',
            currentFacilityId: 'fac-nscb-03',
            quantity: 95,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'batch-hep-nscb-13',
            medicineId: 'med-hep-04',
            batchNumber: 'HEP-NSCB-013',
            expiryDate: '2026-07-31',
            status: 'EXPIRED',
            currentFacilityId: 'fac-nscb-03',
            quantity: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ],
    transactions: [],
    telemetry: [],
    virtualDevices: [
        {
            id: 'VIRTUAL-SENSOR-BRD',
            name: 'BRD Cold Store Sensor 1',
            facilityId: 'fac-brd-01',
            batchId: 'batch-je-brd-01',
            status: 'ONLINE',
            telemetryIntervalSeconds: 5,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'VIRTUAL-SENSOR-AIIMS',
            name: 'AIIMS Cold Store Sensor 2',
            facilityId: 'fac-aiims-02',
            batchId: 'batch-je-aiims-05',
            status: 'ONLINE',
            telemetryIntervalSeconds: 5,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'VIRTUAL-SENSOR-NSCB',
            name: 'NSCB Cold Store Sensor 3',
            facilityId: 'fac-nscb-03',
            batchId: 'batch-je-nscb-09',
            status: 'ONLINE',
            telemetryIntervalSeconds: 5,
            createdAt: new Date().toISOString(),
        }
    ],
    alerts: [],
    notifications: [],
    auditLogs: []
};
async function initDbSchema() {
    if (!exports.pool)
        return;
    try {
        await exports.pool.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(32) NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS medicines (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        temperature_min NUMERIC NOT NULL,
        temperature_max NUMERIC NOT NULL,
        unit VARCHAR(32) DEFAULT 'CELSIUS',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS batches (
        id VARCHAR(64) PRIMARY KEY,
        medicine_id VARCHAR(64) REFERENCES medicines(id),
        batch_number VARCHAR(100) NOT NULL,
        expiry_date DATE NOT NULL,
        status VARCHAR(32) DEFAULT 'AVAILABLE',
        current_facility_id VARCHAR(64) REFERENCES facilities(id),
        quantity INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id VARCHAR(64) PRIMARY KEY,
        client_transaction_id VARCHAR(100) UNIQUE,
        batch_id VARCHAR(64) REFERENCES batches(id),
        facility_id VARCHAR(64) REFERENCES facilities(id),
        type VARCHAR(32) NOT NULL,
        quantity INT NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        scanned_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS telemetry (
        id VARCHAR(64) PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        facility_id VARCHAR(64) NOT NULL,
        batch_id VARCHAR(64) NOT NULL,
        temperature NUMERIC NOT NULL,
        unit VARCHAR(32) DEFAULT 'CELSIUS',
        timestamp TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        severity VARCHAR(32) NOT NULL,
        batch_id VARCHAR(64),
        facility_id VARCHAR(64),
        message TEXT NOT NULL,
        acknowledged_at TIMESTAMPTZ,
        acknowledged_by VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        console.log('✅ Neon DB Tables initialized successfully.');
    }
    catch (err) {
        console.error('⚠️ DB schema initialization error:', err);
    }
}
