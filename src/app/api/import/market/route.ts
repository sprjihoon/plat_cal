import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ParsedRow {
  [key: string]: string;
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }

  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));

  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, rows };
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[,원\s"]/g, '')) || 0;
}

function parseDate(val: string | undefined): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const cleaned = val.replace(/\./g, '-').replace(/"/g, '').trim();
  const match = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const market = formData.get('market') as string;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const text = await file.text();
  const { rows } = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
  }

  let imported = 0;
  const errors: string[] = [];

  try {
    for (const row of rows) {
      const productName = row['상품명'] || row['노출상품명'] || row['등록상품명'] || row['아이템명'] || '';
      if (!productName) continue;

      const orderDate = parseDate(
        row['주문일'] || row['주문일시'] || row['결제일'] || row['정산예정일'] || row['정산일']
      );
      const quantity = parseNumber(row['수량'] || row['주문수량']) || 1;
      const unitPrice = parseNumber(row['판매가'] || row['판매단가'] || row['상품가격']);
      const totalAmount = parseNumber(row['결제금액'] || row['판매금액'] || row['상품금액'] || row['총 주문금액']) || unitPrice * quantity;
      const platformFee = parseNumber(
        row['수수료'] || row['판매수수료'] || row['네이버페이 주문관리 수수료'] ||
        row['매출연동 수수료'] || row['11번가 수수료'] || row['쿠팡수수료']
      );
      const shippingFee = parseNumber(row['배송비'] || row['배송비 합계']);
      const settlementAmount = parseNumber(
        row['정산예정금액'] || row['정산금액']
      ) || (totalAmount - platformFee);

      const { data: existingProduct } = await (supabase as any)
        .from('products')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', productName)
        .single();

      let productId: string;

      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        const { data: newProduct, error: productError } = await (supabase as any)
          .from('products')
          .insert({
            user_id: user.id,
            name: productName,
            base_cost: 0,
          })
          .select('id')
          .single();

        if (productError) {
          errors.push(`상품 등록 실패 (${productName}): ${productError.message}`);
          continue;
        }
        productId = newProduct.id;
      }

      const { error: salesError } = await (supabase as any)
        .from('sales_records')
        .insert({
          user_id: user.id,
          product_id: productId,
          channel: market || 'unknown',
          sale_date: orderDate,
          quantity,
          unit_price: unitPrice,
          total_revenue: totalAmount,
          platform_fee: platformFee,
          payment_fee: 0,
          shipping_fee: shippingFee,
          settlement_amount: settlementAmount,
          net_profit: settlementAmount - (unitPrice * quantity * 0),
        });

      if (salesError) {
        errors.push(`판매 기록 저장 실패 (${productName}): ${salesError.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: rows.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('Market import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
