// purchases_alamin7-copy5\src\utils\excel.ts

import { read, utils } from 'xlsx';

// كاش داخلي لملف أصناف النظام (items.xlsx)
let itemsCatalogCache: { code: string; name: string }[] | null = null;
let itemsCatalogLoading: Promise<{ code: string; name: string }[] | null> | null = null;

export const excelUtils = {
  /**
   * قراءة ملف Excel وتحويله إلى JSON
   * @param file ملف Excel
   * @returns البيانات في صورة JSON
   */
  async readExcelFile(file: File) {
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { raw: false });

      // التحقق من وجود عمود الرقم
      if (!jsonData[0] || !('الرقم' in jsonData[0])) {
        throw new Error('لم يتم العثور على عمود الرقم في الملف');
      }

      return jsonData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * استخراج بيانات طلب شراء محدد من البيانات المستوردة
   * @param data البيانات المستوردة من Excel
   * @param poNumber رقم طلب الشراء المطلوب
   * @returns بيانات طلب الشراء
   */
  extractPurchaseOrder(data: any[], poNumber: string) {
    // تحويل رقم طلب الشراء إلى نص للمقارنة
    const searchNumber = poNumber.toString().trim();
    
    // البحث عن جميع الأسطر التي تحتوي على رقم طلب الشراء
    const matchingRows = data.filter(row => {
      const rowNumber = row['الرقم']?.toString().trim();
      return rowNumber === searchNumber;
    });

    if (matchingRows.length === 0) {
      throw new Error('لم يتم العثور على طلب الشراء في الملف');
    }

    // تجميع البيانات مع استيراد رقم السطر من الملف
    const items = matchingRows.map((row, index) => ({
      id: `item-${index}`,
      name: row['البيان'] || '',
      quantity: parseFloat(row['الكمية']) || 0,
      unit: row['وحدة القياس'] || '',
      selected: true, // تحديد جميع الأصناف افتراضياً
      lineNumber: row['السطر'] || row['رقم السطر'] || (index + 1) // استيراد رقم السطر من الملف أو ترقيم تلقائي كبديل
    }));

    return {
      po_number: searchNumber,
      beneficiary: matchingRows[0]['الجهة المستفيدة'] || '',
      transaction_number: matchingRows[0]['رقم المعاملة'] || '',
      purchaseMethod: matchingRows[0]['طريقة الشراء'] || '',
      items: items
    };
  },

  /**
   * قراءة ملف Excel مباشرة من مسار على القرص (لبيئة Electron فقط)
   * @param filePath المسار الكامل للملف
   */
  async readExcelFromPath(filePath: string) {
    try {
      // في Electron مع تمكين nodeIntegration يمكن استخدام require من الواجهة
      const fs = (window as any)?.require ? (window as any).require('fs') : null;
      if (!fs) {
        throw new Error('قراءة الملفات المباشرة غير مدعومة في هذا الوضع. استخدم اختيار الملف يدوياً.');
      }
      const data: Buffer = fs.readFileSync(filePath);
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { raw: false });

      return jsonData as any[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * تحميل كتالوج الأصناف من ملف items.xlsx داخل مجلد electron مع كاش داخلي
   * يدعم الوضعين: التطوير والإنتاج (Packaged).
   * يعتمد على عمودين: "رقم الصنف" و"اسم الصنف".
   */
  async loadItemsCatalogFromApp(): Promise<{ code: string; name: string }[] | null> {
    try {
      if (itemsCatalogCache) return itemsCatalogCache;
      if (itemsCatalogLoading) return itemsCatalogLoading;

      const nodeReq = (window as any)?.require;
      if (!nodeReq) {
        console.warn('nodeIntegration غير مفعّل. لن يمكن تحميل ملف الأصناف مباشرة.');
        return null;
      }
      const path = nodeReq('path');
      const processRef = (window as any).process;

      // مسارات مرشحة: dev و production
      const candidates: string[] = [];
      const cwd = processRef?.cwd?.() || '';
      const resourcesPath = processRef?.resourcesPath || '';

      if (cwd) {
        candidates.push(path.join(cwd, 'electron', 'items.xlsx'));
      }
      if (resourcesPath) {
        candidates.push(path.join(resourcesPath, 'electron', 'items.xlsx'));
      }

      // أول مسار صالح
      let rows: any[] | null = null;
      for (const p of candidates) {
        try {
          const data = await excelUtils.readExcelFromPath(p);
          rows = data;
          break;
        } catch {
          // جرّب المرشح التالي
        }
      }

      if (!rows || !rows.length) {
        console.warn('تعذر تحميل items.xlsx من المسارات المتوقعة:', candidates);
        return null;
      }

      // تحويل للأزواج code/name وفق الأعمدة المتوقعة
      const mapped = rows.map(r => ({
        code: (r['رقم الصنف'] || '').toString().trim(),
        name: (r['اسم الصنف'] || '').toString().trim(),
      })).filter(r => r.code && r.name);

      // إزالة التكرارات بالإبقاء على أول ظهور
      const seen = new Set<string>();
      const unique: { code: string; name: string }[] = [];
      for (const r of mapped) {
        if (!seen.has(r.code)) {
          seen.add(r.code);
          unique.push(r);
        }
      }

      itemsCatalogCache = unique;
      return unique;
    } catch (e) {
      console.warn('خطأ أثناء تحميل كتالوج الأصناف:', e);
      return null;
    }
  },

  /**
   * إرجاع اسم الصنف حسب الرمز باستخدام الكاش. يقوم بتحميل الملف أول مرة تلقائياً.
   */
  // دالة جلب الصنف بالرمز
  async getItemNameByCode(code: string): Promise<string | undefined> {
    if (!code || !code.trim()) return undefined;
    if (!itemsCatalogCache) {
      await excelUtils.loadItemsCatalogFromApp();
    }
    const c = code.trim();
    const found = itemsCatalogCache?.find(x => x.code === c);
    return found?.name || undefined;
  }
};