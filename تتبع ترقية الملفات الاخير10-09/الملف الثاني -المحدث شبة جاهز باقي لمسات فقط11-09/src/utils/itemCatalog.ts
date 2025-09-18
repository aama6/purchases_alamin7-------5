// أدوات تحميل وفهرسة الأصناف من ملف JSON مع دعم items2.json و items.json
// تدعم البحث الجزئي برقم الصنف أو باسم الصنف مع تخزين مؤقت (Cache)

export interface CatalogItem {
  // يدعم كلا البنيتين: الإنجليزية (items2.json) والعربية (items.json)
  item_code?: string;
  item_name?: string;
  category?: string;
  sector1?: string;
  part1?: string;
  sector2?: string;
  part2?: string;
  sector3?: string;
  part3?: string;
  [key: string]: any;
}

interface CatalogData {
  items: CatalogItem[];
  by_code: Record<string, CatalogItem>;
  by_name: Record<string, CatalogItem[]>;
}

// مسارات الملفات المحتملة
const CATALOG_PATHS = [
  '/PurchaseOrders/items2.json', // البنية المحسّنة (بفهرسة)
  '/PurchaseOrders/items.json', // البنية القديمة (مصفوفة فقط)
];

let cache: { data: CatalogData | null } = { data: null };

// استخراج الكود والاسم بغض النظر عن البنية
const getCode = (row: any) => row?.item_code ?? row?.['رقم الصنف'] ?? '';
const getName = (row: any) => row?.item_name ?? row?.['اسم الصنف'] ?? '';

async function fetchJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    // محاولة احتياطية عبر XMLHttpRequest
    try {
      const data = await new Promise<any | null>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'text';
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              console.error('JSON parse error:', err);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        xhr.onerror = () => resolve(null);
        xhr.send();
      });
      return data;
    } catch {
      return null;
    }
  }
}

// تحميل الكتالوج مع التخزين المؤقت
export async function loadCatalog(): Promise<CatalogData> {
  if (cache.data) return cache.data;

  for (const path of CATALOG_PATHS) {
    const raw = await fetchJson(path);
    if (!raw) continue;

    // إذا كانت البنية تحتوي على items/by_code/by_name مباشرة
    if (raw.items && (raw.by_code || raw.by_name)) {
      const items: CatalogItem[] = raw.items as CatalogItem[];
      const by_code: Record<string, CatalogItem> = raw.by_code ?? {};
      const by_name: Record<string, CatalogItem[]> = raw.by_name ?? {};
      cache.data = { items, by_code, by_name };
      return cache.data;
    }

    // البنية القديمة: مصفوفة من العناصر فقط
    if (Array.isArray(raw)) {
      const items: CatalogItem[] = raw as CatalogItem[];
      const by_code: Record<string, CatalogItem> = {};
      const by_name: Record<string, CatalogItem[]> = {};
      for (const row of items) {
        const code = String(getCode(row)).trim();
        const name = String(getName(row)).trim();
        if (code) by_code[code] = row;
        if (name) {
          if (!by_name[name]) by_name[name] = [];
          by_name[name].push(row);
        }
      }
      cache.data = { items, by_code, by_name };
      return cache.data;
    }
  }

  // إذا تعذر التحميل
  cache.data = { items: [], by_code: {}, by_name: {} };
  return cache.data;
}

// البحث باسم الصنف (جزئي)
export async function searchItemsByNamePart(query: string): Promise<CatalogItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { items } = await loadCatalog();
  const qLower = q.toLowerCase();
  return items.filter((row) => String(getName(row)).toLowerCase().includes(qLower)).slice(0, 20);
}

// البحث برقم الصنف (جزئي)
export async function searchItemsByCodePart(query: string): Promise<CatalogItem[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const { items } = await loadCatalog();
  return items.filter((row) => String(getCode(row)).includes(q)).slice(0, 20);
}

// جلب اسم الصنف عبر رقم الصنف (تطابق كامل)
export async function getItemNameByCodeExact(code: string): Promise<string | null> {
  const q = code.trim();
  if (!q) return null;
  const { by_code } = await loadCatalog();
  const row = by_code[q];
  return row ? String(getName(row)) : null;
}

// تهيئة عنصر للاستخدام في الواجهة (توحيد الحقول)
export function toDisplayItem(row: any): { code: string; name: string } {
  return {
    code: String(getCode(row) ?? ''),
    name: String(getName(row) ?? ''),
  };
}