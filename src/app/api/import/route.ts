import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ParsedRow {
  [key: string]: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // BOM 제거
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }

  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
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
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string;

  if (!file || !type) {
    return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
  }

  let imported = 0;
  let errors: string[] = [];

  try {
    if (type === 'products') {
      for (const row of rows) {
        const name = row['상품명'] || row['name'] || row['Name'];
        const sku = row['SKU'] || row['sku'] || row['상품코드'] || '';
        const baseCost = parseFloat(row['원가'] || row['base_cost'] || row['Cost'] || '0');

        if (!name) {
          errors.push(`상품명이 없는 행이 있습니다`);
          continue;
        }

        const { error } = await (supabase as any)
          .from('products')
          .insert({
            user_id: user.id,
            name,
            sku: sku || null,
            base_cost: baseCost || 0,
          });

        if (error) {
          errors.push(`${name}: ${error.message}`);
        } else {
          imported++;
        }
      }
    } else if (type === 'sales') {
      // 상품 목록 조회
      const { data: products } = await (supabase as any)
        .from('products')
        .select('id, name, sku')
        .eq('user_id', user.id);

      const productMap = new Map<string, string>();
      products?.forEach((p: any) => {
        productMap.set(p.name.toLowerCase(), p.id);
        if (p.sku) productMap.set(p.sku.toLowerCase(), p.id);
      });

      for (const row of rows) {
        const productName = row['상품명'] || row['product'] || row['Product'] || '';
        const productSku = row['SKU'] || row['sku'] || '';
        const channel = row['채널'] || row['channel'] || row['Channel'] || 'smartstore';
        const saleDate = row['날짜'] || row['date'] || row['Date'] || new Date().toISOString().split('T')[0];
        const quantity = parseInt(row['수량'] || row['quantity'] || row['Quantity'] || '1');
        const unitPrice = parseFloat(row['단가'] || row['unit_price'] || row['Price'] || '0');

        const productId = productMap.get(productName.toLowerCase()) || 
                         productMap.get(productSku.toLowerCase());

        if (!productId) {
          errors.push(`상품을 찾을 수 없습니다: ${productName || productSku}`);
          continue;
        }

        const totalRevenue = quantity * unitPrice;
        const platformFee = totalRevenue * 0.03;
        const paymentFee = totalRevenue * 0.0363;

        const { error } = await (supabase as any)
          .from('sales_records')
          .insert({
            user_id: user.id,
            product_id: productId,
            channel,
            sale_date: saleDate,
            quantity,
            unit_price: unitPrice,
            total_revenue: totalRevenue,
            platform_fee: platformFee,
            payment_fee: paymentFee,
            net_profit: totalRevenue - platformFee - paymentFee,
          });

        if (error) {
          errors.push(`${productName}: ${error.message}`);
        } else {
          imported++;
        }
      }
    } else if (type === 'advertising') {
      for (const row of rows) {
        const channel = row['채널'] || row['channel'] || row['Channel'] || 'smartstore';
        const adDate = row['날짜'] || row['date'] || row['Date'] || new Date().toISOString().split('T')[0];
        const cost = parseFloat(row['광고비'] || row['cost'] || row['Cost'] || '0');
        const impressions = parseInt(row['노출수'] || row['impressions'] || row['Impressions'] || '0');
        const clicks = parseInt(row['클릭수'] || row['clicks'] || row['Clicks'] || '0');
        const conversions = parseInt(row['전환수'] || row['conversions'] || row['Conversions'] || '0');
        const campaignName = row['캠페인'] || row['campaign'] || row['Campaign'] || '';

        if (!cost || cost <= 0) {
          errors.push(`광고비가 없는 행이 있습니다`);
          continue;
        }

        const { error } = await (supabase as any)
          .from('advertising_costs')
          .insert({
            user_id: user.id,
            channel,
            ad_date: adDate,
            cost,
            impressions,
            clicks,
            conversions,
            campaign_name: campaignName || null,
          });

        if (error) {
          errors.push(`${adDate}: ${error.message}`);
        } else {
          imported++;
        }
      }
    } else if (type === 'operating') {
      for (const row of rows) {
        const expenseDate = row['날짜'] || row['date'] || row['Date'] || new Date().toISOString().split('T')[0];
        const category = row['카테고리'] || row['category'] || row['Category'] || 'other';
        const amount = parseFloat(row['금액'] || row['amount'] || row['Amount'] || '0');
        const description = row['설명'] || row['description'] || row['Description'] || '';

        if (!amount || amount <= 0) {
          errors.push(`금액이 없는 행이 있습니다`);
          continue;
        }

        const { error } = await (supabase as any)
          .from('operating_expenses')
          .insert({
            user_id: user.id,
            expense_date: expenseDate,
            category,
            amount,
            description: description || null,
          });

        if (error) {
          errors.push(`${expenseDate}: ${error.message}`);
        } else {
          imported++;
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      imported,
      total: rows.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
