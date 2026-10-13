// Domain types for APBDes data.
// Values match the enums in prisma/schema.prisma, so parser results can be saved directly.
 
export type EntryType = "REVENUE" | "EXPENDITURE" | "FINANCING_RECEIPT" | "FINANCING_EXPENDITURE";
 
export type FundSource =
  | "DD"
  | "ADD"
  | "PADES"
  | "BHP"
  | "BANKEU_KAB"
  | "BANKEU_PROV"
  | "SILPA"
  | "OTHER";
 
export type ActivityStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED";
 
// One row of the APBDes, as read from the Excel file.
// Rupiah is a plain number here; convert to BigInt only when saving to the database.
export interface ParsedBudgetItem {
  accountCode: string; // "2.1.01"
  entryType: EntryType;
  sectorCode: number | null; // 1 to 5, only for EXPENDITURE
  description: string;
  dusun: string | null; // null = whole village
  rt: string | null; // "03" or range "10-12"
  fundSource: FundSource;
  budget: number;
  realized: number;
  status: ActivityStatus;
  note: string | null;
  sourceRow: number; // row number in the Excel file (1-based)
}
 
export interface ParseResult {
  items: ParsedBudgetItem[];
  warnings: string[];
}