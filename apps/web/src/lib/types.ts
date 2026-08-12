// Inlined from @pharma/types — standalone for cloud deployment

export type UserRole =
  | 'ADMIN'
  | 'FACILITY_MANAGER'
  | 'LOGISTICS_OPERATOR'
  | 'VIEWER'
  | 'SIMULATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type FacilityType = 'HOSPITAL' | 'WAREHOUSE' | 'HUB';
export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  state: string;
  status: FacilityStatus;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  sku: string;
  temperatureMin: number;
  temperatureMax: number;
  unit: string;
  createdAt: string;
}

export type BatchStatus =
  | 'AVAILABLE'
  | 'LOW_STOCK'
  | 'EXPIRING_90'
  | 'EXPIRING_60'
  | 'EXPIRING_30'
  | 'EXPIRED'
  | 'SPOILED';

export interface Batch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  status: BatchStatus;
  currentFacilityId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  medicine?: Medicine;
  facility?: Facility;
}

export type TransactionType = 'INWARD' | 'OUTWARD';

export interface InventoryTransaction {
  id: string;
  clientTransactionId?: string;
  batchId: string;
  facilityId: string;
  type: TransactionType;
  quantity: number;
  userId: string;
  scannedAt: string;
  createdAt: string;
  batch?: Batch;
  facility?: Facility;
}

export interface TelemetryReading {
  id?: string;
  deviceId: string;
  facilityId: string;
  batchId: string;
  temperature: number;
  unit: 'CELSIUS';
  timestamp: string;
  createdAt?: string;
}

export type VirtualDeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

export interface VirtualDevice {
  id: string;
  name: string;
  facilityId: string;
  batchId: string;
  status: VirtualDeviceStatus;
  telemetryIntervalSeconds: number;
  createdAt: string;
  facility?: Facility;
  batch?: Batch;
}

export type AlertType = 'THERMAL_BREACH' | 'EXPIRY' | 'STOCKOUT';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  batchId?: string;
  facilityId?: string;
  message: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
  batch?: Batch;
  facility?: Facility;
}

export interface DashboardOverview {
  totalInventory: number;
  criticalStockouts: number;
  expiring30Days: number;
  expiring60Days: number;
  expiring90Days: number;
  activeBreaches: number;
  spoiledBatches?: number;
  expiredBatches?: number;
}

export interface WsEventMap {
  'inventory.updated': { batchId: string; facilityId: string; newQuantity: number; type: TransactionType };
  'temperature.updated': { deviceId: string; batchId: string; facilityId: string; temperature: number; timestamp: string };
  'thermal.breach': { batchId: string; facilityId: string; temperature: number; maxAllowed: number; minAllowed: number; timestamp: string };
  'batch.spoiled': { batchId: string; batchNumber: string; facilityId: string; reason: string };
  'transaction.created': InventoryTransaction;
  'expiry.warning': { batchId: string; daysRemaining: number; window: string };
  'alert.created': Alert;
}
