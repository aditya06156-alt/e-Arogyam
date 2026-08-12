// Inlined from @pharma/utils — standalone for cloud deployment

export interface GS1ParseResult {
  gtin?: string;
  batchNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  raw: string;
}

export function parseGS1Barcode(raw: string): GS1ParseResult {
  const result: GS1ParseResult = { raw };
  if (!raw) return result;

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
      // fallback to text parsing
    }
  }

  const clean = raw.replace(/\(/g, '').replace(/\)/g, '');

  const gtinMatch = clean.match(/01(\d{14})/);
  if (gtinMatch) result.gtin = gtinMatch[1];

  const expiryMatch = clean.match(/17(\d{6})/);
  if (expiryMatch) {
    const yymmdd = expiryMatch[1];
    result.expiryDate = `20${yymmdd.substring(0, 2)}-${yymmdd.substring(2, 4)}-${yymmdd.substring(4, 6)}`;
  }

  const batchMatch = clean.match(/10([A-Z0-9\-]+)/i);
  if (batchMatch) result.batchNumber = batchMatch[1].substring(0, 20);

  const serialMatch = clean.match(/21([A-Z0-9\-]+)/i);
  if (serialMatch) result.serialNumber = serialMatch[1].substring(0, 20);

  if (!result.batchNumber && !result.gtin) result.batchNumber = raw.trim();

  return result;
}

export function isTemperatureInBreach(temp: number, minAllowed: number, maxAllowed: number): boolean {
  return temp < minAllowed || temp > maxAllowed;
}

export function calculateDaysToExpiry(expiryDateStr: string): number {
  const diffTime = new Date(expiryDateStr).getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
