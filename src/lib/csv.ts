// Turns a list of objects into CSV text that opens correctly in Excel and Google Sheets.

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => string | number | null;
}

// Wrap a value in quotes when it contains a comma, quote, or line break.
function escapeCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const lines = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}
