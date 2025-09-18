//  * ملف الحسابات الموحد - calculation.ts
// src/utils/calculation.ts (15,263 حرف) 

// يحتوي على
// ✨ ملف الحسابات الموحد الرئيسي
// 🔧 جميع الدوال المطلوبة مع التوثيق الشامل
// 🛡️ دوال التحقق من صحة البيانات
// 📊 دوال الإحصائيات والتحليل

/**
 * الغرض: حل مشكلة تكرار الدوال الحسابية والمتغيرات المتعارضة
 * 
 * الفوائد:
 * 1. توحيد جميع الحسابات في مكان واحد
 * 2. إصلاح خطأ حساب الفروق 
 * 3. ضمان تطابق النتائج في جميع أجزاء التطبيق
 * 4. سهولة الصيانة والتطوير
 */

  /**
   * ملف الحسابات الموحد - calculation.ts
   * يحتوي على جميع الدوال الحسابية المتعلقة بطلبات الشراء وعروض الأسعار
   * تم إنشاؤه لحل مشكلة تكرار الدوال الحسابية والمتغيرات المتعارضة
   */

import { PriceOffer, OfferLineItem, Currency, RecommendedOffer } from '../types';
import { convertNumberToArabicWords, formatNumberWithCommas } from './numberToWords';

// واجهات للحسابات
export interface CalculationResult {
  amount: number;
  currency: Currency;
  amountInWords: string;
  formattedAmount: string;
}

export interface TotalCalculation extends CalculationResult {
  totalInYR: number;
  totalInYRWords: string;
  exchangeRate: number;
}

export interface EstimatedCostCalculation {
  totalEstimatedCost: number;
  totalEstimatedCostInYR: number;
  unitEstimatedCost: number;
  unitEstimatedCostInYR: number;
  currency: Currency;
  exchangeRate: number;
}

export interface PriceDifferenceCalculation {
  difference: number;
  differenceInYR: number;
  percentage: number;
  isHigher: boolean;
  currency: Currency;
}

/**
 * ==================================================================
 * دوال حساب المبالغ الأساسية
 * ==================================================================
 */

/**
 * حساب إجمالي مبلغ العرض (بعملة العرض) - قبل الضرائب
 */
export function calculateOfferTotal(lineItems: OfferLineItem[]): number {
  return lineItems.reduce((total, item) => {
    const qty = item.offeredQty || 0;
    const price = item.unitPrice || 0;
    return total + (qty * price);
  }, 0);
}

/**
 * حساب إجمالي مبلغ العرض بعد الضرائب (بعملة العرض)
 */
export function calculateOfferTotalAfterTax(
  lineItems: OfferLineItem[],
  taxIncluded: boolean | null = null
): number {
  return lineItems.reduce((total, item) => {
    const qty = item.offeredQty || 0;
    const price = taxIncluded ? (item.unitPriceAfterTax || item.unitPrice || 0) : (item.unitPrice || 0);
    return total + (qty * price);
  }, 0);
}

/**
 * حساب المعادل بالريال اليمني (إجمالي مبلغ العرض بعد الضريبة * سعر الصرف)
 */
export function calculateTotalInYR(
  totalAmount: number,
  exchangeRate: number = 1
): number {
  return totalAmount * exchangeRate;
}

/**
 * ==================================================================
 * دوال حساب المبالغ المرسى عليها
 * ==================================================================
 */

/**
 * حساب إجمالي مبلغ الكميات المرسى عليها (بعد الضريبة) (بعملة العرض)
 */
export function calculateAwardedAmount(
  lineItems: OfferLineItem[],
  taxIncluded: boolean | null = null
): number {
  return lineItems.reduce((total, item) => {
    if (item.awarded || (item.awardedQty && item.awardedQty > 0)) {
      const awardedQty = item.awardedQty || item.offeredQty || 0;
      const unitPrice = taxIncluded ? (item.unitPriceAfterTax || item.unitPrice || 0) : (item.unitPrice || 0);
      return total + (awardedQty * unitPrice);
    }
    return total;
  }, 0);
}

/**
 * حساب المبلغ المرسى عليه بالريال اليمني
 */
export function calculateAwardedAmountInYR(
  awardedAmount: number,
  exchangeRate: number = 1
): number {
  return awardedAmount * exchangeRate;
}

/**
 * حساب إجمالي المبلغ المرسى عليه لجميع الموردين
 */
