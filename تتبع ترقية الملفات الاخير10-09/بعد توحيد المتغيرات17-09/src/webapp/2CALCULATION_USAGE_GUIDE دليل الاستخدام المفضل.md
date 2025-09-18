# دليل استخدام ملف الحسابات الموحد (calculation.ts)
<!-- يحتوي عل 
📖 دليل الاستخدام المفصل
🔄 كيفية استبدال كل دالة قديمة
💡 أمثلة عملية للتطبيق
⭐ فوائد كل تحديث -->

## نظرة عامة
تم إنشاء ملف `calculation.ts` لحل مشكلة تكرار الدوال الحسابية والمتغيرات المتعارضة في التطبيق. يحتوي هذا الملف على جميع الدوال الحسابية المطلوبة لطلبات الشراء وعروض الأسعار.

## الدوال المتكررة التي تم توحيدها

### 1. حسابات المبالغ الأساسية

#### `calculateOfferTotal(lineItems)`
- **الغرض**: حساب إجمالي مبلغ العرض (بعملة العرض) - قبل الضرائب
- **المكان الحالي**: متكررة في `PriceOffersSection.tsx` و `RecommendationSection.tsx`
- **الاستخدام الجديد**:
```typescript
import { calculateOfferTotal } from '../utils/calculation';
const total = calculateOfferTotal(offer.lineItems);
```

#### `calculateOfferTotalAfterTax(lineItems, taxIncluded)`
- **الغرض**: حساب إجمالي مبلغ العرض بعد الضرائب (بعملة العرض)
- **المكان الحالي**: حسابات مبعثرة في عدة ملفات
- **الاستخدام الجديد**:
```typescript
const totalAfterTax = calculateOfferTotalAfterTax(offer.lineItems, offer.taxIncluded);
```

#### `calculateTotalInYR(totalAmount, exchangeRate)`
- **الغرض**: حساب المعادل بالريال اليمني
- **المكان الحالي**: متكررة في جميع المكونات
- **الاستخدام الجديد**:
```typescript
const totalInYR = calculateTotalInYR(totalAmount, exchangeRate);
```

### 2. حسابات المبالغ المرسى عليها

#### `calculateAwardedAmount(lineItems, taxIncluded)`
- **الغرض**: حساب إجمالي مبلغ الكميات المرسى عليها (بعد الضريبة)
- **المكان الحالي**: دالة `calculateAwardedAmount` في `RecommendationSection.tsx`
- **الاستخدام الجديد**:
```typescript
const awardedAmount = calculateAwardedAmount(lineItems, taxIncluded);
```

#### `calculateTotalAwardedAmount(selectedOffers)`
- **الغرض**: حساب إجمالي المبلغ المرسى عليه لجميع الموردين مع التحويل للكلمات
- **المكان الحالي**: دالة `updateTotalAwardedInYR` في `RecommendationSection.tsx`
- **الاستخدام الجديد**:
```typescript
const totals = calculateTotalAwardedAmount(selectedOffers);
// النتيجة تحتوي على: amount, currency, amountInWords, totalInYR, totalInYRWords
```

### 3. حسابات التكلفة التقديرية

#### `calculateTotalEstimatedCost(estimatedCosts)`
- **الغرض**: حساب إجمالي التكلفة التقديرية (بالعملة المدخلة)
- **المكان الحالي**: دالة `getTotalEstimatedCost` في `ComparisonPage.tsx`
- **الاستخدام الجديد**:
```typescript
const totals = calculateTotalEstimatedCost(estimatedCosts);
// النتيجة: { [currency: string]: number }
```

#### `calculateTotalEstimatedCostInYR(estimatedCosts, exchangeRates)`
- **الغرض**: حساب إجمالي التكلفة التقديرية (المعادل بالريال)
- **الاستخدام الجديد**:
```typescript
const totalInYR = calculateTotalEstimatedCostInYR(estimatedCosts, exchangeRates);
```

