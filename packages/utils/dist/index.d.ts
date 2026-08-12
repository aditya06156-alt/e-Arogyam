export interface GS1ParseResult {
    gtin?: string;
    batchNumber?: string;
    expiryDate?: string;
    serialNumber?: string;
    raw: string;
}
/**
 * Parses GS1 DataMatrix string or standard JSON/barcode formats.
 * AI 01 = GTIN (14 chars)
 * AI 10 = Batch/Lot (variable, max 20 chars)
 * AI 17 = Expiration Date (6 chars: YYMMDD)
 * AI 21 = Serial Number (variable, max 20 chars)
 */
export declare function parseGS1Barcode(raw: string): GS1ParseResult;
export declare function isTemperatureInBreach(temp: number, minAllowed: number, maxAllowed: number): boolean;
export declare function calculateDaysToExpiry(expiryDateStr: string): number;