export function calculateTotalAwardedAmount(
  selectedOffers: RecommendedOffer[]
): TotalCalculation {
  const totalAmount = selectedOffers.reduce((sum, offer) => {
    return sum + (offer.amount || 0);
  }, 0);

  // نفترض أن العملة هي عملة العرض الأول أو الريال كافتراضي
  const currency = selectedOffers.length > 0 ? selectedOffers[0].currency : 'ريال';
  
  // حساب المعادل بالريال اليمني
  const totalInYR = selectedOffers.reduce((sum, offer) => {
    return sum + (offer.totalInYR || 0);
  }, 0);

  return {
    amount: totalAmount,
    currency,
    amountInWords: convertNumberToArabicWords(totalAmount, currency),
    formattedAmount: formatNumberWithCommas(totalAmount),
    totalInYR,
    totalInYRWords: convertNumberToArabicWords(totalInYR, 'ريال يمني'),
    exchangeRate: totalAmount > 0 ? totalInYR / totalAmount : 1
  };
}

/**
 * ==================================================================
 * دوال حساب التكلفة التقديرية
 * ==================================================================
 */

/**
 * حساب إجمالي التكلفة التقديرية (بالعملة المدخلة)
 */
export function calculateTotalEstimatedCost(
  estimatedCosts: { [lineNumber: number]: { amount: number; currency: Currency } }
): { [currency: string]: number } {
  const totals: { [currency: string]: number } = {};
  
  Object.values(estimatedCosts).forEach(cost => {
    const currency = cost.currency || 'ريال';
    totals[currency] = (totals[currency] || 0) + (cost.amount || 0);
  });
  
  return totals;
}

/**
 * حساب إجمالي التكلفة التقديرية (المعادل بالريال)
 */
export function calculateTotalEstimatedCostInYR(
  estimatedCosts: { [lineNumber: number]: { amount: number; currency: Currency } },
  exchangeRates: { [currency: string]: number } = {}
): number {
  return Object.values(estimatedCosts).reduce((total, cost) => {
    const currency = cost.currency || 'ريال';
    const exchangeRate = exchangeRates[currency] || (currency === 'ريال' ? 1 : 1);
    return total + ((cost.amount || 0) * exchangeRate);
  }, 0);
}

/**
 * حساب التكلفة التقديرية للوحدة (بالعملة المدخلة)
 */
