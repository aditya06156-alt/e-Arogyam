export interface GS1ParseResult {
  gtin?: string;        // AI (01)
  batchNumber?: string; // AI (10)
  expiryDate?: string;  // AI (17) YYMMDD
  serialNumber?: string;// AI (21)
  raw: string;
}

/**
 * Parses GS1 DataMatrix string or standard JSON/barcode formats.
 * AI 01 = GTIN (14 chars)
 * AI 10 = Batch/Lot (variable, max 20 chars)
 * AI 17 = Expiration Date (6 chars: YYMMDD)
 * AI 21 = Serial Number (variable, max 20 chars)
 */
export function parseGS1Barcode(raw: string): GS1ParseResult {
  const result: GS1ParseResult = { raw };
  if (!raw) return result;

  // If JSON format
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        gtin: parsed.gtin || parsed.sku,
        batchNumber: parsed.batchNumber || parsed.batch,
        expiryDate: parsed.expiryDate || parsed.expiry,
        serialNumber: parsed.serialNumber || parsed.serial,
        raw
      };
    } catch {
      // Fallback to text parsing
    }
  }

  // Simplified GS1 AI parser
  let clean = raw.replace(/\(/g, '').replace(/\)/g, '');
  
  // AI 01 GTIN
  const gtinMatch = clean.match(/01(\d{14})/);
  if (gtinMatch) {
    result.gtin = gtinMatch[1];
  }

  // AI 17 Expiry Date YYMMDD
  const expiryMatch = clean.match(/17(\d{6})/);
  if (expiryMatch) {
    const yymmdd = expiryMatch[1];
    const year = '20' + yymmdd.substring(0, 2);
    const month = yymmdd.substring(2, 4);
    const day = yymmdd.substring(4, 6);
    result.expiryDate = `${year}-${month}-${day}`;
  }

  // AI 10 Batch/Lot
  const batchMatch = clean.match(/10([A-Z0-9\-]+)/i);
  if (batchMatch) {
    result.batchNumber = batchMatch[1].substring(0, 20);
  }

  // AI 21 Serial
  const serialMatch = clean.match(/21([A-Z0-9\-]+)/i);
  if (serialMatch) {
    result.serialNumber = serialMatch[1].substring(0, 20);
  }

  // If no AI matched, treat raw as batch number directly
  if (!result.batchNumber && !result.gtin) {
    result.batchNumber = raw.trim();
  }

  return result;
}

export function isTemperatureInBreach(temp: number, minAllowed: number, maxAllowed: number): boolean {
  return temp < minAllowed || temp > maxAllowed;
}

export function calculateDaysToExpiry(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
