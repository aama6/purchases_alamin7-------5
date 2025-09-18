//purchases_alamin5-copy5\src\utils\db.ts
// src/utils/db.ts
import Dexie, { Table } from 'dexie';

// ==============================
// واجهات البيانات (Data Interfaces)
// ==============================

/**
 * واجهة بيانات عروض الأسعار في قاعدة البيانات
 * تحتوي على معلومات العرض المقدمة من الموردين
 */
interface PriceOfferData {
  id?: number;               // المفتاح الأساسي (يتم إنشاؤه تلقائياً)
  po_id: string;              // رقم طلب الشراء المرتبط بالعرض
  vendor: string;             // اسم المورد
  amount: number;             // المبلغ الأساسي قبل الضريبة
  currency: string;           // العملة (ريال، دولار، إلخ)
  exchangeRate?: number;      // سعر الصرف (اختياري للعملات الأجنبية)
  taxIncluded: boolean;       // هل العرض يشمل الضريبة
  total: number;              // الإجمالي بالعملة الأصلية
  totalInYR: number;         // الإجمالي بالريال اليمني
  totalInWords: string;       // الإجمالي كتابةً
  result?: string;            // نتيجة التقييم (مطابق، غير مطابق، مطابق جزئي)
  notes?: string;             // ملاحظات العرض
  items?: PriceOfferItem[];   // تفاصيل أصناف العرض
  commitments?: string[];     // الالتزامات المطلوبة من المورد
}

/**
 * واجهة بيانات أصناف عرض السعر في قاعدة البيانات
 * تمثل تفاصيل كل صنف في عرض السعر المقدم
 */
interface PriceOfferItem {
  id?: string;                // معرف الصنف في العرض
  itemName: string;          // اسم الصنف
  quantity: number;           // الكمية المقدمة
  unitPrice: number;         // سعر الوحدة
  totalPrice: number;        // الإجمالي للصنف
  specifications?: {           // مواصفات الصنف المطلوبة
    [key: string]: string;
  };
  vendorSpecifications?: {      // مواصفات الصنف المقدمة من المورد
    [key: string]: string;
  };
  commitments?: string[];      // الالتزامات الخاصة بالصنف
}

/**
 * واجهة بيانات العروض المستبعدة في قاعدة البيانات
 * تحتوي على معلومات الموردين الذين تم استبعادهم
 */
interface ExcludedOfferData {
  id?: number;                // المفتاح الأساسي (يتم إنشاؤه تلقائياً)
  po_id: string;              // رقم طلب الشراء المرتبط بالعرض
  vendor: string;             // اسم المورد المستبعد
  reason: string;             // سبب الاستبعاد الرئيسي
  notes: string;              // ملاحظات إضافية
  priceReason?: string;       // سبب الاستبعاد المتعلق بالسعر
  colorReason?: string;       // سبب الاستبعاد المتعلق باللون
  specReasons?: string[];      // أسباب الاستبعاد المتعلقة بالمواصفات
}

/**
 * واجهة بيانات الأصناف المطلوبة في قاعدة البيانات
 * تمثل الأصناف المطلوبة في طلب الشراء
 */
interface ItemData {
  id?: number;                // المفتاح الأساسي (يتم إنشاؤه تلقائياً)
  po_id: string;              // رقم طلب الشراء المرتبط بالصنف
  code?: string;              // رقم الصنف في الكتالوج (اختياري)
  name: string;               // اسم الصنف
  quantity: number;           // الكمية المطلوبة
  unit: string;               // وحدة القياس
  estimatedCost?: {           // التكلفة التقديرية للصنف
    amount: number;           // المبلغ التقديري
    currency: string;         // العملة
    equivalentInYR?: number; // المعادل بالريال اليمني (يحسب تلقائياً)
  };
  specifications?: {           // مواصفات الصنف المطلوبة
    [key: string]: string;
  };
}

/**
 * واجهة بيانات طلب الشراء في قاعدة البيانات
 * تمثل طلب الشراء الرئيسي وجميع البيانات المرتبطة به
 */
interface PurchaseOrderData {
  id?: number;                // المفتاح الأساسي (يتم إنشاؤه تلقائياً)
  po_number: string;           // رقم طلب الشراء (مفتاح فريد)
  transaction_number: string;  // رقم المعاملة
  requesting: string;          // الجهة الطالبة
  beneficiary: string;         // الجهة المستفيدة
  purchaseMethod: string;      // طريقة الشراء
  items_count: number;         // عدد الأصناف المطلوبة
  subject: string;             // موضوع الطلب
  financial_classification: string; // التصنيف المالي
  record_number: string;       // رقم السجل
  record_date: string;         // تاريخ السجل
  created_by: string;          // الشخص الذي أنشأ الطلب
  created_at: string;          // تاريخ الإنشاء
  updated_at: string;          // تاريخ التحديث
  items: ItemData[];           // الأصناف المطلوبة
  priceOffers: PriceOfferData[]; // عروض الأسعار
  excludedOffers: ExcludedOfferData[]; // العروض المستبعدة
  recommendation?: string;     // نص التوصية
}

// ==============================
// فئة قاعدة البيانات
// ==============================

/**
 * فئة قاعدة البيانات المحلية باستخدام Dexie (IndexedDB)
 * تدير جميع العمليات على قاعدة بيانات طلبات الشراء
 */