export function calculateUnitEstimatedCost(
  totalCost: number,
  totalQuantity: number
): number {
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * حساب المعادل بالريال للوحدة (للتكلفة التقديرية للوحدة)
 */
export function calculateUnitEstimatedCostInYR(
  unitCost: number,
  exchangeRate: number = 1
): number {
  return unitCost * exchangeRate;
}

/**
 * ==================================================================
 * دوال حساب فروق الأسعار
 * ==================================================================
 */

/**
 * حساب الفرق في السعر بين التكلفة التقديرية والسعر المقدم للوحدة الواحدة
 * يستخدم في جدول "ملاحظات الاختلافات في المواصفات"
 */
export function calculatePriceDifference(
  offeredUnitPrice: number,
  estimatedUnitCost: number,
  currency: Currency = 'ريال',
  exchangeRate: number = 1
): PriceDifferenceCalculation {
  const difference = offeredUnitPrice - estimatedUnitCost;
  const differenceInYR = difference * exchangeRate;
  const percentage = estimatedUnitCost > 0 ? (difference / estimatedUnitCost) * 100 : 0;
  
  return {
    difference,
    differenceInYR,
    percentage,
    isHigher: difference > 0,
    currency
  };
}

/**
 * حساب إجمالي فروق الأسعار لجميع الأصناف
 */
export function calculateTotalPriceDifferences(
  lineItems: OfferLineItem[],
  estimatedCosts: { [lineNumber: number]: { amount: number; currency: Currency } },
  exchangeRates: { [currency: string]: number } = {}
): {
  totalDifference: number;
  totalDifferenceInYR: number;
  itemDifferences: { [lineNumber: number]: PriceDifferenceCalculation };
} {
  let totalDifference = 0;
  let totalDifferenceInYR = 0;
  const itemDifferences: { [lineNumber: number]: PriceDifferenceCalculation } = {};

  lineItems.forEach(item => {
    const estimatedCost = estimatedCosts[item.lineNumber];
    if (estimatedCost && item.offeredQty && item.unitPrice) {
      const estimatedUnitCost = estimatedCost.amount;
      const offeredUnitPrice = item.unitPrice;
      const currency = estimatedCost.currency;
      const exchangeRate = exchangeRates[currency] || (currency === 'ريال' ? 1 : 1);
      
      const diff = calculatePriceDifference(offeredUnitPrice, estimatedUnitCost, currency, exchangeRate);
      itemDifferences[item.lineNumber] = diff;
      
      // حساب الإجمالي مضروباً في الكمية
      totalDifference += diff.difference * item.offeredQty;
      totalDifferenceInYR += diff.differenceInYR * item.offeredQty;
    }
  });

  return {
    totalDifference,
    totalDifferenceInYR,
    itemDifferences
  };
}

/**
 * ==================================================================
 * دوال المساعدة والتنسيق
 * ==================================================================
 */

/**
 * تنسيق نتيجة الحساب مع جميع التفاصيل المطلوبة
 */
export function formatCalculationResult(
  amount: number,
  currency: Currency = 'ريال',
  exchangeRate: number = 1
): TotalCalculation {
  const totalInYR = calculateTotalInYR(amount, exchangeRate);
  
  return {
    amount,
    currency,
    amountInWords: convertNumberToArabicWords(amount, currency),
    formattedAmount: formatNumberWithCommas(amount),
    totalInYR,
    totalInYRWords: convertNumberToArabicWords(totalInYR, 'ريال يمني'),
    exchangeRate
  };
}

/**
 * التحقق من صحة العملة وسعر الصرف
 */
export function validateCurrencyAndRate(
  currency: Currency,
  exchangeRate?: number
): { isValid: boolean; error?: string } {
  if (currency !== 'ريال' && (!exchangeRate || exchangeRate <= 0)) {
    return {
      isValid: false,
      error: 'سعر الصرف مطلوب للعملات غير الريال اليمني'
    };
  }
  
  return { isValid: true };
}

/**
 * ==================================================================
 * دوال التحديث المجمعة للعروض
 * ==================================================================
 */

/**
 * تحديث جميع الحسابات في عرض سعر واحد
 */
export function updateOfferCalculations(
  offer: PriceOffer,
  taxIncluded: boolean | null = null
): PriceOffer {
  if (!offer.lineItems || offer.lineItems.length === 0) {
    return offer;
  }

  // حساب إجمالي العرض
  const totalBeforeTax = calculateOfferTotal(offer.lineItems);
  const totalAfterTax = calculateOfferTotalAfterTax(offer.lineItems, taxIncluded);
  
  // استخدام الإجمالي المناسب حسب حالة الضريبة
  const finalTotal = taxIncluded ? totalAfterTax : totalBeforeTax;
  
  // حساب المعادل بالريال اليمني
  const exchangeRate = offer.exchangeRate || (offer.currency === 'ريال' ? 1 : 1);
  const totalInYR = calculateTotalInYR(finalTotal, exchangeRate);

  return {
    ...offer,
    amount: totalBeforeTax,
    total: finalTotal,
    totalInWords: convertNumberToArabicWords(finalTotal, offer.currency),
    totalInYR
  };
}

/**
 * تحديث حسابات العرض الموصى به
 */
export function updateRecommendedOfferCalculations(
  offer: RecommendedOffer,
  originalOffer: PriceOffer
): RecommendedOffer {
  const amount = offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0;
  const exchangeRate = originalOffer.exchangeRate || 1;
  
  return {
    ...offer,
    amount,
    amountInWords: convertNumberToArabicWords(amount, offer.currency),
    totalInYR: amount * exchangeRate
  };
}

/**
 * ==================================================================
 * دوال خاصة برسائل الترسية
 * ==================================================================
 */

/**
 * حساب المبالغ في رسائل الترسية
 */
export interface AwardMessageAmounts {
  // المبالغ بعملة العرض
  awardedAmount: number;
  awardedAmountInWords: string;
  awardedAmountFormatted: string;
  
  // المبالغ بالريال اليمني
  awardedAmountInYR: number;
  awardedAmountInYRWords: string;
  awardedAmountInYRFormatted: string;
  
  // تفاصيل إضافية
  currency: Currency;
  exchangeRate: number;
}

export function calculateAwardMessageAmounts(
  offer: RecommendedOffer,
  originalOffer: PriceOffer
): AwardMessageAmounts {
  const awardedAmount = offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0;
  const currency = offer.currency;
  const exchangeRate = originalOffer.exchangeRate || 1;
  const awardedAmountInYR = awardedAmount * exchangeRate;

  return {
    awardedAmount,
    awardedAmountInWords: convertNumberToArabicWords(awardedAmount, currency),
    awardedAmountFormatted: formatNumberWithCommas(awardedAmount),
    
    awardedAmountInYR,
    awardedAmountInYRWords: convertNumberToArabicWords(awardedAmountInYR, 'ريال يمني'),
    awardedAmountInYRFormatted: formatNumberWithCommas(awardedAmountInYR),
    
    currency,
    exchangeRate
  };
}

/**
 * ==================================================================
 * دوال التحقق والتطابق
 * ==================================================================
 */

/**
 * التحقق من تطابق مجموع الأصناف مع إجمالي العرض
 */
export interface AmountMismatchCheck {
  isMatched: boolean;
  offerTotal: number;
  lineItemsTotal: number;
  difference: number;
  percentageDifference: number;
}

export function checkAmountMismatch(
  offer: PriceOffer,
  tolerance: number = 0.01
): AmountMismatchCheck {
  const offerTotal = offer.total || offer.amount || 0;
  const lineItemsTotal = calculateOfferTotalAfterTax(
    offer.lineItems || [],
    offer.taxIncluded
  );
  
  const difference = Math.abs(offerTotal - lineItemsTotal);
  const percentageDifference = offerTotal > 0 ? (difference / offerTotal) * 100 : 0;
  
  return {
    isMatched: difference <= tolerance,
    offerTotal,
    lineItemsTotal,
    difference,
    percentageDifference
  };
}

/**
 * ==================================================================
 * دوال إحصائية ومجمعة
 * ==================================================================
 */

/**
 * حساب الإحصائيات الإجمالية لجميع العروض
 */
export interface OverallStatistics {
  totalOffers: number;
  totalEstimatedCost: number;
  totalOfferedAmount: number;
  totalAwardedAmount: number;
  averageOfferAmount: number;
  lowestOffer: { vendor: string; amount: number; currency: Currency } | null;
  highestOffer: { vendor: string; amount: number; currency: Currency } | null;
  savingsAmount: number; // الوفر = التكلفة التقديرية - المبلغ المرسى عليه
  savingsPercentage: number;
}

export function calculateOverallStatistics(
  offers: PriceOffer[],
  recommendedOffers: RecommendedOffer[],
  totalEstimatedCost: number
): OverallStatistics {
  const validOffers = offers.filter(offer => offer.vendor && offer.amount && offer.amount > 0);
  
  const totalOfferedAmount = validOffers.reduce((sum, offer) => sum + (offer.amount || 0), 0);
  const averageOfferAmount = validOffers.length > 0 ? totalOfferedAmount / validOffers.length : 0;
  
  // العثور على أقل وأعلى عرض
  let lowestOffer = null;
  let highestOffer = null;
  
  if (validOffers.length > 0) {
    const sortedOffers = [...validOffers].sort((a, b) => (a.amount || 0) - (b.amount || 0));
    lowestOffer = {
      vendor: sortedOffers[0].vendor,
      amount: sortedOffers[0].amount || 0,
      currency: sortedOffers[0].currency
    };
    
    highestOffer = {
      vendor: sortedOffers[sortedOffers.length - 1].vendor,
      amount: sortedOffers[sortedOffers.length - 1].amount || 0,
      currency: sortedOffers[sortedOffers.length - 1].currency
    };
  }
  
  // حساب إجمالي المبلغ المرسى عليه
  const totalAwardedCalculation = calculateTotalAwardedAmount(recommendedOffers);
  const totalAwardedAmount = totalAwardedCalculation.totalInYR; // بالريال اليمني للمقارنة
  
  // حساب الوفر
  const savingsAmount = totalEstimatedCost - totalAwardedAmount;
  const savingsPercentage = totalEstimatedCost > 0 ? (savingsAmount / totalEstimatedCost) * 100 : 0;
  
  return {
    totalOffers: validOffers.length,
    totalEstimatedCost,
    totalOfferedAmount,
    totalAwardedAmount,
    averageOfferAmount,
    lowestOffer,
    highestOffer,
    savingsAmount,
    savingsPercentage
  };
}

// تصدير جميع الواجهات والأنواع المطلوبة
export type {
  CalculationResult,
  TotalCalculation,
  EstimatedCostCalculation,
  PriceDifferenceCalculation,
  AwardMessageAmounts,
  AmountMismatchCheck,
  OverallStatistics
};