### 4. حسابات فروق الأسعار (تم إصلاحها)

#### `calculatePriceDifference(offeredUnitPrice, estimatedUnitCost, currency, exchangeRate)`
- **الغرض**: حساب الفرق في السعر بين التكلفة التقديرية والسعر المقدم للوحدة الواحدة
- **المشكلة المحلولة**: كانت الحسابات تتم على الإجمالي بدلاً من سعر الوحدة
- **الاستخدام الجديد**:
```typescript
const diff = calculatePriceDifference(
  item.unitPrice, 
  estimatedUnitCost, 
  currency, 
  exchangeRate
);
// النتيجة تحتوي على: difference, differenceInYR, percentage, isHigher
```

#### `calculateTotalPriceDifferences(lineItems, estimatedCosts, exchangeRates)`
- **الغرض**: حساب إجمالي فروق الأسعار لجميع الأصناف
- **الاستخدام الجديد**:
```typescript
const totalDiffs = calculateTotalPriceDifferences(lineItems, estimatedCosts, exchangeRates);
// النتيجة: { totalDifference, totalDifferenceInYR, itemDifferences }
```

### 5. دوال رسائل الترسية

#### `calculateAwardMessageAmounts(offer, originalOffer)`
- **الغرض**: حساب جميع المبالغ المطلوبة في رسائل الترسية
- **الاستخدام الجديد**:
```typescript
const amounts = calculateAwardMessageAmounts(recommendedOffer, originalOffer);
// النتيجة تحتوي على جميع المبالغ بالعملتين مع التحويل للكلمات
```

## التحسينات المطلوبة في كل صفحة

### 1. PriceOffersSection.tsx

#### المشاكل الحالية:
- حسابات متكررة ومبعثرة للإجماليات
- عدم تطابق أحياناً بين إجمالي العرض وإجمالي الأصناف
- حسابات الضرائب غير موحدة

#### التحسينات المقترحة:
```typescript
// استبدال الحسابات المتكررة
import { 
  updateOfferCalculations, 
  checkAmountMismatch,
  calculateOfferTotal,
  calculateOfferTotalAfterTax 
} from '../utils/calculation';

// في دالة handleUpdateOffer - استبدال الحسابات المعقدة
const handleUpdateOffer = (index: number, updates: Partial<PriceOffer>) => {
  setPriceOffers(priceOffers.map((offer, i) => {
    if (i === index) {
      const updatedOffer = { ...offer, ...updates };
      // استخدام الدالة الموحدة بدلاً من الحسابات المتكررة
      return updateOfferCalculations(updatedOffer, updatedOffer.taxIncluded);
    }
    return offer;
  }));
};

// في دالة checkAmountConsistency - استبدال بالدالة الموحدة
const checkAmountConsistency = (index: number): boolean => {
  const offer = priceOffers[index];
  if (!offer) return true;
  
  const mismatchCheck = checkAmountMismatch(offer);
  return mismatchCheck.isMatched;
};
```

### 2. RecommendationSection.tsx

#### المشاكل الحالية:
- حسابات متكررة لإجمالي المبالغ المرسى عليها
- عدم توحيد في طريقة حساب المعادل بالريال
- تعقيد في دالة `updateTotalAwardedInYR`

