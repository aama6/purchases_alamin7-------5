// purchases_alamin5-copy5\src\types\index.ts

export interface PurchaseOrderItem {
  poNumber: number;
  // 🟢 رقم الصنف (اختياري)
  code?: string;
  id: string;
  name: string;
  quantity: number;
  unit: string;
  selected: boolean;
  lineNumber: number; // إضافة رقم السطر

  // إضافة الخصائص الجديدة

  estimatedCost?: {
    amount: number;
    currency: string;
    equivalentInYR?: number;
  };
  specifications?: {
    color?: string;
    type?: string;
    material?: string;
    // [key: string]: string;
    [key: string]: string | undefined;
  };
}

// 🟢 سطر جديد: تعريف بنية أصناف العرض لكل مورد
export interface OfferLineItem {
  specifications: any;
  itemId: string;           // معرف الصنف الأصلي
  lineNumber: number;       // رقم السطر من جدول الأصناف
  name: string;             // بيان الصنف
  unit: string;             // وحدة القياس
  requestedQty: number;     // الكمية المطلوبة من جدول الأصناف
  offeredQty: number;       // الكمية المقدمة من المورد
  // سعر الوحدة المستخدم داخلياً في المقارنة والحسابات الافتراضية
  // سنحافظ عليه كسعر بعد الضريبة لضمان الاتساق مع بقية الشاشات
  unitPrice: number;        // سعر الوحدة (بعد الضريبة)
  // حقول اختيارية لدعم قبل/بعد الضريبة في وضع غير شامل
  unitPriceBeforeTax?: number;   // سعر الوحدة قبل الضريبة (إدخال يدوي عند غير شامل)
  unitPriceAfterTax?: number;    // سعر الوحدة بعد الضريبة (يُحسب تلقائياً)
  lineTotal: number;        // إجمالي السطر (بعد الضريبة) = offeredQty * unitPrice
  lineTotalBeforeTax?: number; // إجمالي السطر قبل الضريبة
  lineTotalAfterTax?: number;  // إجمالي السطر بعد الضريبة
  awarded: boolean;         // هل تم الترسية على هذا السطر (للترسية الجزئية)
  awardedQty?: number;      // الكمية المرسى عليها (لا تؤثر على إجمالي العرض، فقط التوصية)
  
  // 🟢 جديد: ملاحظات السطر
  lineNote?: string;        // ملاحظات خاصة بهذا السطر ضمن عرض المورد
  
  // 🟢 جديد: مواصفات المورد لهذا السطر (نفس مفاتيح مواصفات طلب الشراء)
  // vendorSpecifications?: { [key: string]: string };

  // 🟢 جديد: التزامات المورد لهذا السطر (تُعرض في التوصية عند الترسية)
  commitment?: string;
  vendorSpecifications?: {
    color?: string;
    type?: string;
    material?: string;
    // [key: string]: string;
    [key: string]: string | undefined;
  };
  commitments?: string[];
}


export interface PriceOffer {
  totalAfterTax: undefined;  // الاجمالي بعد الضريبة
  totalAfterTaxInYR: undefined; // المجموع بعد ضريبة القيمة المضافة بالريال اليمني
  notes: string;
  items: PriceOffer | undefined;
  id: string;
  vendor: string;
  offerNumber: string; // رقم العرض
  amount: number;      // إجمالي قيمة العرض (مجموع أسطر الترسية)
  // سطر جديد لمعالجة اضافة النقطة الفاصلة العشرية
  inputValue?: string;  // لحفظ قيمة المدخل مؤقتاً
  currency: Currency;
  exchangeRate?: number;
  totalInYR?: number;  // المبلغ المعادل بالريال 
  // 🟢 تغيير: السماح بحالة "اختر" عبر قيمة null
  taxIncluded: boolean | null; // null = اختر، true = شامل، false = غير شامل
  total: number; // إجمالي قيمة العرض (مجموع أسطر الترسية)
  totalInWords: string;
  result: OfferResult;
  
  // 🟢 جديد: ملاحظات العرض
  offerNote?: string;         // ملاحظات تخص عرض المورد ككل

  // 🟢 جديد: التزامات المورد على مستوى العرض الكامل (تظهر في التوصية تحت إجماليه)
  commitments?: string[];
  
  // 🟢 سطر جديد: أصناف العرض لكل مورد
  lineItems?: OfferLineItem[];
}

export interface ExcludedOffer {
  id: string;
  vendor: string;
  reason: string;
  notes: string;
  // سطر جديد  
  // يمكن استخدامه لتحديد حالة العرض المستبعد
  // مثل 'مطابق' أو 'غير مطابق' أو 'مطابق جزئي'
  result?: string; // إضافة هذه السطر

}


// export interface RecommendationLineItem {
//   lineNumber: number;
//   name: string;
//   unit: string;
//   awardedQty: number;
//   unitPrice: number;
//   total: number;
//   commitments: string[];
// }


export interface RecommendedOffer {
  lineItems: any;
  totalInYR: number;
  vendor: string;
  amount: number;
  currency: string;
  amountInWords: string;
  manualAmount?: number; // المبلغ المعدل يدوياً لهذا المورد
  isManualAmount?: boolean; // هل تم تعديل المبلغ يدوياً لهذا المورد
  // 🟢 سطر جديد: أرقام الأسطر التي تمت الترسية عليها (للنص التوضيحي)
  awardedLineNumbers?: number[];
}

// تعريفات جديده 
export interface PurchaseOrder {
  ponumber: string;
  vendorName: string;
  currencyCode: string;
  date?: Date;
  deliveryDate?: Date;
}
// =================

export interface Recommendation {
  selectedOffers: RecommendedOffer[]; // قائمة العروض الموصى بها
  totalAwardedInYR?: number; // إجمالي المبلغ المرساة عليه بالريال (رقماً)
  totalAwardedInYRWords?: string; // إجمالي المبلغ المرساة عليه بالريال (كتابة)
}

export type Currency = 'ريال' | 'دولار' | 'ريال سعودي' | 'يورو';
// export type OfferResult = 'مطابق' | 'غير مطابق' | 'مطابق جزئي' |  '';
export type OfferResult = 'مطابق' | 'غير مطابق' | 'مطابق جزئي' |  ''; // 🟢 السماح بحالة فارغة (اختر)