class PurchaseOrderDB extends Dexie {
  purchase_orders!: Table<PurchaseOrderData>;
  priceOffers!: Table<PriceOfferData>;
  excludedOffers!: Table<ExcludedOfferData>;
  items!: Table<ItemData>;
  
  constructor() {
    super('PurchaseOrderDB');
    
    // تعريف هيكل قاعدة البيانات مع الإصدار 310
    // استخدام ++id كمفتاح أساسي لجميع الجداول
    this.version(310).stores({
      purchase_orders: '++id,po_number,transaction_number,requesting,beneficiary,items_count,subject,financial_classification,record_number,record_date,created_by,created_at,updated_at,purchaseMethod',
      priceOffers: '++id,po_id,vendor,amount,currency,exchangeRate,taxIncluded,total,totalInYR,totalInWords,result',
      excludedOffers: '++id,po_id,vendor,reason,notes',
      items: '++id,po_id,name,quantity,unit'
    });
  }
}

// إنشاء مثيل قاعدة البيانات
const dexieDb = new PurchaseOrderDB();

// ==============================
// ذاكرة مؤقتة للتحسين (Cache)
// ==============================

/**
 * ذاكرة مؤقتة لتخزين نتائج العمليات المتكررة
 */
class DatabaseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

  /**
   * تخزين البيانات في الذاكرة المؤقتة
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * استرجاع البيانات من الذاكرة المؤقتة
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clear(): void {
    this.cache.clear();
  }
}

const dbCache = new DatabaseCache();

// ==============================
// دوال التفاعل مع قاعدة البيانات
// ==============================

export const db = {
  /**
   * حفظ طلب الشراء في قاعدة البيانات
   * @param data بيانات طلب الشراء
   * @returns true إذا تم الحفظ بنجاح، false في حالة الفشل
   */
  async savePurchaseOrder(data: PurchaseOrderData): Promise<boolean> {
    try {
      console.log('محاولة حفظ البيانات في قاعدة البيانات:', data.po_number);
      await dexieDb.open();
      
      // استخدام معاملة لضمان تكامل البيانات
      await dexieDb.transaction('rw', [
        dexieDb.purchase_orders, 
        dexieDb.priceOffers, 
        dexieDb.excludedOffers, 
        dexieDb.items
      ], async () => {
        // البحث عن طلب الشراء الحالي باستخدام po_number
        const existingOrder = await dexieDb.purchase_orders
          .where('po_number')
          .equals(data.po_number)
          .first();
        
        // حفظ بيانات طلب الشراء
        if (existingOrder?.id) {
          // تحديث السجل الموجود
          await dexieDb.purchase_orders.update(existingOrder.id, {
            ...data,
            updated_at: new Date().toISOString()
          });
        } else {
          // إضافة سجل جديد مع التأكد من وجود created_at
          await dexieDb.purchase_orders.put({
            ...data,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        // حفظ الأصناف
        if (Array.isArray(data.items)) {
          // حذف الأصناف القديمة أولاً
          await dexieDb.items.where('po_id').equals(data.po_number).delete();
          
          // إضافة الأصناف الجديدة
          const itemsToSave = data.items.map((i: ItemData) => ({ ...i, po_id: data.po_number }));
          await dexieDb.items.bulkPut(itemsToSave);
        }
        
        // حفظ عروض الأسعار
        if (Array.isArray(data.priceOffers)) {
          // حذف العروض القديمة أولاً
          await dexieDb.priceOffers.where('po_id').equals(data.po_number).delete();
          
          // إضافة العروض الجديدة
          const offersToSave = data.priceOffers.map((o: PriceOfferData) => ({ ...o, po_id: data.po_number }));
          await dexieDb.priceOffers.bulkPut(offersToSave);
        }
        
        // حفظ العروض المستبعدة
        if (Array.isArray(data.excludedOffers)) {
          // حذف العروض المستبعدة القديمة أولاً
          await dexieDb.excludedOffers.where('po_id').equals(data.po_number).delete();
          
          // إضافة العروض المستبعدة الجديدة
          const excludedToSave = data.excludedOffers.map((eo: ExcludedOfferData) => ({ ...eo, po_id: data.po_number }));
          await dexieDb.excludedOffers.bulkPut(excludedToSave);
        }
      });
      
      // مسح الذاكرة المؤقتة بعد الحفظ الناجح
      dbCache.clear();
      console.log('تم حفظ البيانات بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حفظ طلب الشراء:', error);
      console.error('رسالة الخطأ:', error.message);
      console.error('نوع الخطأ:', error.name);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء الإصدار والترقية
      if (error.name === 'VersionError' || error.name === 'DatabaseClosedError' || error.name === 'UpgradeError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها...');
          await dexieDb.delete();
          await dexieDb.open();
          
          // إعادة محاولة حفظ البيانات بعد إعادة إنشاء القاعدة
          return this.savePurchaseOrder(data);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة حفظ البيانات:', retryError);
          return false;
        }
      }
      
      return false;
    }
  },

  /**
   * استرجاع طلب الشراء بناءً على رقم طلب الشراء
   * @param poNumber رقم طلب الشراء
   * @returns بيانات طلب الشراء أو null إذا لم يتم العثور عليه
   */
  async getPurchaseOrder(poNumber: string): Promise<PurchaseOrderData | null> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cached = dbCache.get(`po_${poNumber}`);
      if (cached) return cached;
      
      const data = await dexieDb.purchase_orders
        .where('po_number')
        .equals(poNumber)
        .first();
      
      // تخزين النتيجة في الذاكرة المؤقتة
      if (data) dbCache.set(`po_${poNumber}`, data);
      
      return data || null;
    } catch (error: any) {
      console.error('خطأ في استرجاع طلب الشراء:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getPurchaseOrder(poNumber);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return null;
        }
      }
      
      return null;
    }
  },

  /**
   * استرجاع طلب الشراء بناءً على رقم المعاملة
   * @param transactionNumber رقم المعاملة
   * @returns بيانات طلب الشراء أو null إذا لم يتم العثور عليه
   */
  async getPurchaseOrderByTransaction(transactionNumber: string): Promise<PurchaseOrderData | null> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cached = dbCache.get(`txn_${transactionNumber}`);
      if (cached) return cached;
      
      const data = await dexieDb.purchase_orders
        .where('transaction_number')
        .equals(transactionNumber)
        .first();
      
      // تخزين النتيجة في الذاكرة المؤقتة
      if (data) dbCache.set(`txn_${transactionNumber}`, data);
      
      return data || null;
    } catch (error: any) {
      console.error('خطأ في استرجاع طلب الشراء بناءً على رقم المعاملة:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getPurchaseOrderByTransaction(transactionNumber);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return null;
        }
      }
      
      return null;
    }
  },

  /**
   * استرجاع طلبات الشراء حسب نطاق الأرقام
   * @param startPO رقم طلب الشراء الأول
   * @param endPO رقم طلب الشراء الأخير
   * @returns مصفوفة من طلبات الشراء
   */
  async getPurchaseOrdersByRange(startPO: string, endPO: string): Promise<PurchaseOrderData[]> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cacheKey = `range_${startPO}_${endPO}`;
      const cached = dbCache.get(cacheKey);
      if (cached) return cached;
      
      const data = await dexieDb.purchase_orders
        .where('po_number')
        .between(startPO, endPO + '\uffff')
        .toArray();
      
      // تخزين النتيجة في الذاكرة المؤقتة
      dbCache.set(cacheKey, data);
      
      return data;
    } catch (error: any) {
      console.error('خطأ في استرجاع طلبات الشراء حسب النطاق:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getPurchaseOrdersByRange(startPO, endPO);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return [];
        }
      }
      
      return [];
    }
  },

  /**
   * حذف طلب الشراء من قاعدة البيانات
   * @param poNumber رقم طلب الشراء
   * @returns true إذا تم الحذف بنجاح، false في حالة الفشل
   */
  async deletePurchaseOrder(poNumber: string): Promise<boolean> {
    try {
      await dexieDb.transaction('rw', [
        dexieDb.purchase_orders, 
        dexieDb.priceOffers, 
        dexieDb.excludedOffers, 
        dexieDb.items
      ], async () => {
        // البحث عن طلب الشراء وحذفه
        const orderToDelete = await dexieDb.purchase_orders
          .where('po_number')
          .equals(poNumber)
          .first();
        
        if (orderToDelete?.id) {
          await dexieDb.purchase_orders.delete(orderToDelete.id);
        }
        
        // حذف البيانات المرتبطة به
        await dexieDb.items.where('po_id').equals(poNumber).delete();
        await dexieDb.priceOffers.where('po_id').equals(poNumber).delete();
        await dexieDb.excludedOffers.where('po_id').equals(poNumber).delete();
      });
      
      // مسح الذاكرة المؤقتة بعد الحذف الناجح
      dbCache.clear();
      console.log(`تم حذف طلب الشراء ${poNumber} بنجاح`);
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف طلب الشراء:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      return false;
    }
  },

  /**
   * استرجاع طلبات الشراء حسب نطاق التاريخ لتقرير الخلاصة
   * @param startDate تاريخ البداية (YYYY-MM-DD)
   * @param endDate تاريخ النهاية (YYYY-MM-DD)
   * @returns مصفوفة من طلبات الشراء في النطاق المحدد
   */
  async getPurchaseOrdersByDateRange(startDate: string, endDate: string): Promise<PurchaseOrderData[]> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cacheKey = `date_${startDate}_${endDate}`;
      const cached = dbCache.get(cacheKey);
      if (cached) return cached;
      
      // حدود اليوم بتوقيت UTC لضمان شمول اليوم كاملاً
      const startIso = `${startDate}T00:00:00.000Z`;
      const endIso = `${endDate}T23:59:59.999Z`;
      
      // استراتيجية البحث المتعددة المراحل لتحسين الأداء
      try {
        // أولاً: البحث في created_at إذا كان موجوداً (مفهرس)
        const viaCreatedAt = await dexieDb.purchase_orders
          .where('created_at')
          .between(startIso, endIso)
          .toArray();
        
        if (viaCreatedAt.length > 0) {
          dbCache.set(cacheKey, viaCreatedAt);
          return viaCreatedAt;
        }
      } catch (e1) {
        console.log('البحث عبر created_at لم ينجح:', e1.message);
      }
      
      try {
        // ثانياً: البحث في record_date إذا كان موجوداً
        const viaRecordDate = await dexieDb.purchase_orders
          .where('record_date')
          .between(startDate, endDate)
          .toArray();
        
        if (viaRecordDate.length > 0) {
          dbCache.set(cacheKey, viaRecordDate);
          return viaRecordDate;
        }
      } catch (e2) {
        console.log('البحث عبر record_date لم ينجح:', e2.message);
      }
      
      // ثالثاً: البحث عبر جميع السجلات والتصفية محلياً
      console.log('استخدام البحث المحلي للنطاق الزمني...');
      const allOrders = await dexieDb.purchase_orders.toArray();
      const filteredOrders = allOrders.filter((order: any) => {
        const orderDate = order.record_date || order.created_at?.split('T')[0];
        return orderDate && orderDate >= startDate && orderDate <= endDate;
      });
      
      dbCache.set(cacheKey, filteredOrders);
      return filteredOrders;
    } catch (error: any) {
      console.error('خطأ في استرجاع طلبات الشراء حسب نطاق التاريخ:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getPurchaseOrdersByDateRange(startDate, endDate);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return [];
        }
      }
      
      return [];
    }
  },

  /**
   * استرجاع جميع طلبات الشراء
   * @returns مصفوفة من جميع طلبات الشراء
   */
  async getAllPurchaseOrders(): Promise<PurchaseOrderData[]> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cached = dbCache.get('all_orders');
      if (cached) return cached;
      
      const data = await dexieDb.purchase_orders.toArray();
      
      // تخزين النتيجة في الذاكرة المؤقتة
      dbCache.set('all_orders', data);
      
      return data;
    } catch (error: any) {
      console.error('خطأ في استرجاع جميع طلبات الشراء:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getAllPurchaseOrders();
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return [];
        }
      }
      
      return [];
    }
  },

  /**
   * استرجاع طلب شراء مع جميع البيانات المرتبطة به
   * @param poNumber رقم طلب الشراء
   * @returns كائن يحتوي على بيانات طلب الشراء والعروض المرتبطة به
   */
  async getPurchaseOrderWithDetails(poNumber: string): Promise<{
    purchaseOrder: PurchaseOrderData | null;
    items: ItemData[];
    priceOffers: PriceOfferData[];
    excludedOffers: ExcludedOfferData[];
  }> {
    try {
      // التحقق من الذاكرة المؤقتة أولاً
      const cacheKey = `details_${poNumber}`;
      const cached = dbCache.get(cacheKey);
      if (cached) return cached;
      
      // استخدام Promise.all لاسترجاع البيانات بشكل متوازي
      const [purchaseOrder, items, priceOffers, excludedOffers] = await Promise.all([
        dexieDb.purchase_orders.where('po_number').equals(poNumber).first(),
        dexieDb.items.where('po_id').equals(poNumber).toArray(),
        dexieDb.priceOffers.where('po_id').equals(poNumber).toArray(),
        dexieDb.excludedOffers.where('po_id').equals(poNumber).toArray()
      ]);
      
      const result = {
        purchaseOrder: purchaseOrder || null,
        items,
        priceOffers,
        excludedOffers
      };
      
      // تخزين النتيجة في الذاكرة المؤقتة
      dbCache.set(cacheKey, result);
      
      return result;
    } catch (error: any) {
      console.error('خطأ في استرجاع طلب الشراء مع تفاصيله:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // معالجة أخطاء ترقية قاعدة البيانات
      if (error.name === 'UpgradeError' || error.name === 'VersionError') {
        try {
          console.log('محاولة حذف قاعدة البيانات وإعادة إنشائها بسبب تعارض في المخطط...');
          await dexieDb.delete();
          await dexieDb.open();
          console.log('تم إعادة إنشاء قاعدة البيانات بنجاح');
          
          // إعادة محاولة العملية بعد إعادة إنشاء القاعدة
          return this.getPurchaseOrderWithDetails(poNumber);
        } catch (retryError: any) {
          console.error('فشلت إعادة محاولة استرجاع البيانات:', retryError);
          return {
            purchaseOrder: null,
            items: [],
            priceOffers: [],
            excludedOffers: []
          };
        }
      }
      
      return {
        purchaseOrder: null,
        items: [],
        priceOffers: [],
        excludedOffers: []
      };
    }
  },

  /**
   * إنشاء نسخة احتياطية من قاعدة البيانات
   * @returns كائن JSON يحتوي على جميع البيانات
   */
  async backupDatabase(): Promise<string> {
    try {
      console.log('بدء إنشاء نسخة احتياطية من قاعدة البيانات...');
      
      // استخدام Promise.all لتحسين الأداء
      const [purchaseOrders, items, priceOffers, excludedOffers] = await Promise.all([
        dexieDb.purchase_orders.toArray(),
        dexieDb.items.toArray(),
        dexieDb.priceOffers.toArray(),
        dexieDb.excludedOffers.toArray()
      ]);
      
      const backup = {
        purchaseOrders,
        items,
        priceOffers,
        excludedOffers,
        timestamp: new Date().toISOString(),
        version: 310,
        metadata: {
          totalPurchaseOrders: purchaseOrders.length,
          totalItems: items.length,
          totalPriceOffers: priceOffers.length,
          totalExcludedOffers: excludedOffers.length
        }
      };
      
      console.log('تم إنشاء نسخة احتياطية بنجاح');
      return JSON.stringify(backup);
    } catch (error: any) {
      console.error('خطأ في إنشاء نسخة احتياطية من قاعدة البيانات:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      throw error;
    }
  },

  /**
   * استعادة قاعدة البيانات من نسخة احتياطية
   * @param backupData بيانات النسخة الاحتياطية
   * @returns true إذا تمت الاستعادة بنجاح، false في حالة الفشل
   */
  async restoreDatabase(backupData: string): Promise<boolean> {
    try {
      console.log('بدء استعادة قاعدة البيانات من النسخة الاحتياطية...');
      
      const backup = JSON.parse(backupData);
      
      // التحقق من صحة بيانات النسخة الاحتياطية
      if (!backup.purchaseOrders || !backup.priceOffers || !backup.excludedOffers || !backup.items) {
        throw new Error('بيانات النسخة الاحتياطية غير صالحة: بعض الجداول مفقودة');
      }
      
      // التحقق من الإصدار
      if (backup.version && backup.version > 310) {
        throw new Error(`إصدار النسخة الاحتياطية (${backup.version}) غير مدعوم. الحد الأقصى هو 310`);
      }
      
      // حذف البيانات الحالية
      await dexieDb.transaction('rw', [
        dexieDb.purchase_orders, 
        dexieDb.items, 
        dexieDb.priceOffers, 
        dexieDb.excludedOffers
      ], async () => {
        await dexieDb.purchase_orders.clear();
        await dexieDb.items.clear();
        await dexieDb.priceOffers.clear();
        await dexieDb.excludedOffers.clear();
        
        // استعادة البيانات من النسخة الاحتياطية
        await dexieDb.purchase_orders.bulkPut(backup.purchaseOrders);
        await dexieDb.items.bulkPut(backup.items);
        await dexieDb.priceOffers.bulkPut(backup.priceOffers);
        await dexieDb.excludedOffers.bulkPut(backup.excludedOffers);
      });
      
      // مسح الذاكرة المؤقتة بعد الاستعادة الناجحة
      dbCache.clear();
      console.log('تم استعادة قاعدة البيانات بنجاح');
      console.log('الإحصائيات المستعادة:', backup.metadata);
      
      return true;
    } catch (error: any) {
      console.error('خطأ في استعادة قاعدة البيانات:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      return false;
    }
  },

  /**
   * حذف قاعدة البيانات بالكامل وإعادة إنشائها
   * @returns true إذا تمت إعادة التعيين بنجاح، false في حالة الفشل
   */
  async resetDatabase(): Promise<boolean> {
    try {
      console.log('محاولة حذف قاعدة البيانات الحالية...');
      await dexieDb.delete();
      console.log('تم حذف قاعدة البيانات بنجاح');
      
      // إعادة فتح قاعدة البيانات
      await dexieDb.open();
      console.log('تم إعادة فتح قاعدة البيانات بنجاح');
      
      // مسح الذاكرة المؤقتة
      dbCache.clear();
      
      return true;
    } catch (error: any) {
      console.error('فشل في إعادة تعيين قاعدة البيانات:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      return false;
    }
  },

  /**
   * جلب جميع طلبات الشراء (للتصدير والتقارير)
   * هذه الدالة مضافة لتحقيق التوافق مع مكونات التقارير
   * @returns مصفوفة من جميع طلبات الشراء
   */
  async listAllPurchaseOrders(): Promise<PurchaseOrderData[]> {
    return this.getAllPurchaseOrders();
  },

  /**
   * التحقق من وجود طلب شراء بناءً على رقم الطلب ورقم المعاملة
   * @param poNumber رقم طلب الشراء
   * @param transactionNumber رقم المعاملة
   * @returns كائن يحتوي على معلومات حول وجود البيانات
   */
  async checkDuplicatePurchaseOrder(poNumber: string, transactionNumber: string): Promise<{
    dataExists: boolean;
    isDuplicate: boolean;
    message: string;
    details?: {
      existingByPO?: boolean;
      existingByTransaction?: boolean;
    };
  }> {
    try {
      console.log(`التحقق من التكرار: PO=${poNumber}, Transaction=${transactionNumber}`);
      
      // استخدام Promise.all للتحقق الموازي
      const [existingByPO, existingByTransaction] = await Promise.all([
        this.getPurchaseOrder(poNumber),
        this.getPurchaseOrderByTransaction(transactionNumber)
      ]);
      
      if (existingByPO && existingByTransaction) {
        return {
          dataExists: true,
          isDuplicate: true,
          message: 'يوجد بالفعل طلب شراء بنفس رقم الطلب ورقم المعاملة',
          details: {
            existingByPO: true,
            existingByTransaction: true
          }
        };
      } else if (existingByPO) {
        return {
          dataExists: true,
          isDuplicate: false,
          message: 'يوجد بالفعل طلب شراء بنفس رقم الطلب ولكن برقم معاملة مختلف',
          details: {
            existingByPO: true,
            existingByTransaction: false
          }
        };
      } else if (existingByTransaction) {
        return {
          dataExists: true,
          isDuplicate: false,
          message: 'يوجد بالفعل طلب شراء بنفس رقم المعاملة ولكن برقم طلب مختلف',
          details: {
            existingByPO: false,
            existingByTransaction: true
          }
        };
      }
      
      return {
        dataExists: false,
        isDuplicate: false,
        message: 'لا توجد بيانات مكررة'
      };
    } catch (error: any) {
      console.error('خطأ في التحقق من التكرار:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      return {
        dataExists: false,
        isDuplicate: false,
        message: 'حدث خطأ أثناء التحقق من التكرار'
      };
    }
  },

  /**
   * صيانة قاعدة البيانات (إعادة بناء الفهارس)
   * @returns true إذا تمت الصيانة بنجاح
   */
  async maintainDatabase(): Promise<boolean> {
    try {
      console.log('بدء صيانة قاعدة البيانات...');
      
      // التحقق من وجود مشاكل في الفهارس
      const testCount = await dexieDb.purchase_orders.count();
      console.log(`عدد السجلات الموجودة: ${testCount}`);
      
      // إعادة بناء الفهارس إذا لزم الأمر
      await dexieDb.close();
      await dexieDb.open();
      
      console.log('تمت صيانة قاعدة البيانات بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في صيانة قاعدة البيانات:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      
      // محاولة إصلاح عن طريق إعادة التعيين
      try {
        console.log('محاولة إصلاح قاعدة البيانات عن طريق إعادة التعيين...');
        return this.resetDatabase();
      } catch (resetError) {
        console.error('فشل إصلاح قاعدة البيانات:', resetError);
        return false;
      }
    }
  },

  /**
   * الحصول على إحصائيات قاعدة البيانات
   * @returns إحصائيات حول حجم البيانات المخزنة
   */
  async getDatabaseStats(): Promise<{
    purchaseOrders: number;
    items: number;
    priceOffers: number;
    excludedOffers: number;
    lastBackup?: string;
  }> {
    try {
      const [purchaseOrders, items, priceOffers, excludedOffers] = await Promise.all([
        dexieDb.purchase_orders.count(),
        dexieDb.items.count(),
        dexieDb.priceOffers.count(),
        dexieDb.excludedOffers.count()
      ]);
      
      // الحصول على تاريخ آخر نسخة احتياطية
      let lastBackup: string | undefined;
      try {
        const backupData = await this.backupDatabase();
        const backup = JSON.parse(backupData);
        lastBackup = backup.timestamp;
      } catch {
        // تجاهل خطأ النسخ الاحتياطي
      }
      
      return {
        purchaseOrders,
        items,
        priceOffers,
        excludedOffers,
        lastBackup
      };
    } catch (error: any) {
      console.error('خطأ في الحصول على إحصائيات قاعدة البيانات:', error);
      return {
        purchaseOrders: 0,
        items: 0,
        priceOffers: 0,
        excludedOffers: 0
      };
    }
  }
};

// ==============================
// معالجة أخطاء غير متوقعة (Global Error Handlers)
// ==============================

/**
 * معالج أخطاء قاعدة البيانات غير المعالجة
 */
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason as Error;
  
  if (error.name === 'QuotaExceededError') {
    console.error('خطأ: مساحة التخزين ممتلية');
    alert('مساحة التخزين ممتلئة. يرجى مسح بعض البيانات أو زيادة مساحة التخزين.');
  } else if (error.name === 'InvalidStateError') {
    console.error('خطأ: حالة قاعدة البيانات غير صالحة');
    alert('حدث خطأ في قاعدة البيانات. سيتم إعادة تعيينها تلقائياً.');
    db.resetDatabase();
  } else {
    console.error('خطأ غير معالج في قاعدة البيانات:', error);
  }
});

// ==============================
// تصدير الوحدة النمطذجية (ES Module)
// ==============================

export default db;



// =====================================================================================================
// خطط ERD مبسط يوضح العلاقات بين الجداول في قاعدة بياناتك (Dexie / IndexedDB) حسب الكود المدمج:

// 📌 الكيانات (Entities)
// 1. PurchaseOrders (طلبات الشراء)

// id (PK)

// po_number (🔑 فريد لربط البيانات)

// transaction_number

// requesting

// beneficiary

// purchaseMethod

// items_count

// subject

// financial_classification

// record_number

// record_date

// created_by

// created_at

// updated_at

// recommendation (اختياري)

// 2. Items (الأصناف المطلوبة)

// id (PK)

// po_id (FK → PurchaseOrders.po_number)

// code

// name

// quantity

// unit

// estimatedCost {amount, currency, equivalentInYR}

// specifications (JSON key/value)

// 3. PriceOffers (عروض الأسعار)

// id (PK)

// po_id (FK → PurchaseOrders.po_number)

// vendor

// amount

// currency

// exchangeRate

// taxIncluded

// total

// totalInYR

// totalInWords

// result (مطابق/غير مطابق/جزئي)

// notes

// commitments (array of strings)

// items (embedded PriceOfferItem[])

// 4. PriceOfferItems (تفاصيل الأصناف في العروض) (مخزنة داخل PriceOffers.items)

// id

// itemName

// quantity

// unitPrice

// totalPrice

// specifications (JSON key/value)

// vendorSpecifications (JSON key/value)

// commitments

// 5. ExcludedOffers (العروض المستبعدة)

// id (PK)

// po_id (FK → PurchaseOrders.po_number)

// vendor

// reason

// notes

// priceReason

// colorReason

// specReasons (array of strings)

// 📊 العلاقات (Relationships)

// PurchaseOrders (1) ⟶ (N) Items
// كل طلب شراء يحتوي على عدة أصناف.

// PurchaseOrders (1) ⟶ (N) PriceOffers
// كل طلب شراء له عدة عروض أسعار من موردين مختلفين.

// PurchaseOrders (1) ⟶ (N) ExcludedOffers
// كل طلب شراء قد يكون له عدة عروض مستبعدة.

// PriceOffers (1) ⟶ (N) PriceOfferItems (embedded)
// كل عرض سعر يحتوي تفاصيل أصناف العرض.

// 🖼 تمثيل مرئي (بصيغة نصية مبسطة)
// PurchaseOrders (po_number) 
//  ├── Items (po_id)
//  ├── PriceOffers (po_id)
//  │     └── PriceOfferItems (embedded inside PriceOffers.items)
//  └── ExcludedOffers (po_id)



// ======================================


// الاصل
// import Dexie, { Table } from 'dexie';

// /**
//  * واجهة بيانات طلب الشراء في قاعدة البيانات
//  */
// interface PurchaseOrderData {
//   po_number: string;           // رقم طلب الشراء (المفتاح الأساسي)
//   transaction_number: string;  // رقم المعاملة
//   requesting: string;          // الجهة الطالبة
//   beneficiary: string;         // الجهة المستفيدة

//   // الأصناف والعروض
//   items: any[];                // الأصناف المطلوبة (يمكن لكل سطر أن يحتوي على line_note "ملاحظات السطر")
//   price_offers: any[];         // عروض الأسعار (يمكن لكل عرض أن يحتوي على offer_note "ملاحظات العرض")
//   excluded_offers: any[];      // العروض المستبعدة
//   recommendation: any;         // التوصية النهائية
//   offer_count: number;         // عدد العروض

//   // حقول رأس الصفحة (مطلوبة من المستخدم)
//   username?: string;                 // اسم المستخدم الذي قام بإعداد الطلب
//   final_approval_status?: string;    // حالة الاعتماد النهائي (مثلاً: معتمد/غير معتمد/قيد المراجعة)
//   general_notes?: string;            // ملاحظات عامة على الطلب
//   header_offer_note?: string;        // ملاحظات العرض (افتراضية على مستوى رأس الطلب إن لزم)
//   header_line_item_note?: string;    // ملاحظات السطر (افتراضية على مستوى رأس الطلب إن لزم)

//   // التاريخ/الوقت
//   date: string;                // التاريخ/الوقت بصيغة ISO (للخلفية والتوافق)
//   date_only?: string;          // تاريخ فقط بصيغة YYYY-MM-DD (إنجليزي)
//   time_only?: string;          // وقت فقط بصيغة HH:mm:ss (إنجليزي)

//   // إجمالي المبلغ المرسى عليه بالريال اليمني (اختياري لسهولة التقارير)
//   awarded_total_yer?: number;
//   awarded_total_yer_words?: string; // كتابة
// }

// /**
//  * فئة قاعدة البيانات المحلية باستخدام Dexie (IndexedDB)
//  */
// class PurchaseOrderDB extends Dexie {
//   purchase_orders!: Table<PurchaseOrderData>;

//   constructor() {
//     super('PurchaseOrderDB');

//     // الإصدار السابق (للتوافق مع المستخدمين الحاليين)
//     this.version(30).stores({
//       purchase_orders: 'po_number, transaction_number, requesting, beneficiary, date, offer_count'
//     });

//     // الإصدار الجديد: إضافة date_only + time_only وفهارس إضافية
//     this.version(31)
//       .stores({
//         // po_number مفتاح أساسي، والبقية فهارس إضافية للاستعلامات الشائعة
//         purchase_orders:
//           'po_number, transaction_number, requesting, beneficiary, date, date_only, time_only, offer_count'
//       })
//       .upgrade(async (tx) => {
//         // ترحيل البيانات القديمة: توليد date_only و time_only من date إن كانت مفقودة
//         const table = tx.table<PurchaseOrderData>('purchase_orders');
//         await table.toCollection().modify((obj) => {
//           try {
//             if (!obj.date_only && obj.date) {
//               const d = new Date(obj.date);
//               if (!isNaN(d.getTime())) {
//                 const iso = d.toISOString();
//                 obj.date_only = iso.slice(0, 10);        // YYYY-MM-DD
//                 obj.time_only = iso.slice(11, 19);       // HH:mm:ss
//               }
//             }
//           } catch {
//             // تجاهل أخطاء الترحيل الفردية
//           }
//         });
//       });
//   }
// }

// // إنشاء مثيل قاعدة البيانات
// const dexieDb = new PurchaseOrderDB();

// /**
//  * مجموعة دوال التفاعل مع قاعدة البيانات
//  */
// export const db = {
//   /**
//    * حفظ طلب الشراء في قاعدة البيانات
//    * @param data بيانات طلب الشراء
//    * @returns true إذا تم الحفظ بنجاح، false في حالة الفشل
//    */
//   async savePurchaseOrder(data: PurchaseOrderData): Promise<boolean> {
//     try {
//       console.log('محاولة حفظ البيانات في قاعدة البيانات:', data.po_number);

//       // ✅ التحقق من صحة البيانات قبل الحفظ
//       if (!data.po_number || data.po_number.trim() === '') {
//         console.error('رقم طلب الشراء مطلوب');
//         return false;
//       }

//       // ✅ التأكد من أن التاريخ بالصيغة الصحيحة
//       if (!data.date || isNaN(new Date(data.date).getTime())) {
//         const now = new Date();
//         const iso = now.toISOString();
//         data.date = iso;
//         data.date_only = iso.slice(0, 10);
//         data.time_only = iso.slice(11, 19);
//       } else {
//         // إن كان date موجوداً ولم تُحدد حقول التاريخ/الوقت المشتقة، نولّدها
//         if (!data.date_only || !data.time_only) {
//           const iso = new Date(data.date).toISOString();
//           data.date_only = data.date_only || iso.slice(0, 10);
//           data.time_only = data.time_only || iso.slice(11, 19);
//         }
//       }

//       // ✅ التأكد من أن البيانات قابلة للتسلسل (serializable)
//       const serializedData = JSON.parse(JSON.stringify(data));
//       console.log('البيانات المسلسلة:', serializedData);

//       await dexieDb.purchase_orders.put(serializedData);
//       console.log('تم حفظ البيانات بنجاح في قاعدة البيانات');
//       return true;
//     } catch (error) {
//       console.error('خطأ في حفظ طلب الشراء:', error);
//       // ✅ تسجيل تفاصيل الخطأ
//       if (error instanceof Error) {
//         console.error('رسالة الخطأ:', error.message);
//         console.error('نوع الخطأ:', error.name);
//         console.error('Stack trace:', error.stack);
//       }

//       // ✅ محاولة تشخيص المشكلة
//       try {
//         console.log('محاولة تشخيص المشكلة...');
//         console.log('حالة قاعدة البيانات:', dexieDb.isOpen());
//         console.log('اسم قاعدة البيانات:', dexieDb.name);
//       } catch (diagError) {
//         console.error('خطأ في التشخيص:', diagError);
//       }

//       return false;
//     }
//   },

//   /**
//    * استرجاع طلب الشراء بناءً على رقم طلب الشراء
//    * @param poNumber رقم طلب الشراء
//    * @returns بيانات طلب الشراء أو null إذا لم يتم العثور عليه
//    */
//   async getPurchaseOrder(poNumber: string): Promise<PurchaseOrderData | null> {
//     try {
//       const data = await dexieDb.purchase_orders.get(poNumber);
//       return data || null;
//     } catch (error) {
//       console.error('خطأ في استرجاع طلب الشراء:', error);
//       return null;
//     }
//   },

//   /**
//    * استرجاع طلب الشراء بناءً على رقم المعاملة
//    * @param transactionNumber رقم المعاملة
//    * @returns بيانات طلب الشراء أو null إذا لم يتم العثور عليه
//    */
//   async getPurchaseOrderByTransaction(transactionNumber: string): Promise<PurchaseOrderData | null> {
//     try {
//       const data = await dexieDb.purchase_orders
//         .where('transaction_number')
//         .equals(transactionNumber)
//         .first();
//       return data || null;
//     } catch (error) {
//       console.error('خطأ في استرجاع طلب الشراء بناءً على رقم المعاملة:', error);
//       return null;
//     }
//   },

//   /**
//    * استرجاع طلبات الشراء حسب نطاق الأرقام
//    * @param startPO رقم طلب الشراء الأول
//    * @param endPO رقم طلب الشراء الأخير
//    * @returns مصفوفة من طلبات الشراء
//    */
//   async getPurchaseOrdersByRange(startPO: string, endPO: string): Promise<PurchaseOrderData[]> {
//     try {
//       return await dexieDb.purchase_orders
//         .where('po_number')
//         .between(startPO, endPO + '\uffff')
//         .toArray();
//     } catch (error) {
//       console.error('خطأ في استرجاع طلبات الشراء حسب النطاق:', error);
//       return [];
//     }
//   },

//   /**
//    * استرجاع طلبات الشراء حسب نطاق التاريخ لتقرير الخلاصة
//    * @param startDate تاريخ البداية (YYYY-MM-DD)
//    * @param endDate تاريخ النهاية (YYYY-MM-DD)
//    * @returns مصفوفة من طلبات الشراء في النطاق المحدد
//    */
//   async getPurchaseOrdersByDateRange(startDate: string, endDate: string): Promise<PurchaseOrderData[]> {
//     try {
//       // أولاً: نعتمد على date_only لضمان مقارنة نصية دقيقة دون مشاكل المناطق الزمنية
//       const byDateOnly = await dexieDb.purchase_orders
//         .where('date_only')
//         .between(startDate, endDate)
//         .toArray();

//       if (byDateOnly && byDateOnly.length > 0) return byDateOnly;

//       // ثانياً (Fallback): لبعض السجلات القديمة التي قد لا تحتوي date_only بعد الترحيل
//       const startIso = `${startDate}T00:00:00.000Z`;
//       const endIso = `${endDate}T23:59:59.999Z`;
//       const byDateIso = await dexieDb.purchase_orders
//         .where('date')
//         .between(startIso, endIso)
//         .toArray();
//       return byDateIso;
//     } catch (error) {
//       console.error('خطأ في استرجاع طلبات الشراء حسب نطاق التاريخ:', error);
//       return [];
//     }
//   },

//   /**
//    * جلب جميع طلبات الشراء (للتصدير)
//    */
//   async listAllPurchaseOrders(): Promise<PurchaseOrderData[]> {
//     try {
//       return await dexieDb.purchase_orders.toArray();
//     } catch (error) {
//       console.error('خطأ في جلب جميع طلبات الشراء:', error);
//       return [];
//     }
//   },

//   /**
//    * حذف طلب شراء بواسطة رقم طلب الشراء
//    */
//   async deletePurchaseOrder(poNumber: string): Promise<boolean> {
//     try {
//       await dexieDb.purchase_orders.delete(poNumber);
//       return true;
//     } catch (error) {
//       console.error('خطأ في حذف طلب الشراء:', error);
//       return false;
//     }
//   }
// };