#### التحسينات المقترحة:
```typescript
import { 
  calculateAwardedAmount,
  calculateTotalAwardedAmount,
  updateRecommendedOfferCalculations,
  calculateAwardMessageAmounts
} from '../utils/calculation';

// استبدال دالة toggleVendorSelection
const toggleVendorSelection = (vendor: string) => {
  const selectedOffer = priceOffers.find(offer => offer.vendor === vendor);
  if (!selectedOffer) return;
  
  // استخدام الدالة الموحدة لحساب المبلغ المرسى عليه
  const awardedAmount = calculateAwardedAmount(
    selectedOffer.lineItems || [], 
    selectedOffer.taxIncluded
  );
  
  const newOffer: RecommendedOffer = {
    vendor: selectedOffer.vendor,
    amount: awardedAmount,
    currency: selectedOffer.currency,
    amountInWords: '', // سيتم حسابها في الدالة التالية
    isManualAmount: false,
    totalInYR: 0, // سيتم حسابها في الدالة التالية
    // ... باقي الخصائص
  };
  
  // تحديث الحسابات باستخدام الدالة الموحدة
  const updatedOffer = updateRecommendedOfferCalculations(newOffer, selectedOffer);
  
  // حساب الإجماليات باستخدام الدالة الموحدة
  const newSelectedOffers = existingOfferIndex >= 0 
    ? recommendation.selectedOffers.filter(offer => offer.vendor !== vendor)
    : [...(recommendation?.selectedOffers || []), updatedOffer];
    
  const totals = calculateTotalAwardedAmount(newSelectedOffers);
  setRecommendation({
    selectedOffers: newSelectedOffers,
    ...totals
  });
};
```

### 3. ComparisonPage.tsx

#### المشاكل الحالية:
- خطأ في حساب الفروق (يحسب على الإجمالي بدلاً من سعر الوحدة)
- حسابات معقدة في `getSpecificationDifferences`
- عدم توحيد في حسابات التكلفة التقديرية

#### التحسينات المقترحة:
```typescript
import { 
  calculatePriceDifference,
  calculateTotalEstimatedCost,
  calculateTotalEstimatedCostInYR
} from '../utils/calculation';

// إصلاح دالة getSpecificationDifferences
const getSpecificationDifferences = (vendor: string) => {
  const offer = priceOffers.find(o => o.vendor === vendor);
  if (!offer) return '';
  
  let differences = '';
  
  poItems.forEach(item => {
    const requiredSpecs = getRequiredSpecifications(item.lineNumber);
    const vendorSpecs = getVendorSpecification(vendor, item.lineNumber);
    
    // استخدام الدالة الموحدة لحساب فرق السعر
    const estimatedCostInfo = getEstimatedCostForItem(item.lineNumber);
    const lineItem = offer.lineItems?.find(li =>
      li.lineNumber === item.lineNumber || li.name === item.name
    );
    
    if (lineItem && estimatedCostInfo.amount > 0) {
      const unitPriceAfterTax = lineItem.unitPriceAfterTax || lineItem.unitPrice || 0;
      const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 1);
      
      // استخدام الدالة الموحدة - الإصلاح الرئيسي هنا
      const priceDiff = calculatePriceDifference(
        unitPriceAfterTax, // سعر الوحدة المقدم
        estimatedCostInfo.amount, // التكلفة التقديرية للوحدة
        offer.currency,
        exchangeRate
      );
      
      // عرض النتيجة
      let priceStatus = '';
      if (Math.abs(priceDiff.percentage) < 0.01) {
        priceStatus = 'مطابق';
      } else if (priceDiff.isHigher) {
        priceStatus = `أعلى بنسبة ${priceDiff.percentage.toFixed(2)}%`;
      } else {
        priceStatus = `أقل بنسبة ${Math.abs(priceDiff.percentage).toFixed(2)}%`;
      }
      
      differences += `<p><strong>الفرق في السعر:</strong> ${priceStatus}</p>`;
    }
    
    // باقي كود المواصفات...
  });
  
  return differences;
};

// تحسين حسابات التكلفة التقديرية
const getTotalEstimatedCost = () => {
  const estimatedCosts: { [lineNumber: number]: { amount: number; currency: Currency } } = {};
  
  poItems.forEach(item => {
    if (item.estimatedCost) {
      estimatedCosts[item.lineNumber] = {
        amount: item.estimatedCost.amount * item.quantity,
        currency: item.estimatedCost.currency
      };
    }
  });
  
  return calculateTotalEstimatedCost(estimatedCosts);
};
```

