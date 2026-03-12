/**
 * 클라이언트 사이드 엑셀/CSV 파일 읽기 유틸리티
 * xlsx 파일은 SheetJS(xlsx) 라이브러리 사용, CSV는 직접 파싱
 */

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  sheetName: string;
}

function parseCsvText(text: string): SheetData {
  let content = text;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { headers: [], rows: [], sheetName: 'Sheet1' };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, rows, sheetName: 'Sheet1' };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

async function parseXlsxFile(file: File): Promise<SheetData[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
    });

    if (jsonData.length < 2) continue;

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
      const row = jsonData[i];
      const nonEmptyCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;
      if (nonEmptyCount >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = jsonData[headerRowIndex].map(h => String(h || '').trim()).filter(h => h);

    const rows: Record<string, string>[] = [];
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const row: Record<string, string> = {};
      let hasData = false;

      headers.forEach((header, index) => {
        const value = String(rowData[index] ?? '').trim();
        row[header] = value;
        if (value) hasData = true;
      });

      if (hasData) {
        rows.push(row);
      }
    }

    sheets.push({ headers, rows, sheetName });
  }

  return sheets;
}

export async function readFile(file: File): Promise<SheetData[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    return parseXlsxFile(file);
  }

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    const text = await file.text();
    return [parseCsvText(text)];
  }

  throw new Error(`지원하지 않는 파일 형식입니다: .${extension}`);
}

export function getFileAcceptTypes(): string {
  return '.xlsx,.xls,.csv';
}