### 4. VendorMessagesModal.tsx (إذا وجد)

#### التحسينات المقترحة:
```typescript
import { calculateAwardMessageAmounts } from '../utils/calculation';

// في دالة إنشاء رسائل الترسية
const generateAwardMessage = (offer: RecommendedOffer) => {
  const originalOffer = priceOffers.find(o => o.vendor === offer.vendor);
  if (!originalOffer) return;
  
  const amounts = calculateAwardMessageAmounts(offer, originalOffer);
  
  // استخدام جميع المبالغ المحسوبة في الرسالة
  const message = `
    تم ترسية المناقصة على الشركة بمبلغ:
    - ${amounts.awardedAmountFormatted} ${amounts.currency}
    - (${amounts.awardedAmountInWords})
    - المعادل: ${amounts.awardedAmountInYRFormatted} ريال يمني
    - (${amounts.awardedAmountInYRWords})
  `;
  
  return message;
};
```

## التحديثات المطلوبة في كل ملف

### ملفات يجب تعديلها:

1. **src/components/PriceOffersSection.tsx**
   - استيراد الدوال من `calculation.ts`
   - استبدال دالة `handleUpdateOffer`
   - استبدال دالة `checkAmountConsistency`
   - حذف الحسابات المتكررة

2. **src/components/RecommendationSection.tsx**
   - استيراد الدوال من `calculation.ts`
   - استبدال دالة `toggleVendorSelection`
   - استبدال دالة `updateTotalAwardedInYR`
   - استبدال دالة `calculateAwardedAmount`

3. **src/components/ComparisonPage.tsx**
   - استيراد الدوال من `calculation.ts`
   - إصلاح دالة `getSpecificationDifferences`
   - استبدال حسابات التكلفة التقديرية
   - استبدال حسابات فروق الأسعار

4. **src/components/VendorMessagesModal.tsx** (إذا وجد)
   - استيراد دوال رسائل الترسية
   - تحديث دوال إنشاء الرسائل

## فوائد التحسين

### 1. **حل تكرار الدوال**
- توحيد جميع الحسابات في مكان واحد
- سهولة الصيانة والتطوير
- تقليل احتمالية الأخطاء

### 2. **إصلاح حسابات الفروق**
- حساب الفرق على مستوى سعر الوحدة بدلاً من الإجمالي
- عرض دقيق للنسب المئوية
- مقارنة صحيحة بين التكلفة المقدرة والسعر المقدم

### 3. **تحسين الأداء**
- تقليل الحسابات المتكررة
- تحسين سرعة تحديث البيانات
- ذاكرة أفضل للتطبيق

### 4. **سهولة الاختبار**
- دوال منفصلة قابلة للاختبار
- إمكانية كتابة اختبارات وحدة
- تتبع أسهل للمشاكل

### 5. **تناسق في النتائج**
- نفس النتائج في جميع أجزاء التطبيق
- عدم تعارض في الحسابات
- موثوقية أعلى للبيانات

## خطة التنفيذ

1. **المرحلة 1**: تطبيق التحسينات على `PriceOffersSection.tsx`
2. **المرحلة 2**: تطبيق التحسينات على `RecommendationSection.tsx`  
3. **المرحلة 3**: إصلاح حسابات الفروق في `ComparisonPage.tsx`
4. **المرحلة 4**: اختبار شامل لجميع الحسابات
5. **المرحلة 5**: تحديث أي ملفات إضافية حسب الحاجة

## ملاحظات مهمة

- **الحفاظ على التعليقات**: جميع التعليقات الحالية ستبقى مع إضافة تعليقات توضيحية جديدة
- **التوافق مع النسخة الحالية**: التحديثات ستكون متدرجة لضمان عدم كسر الوظائف الحالية
- **النسخ الاحتياطية**: يُنصح بعمل نسخة احتياطية قبل التطبيق
- **الاختبار**: اختبار شامل مطلوب بعد كل مرحلة من التحديث