// دوال التحقق من صحة البيانات
// src/utils/validation.ts

/**
 * دوال التحقق من صحة البيانات
 * تحتوي على قواعد التحقق المختلفة للحقول
 */

// التحقق من رقم طلب الشراء
export const validatePONumber = (poNumber: string): { isValid: boolean; message: string } => {
  if (!poNumber || poNumber.trim() === '') {
    return { isValid: false, message: 'رقم طلب الشراء مطلوب' };
  }
  
  if (poNumber.length < 3) {
    return { isValid: false, message: 'رقم طلب الشراء يجب أن يكون 3 أحرف على الأقل' };
  }
  
  return { isValid: true, message: '' };
};

// التحقق من رقم المعاملة
export const validateTransactionNumber = (transactionNumber: string): { isValid: boolean; message: string } => {
  if (!transactionNumber || transactionNumber.trim() === '') {
    return { isValid: false, message: 'رقم المعاملة مطلوب' };
  }
  
  // التحقق من أن الرقم يحتوي على أرقام وشرطات فقط
  const pattern = /^[0-9-]+$/;
  if (!pattern.test(transactionNumber)) {
    return { isValid: false, message: 'رقم المعاملة يجب أن يحتوي على أرقام وشرطات فقط' };
  }
  
  return { isValid: true, message: '' };
};

// التحقق من المبلغ
export const validateAmount = (amount: number): { isValid: boolean; message: string } => {
  if (!amount || amount <= 0) {
    return { isValid: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
  }
  
  if (amount > 999999999) {
    return { isValid: false, message: 'المبلغ كبير جداً' };
  }
  
  return { isValid: true, message: '' };
};

// التحقق من اسم المورد
export const validateVendorName = (vendorName: string): { isValid: boolean; message: string } => {
  if (!vendorName || vendorName.trim() === '') {
    return { isValid: false, message: 'اسم المورد مطلوب' };
  }
  
  if (vendorName.length < 2) {
    return { isValid: false, message: 'اسم المورد يجب أن يكون حرفين على الأقل' };
  }
  
  return { isValid: true, message: '' };
};

// التحقق من سعر الصرف
export const validateExchangeRate = (rate: number, currency: string): { isValid: boolean; message: string } => {
  if (currency === 'ريال') {
    return { isValid: true, message: '' };
  }
  
  if (!rate || rate <= 0) {
    return { isValid: false, message: 'سعر الصرف مطلوب للعملات الأجنبية' };
  }
  
  if (rate > 10000) {
    return { isValid: false, message: 'سعر الصرف مرتفع جداً' };
  }
  
  return { isValid: true, message: '' };
};

// التحقق الشامل من العرض
export const validatePriceOffer = (offer: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const vendorValidation = validateVendorName(offer.vendor);
  if (!vendorValidation.isValid) {
    errors.push(vendorValidation.message);
  }
  
  const amountValidation = validateAmount(offer.amount);
  if (!amountValidation.isValid) {
    errors.push(amountValidation.message);
  }
  
  if (!offer.currency) {
    errors.push('العملة مطلوبة');
  }
  
  const exchangeValidation = validateExchangeRate(offer.exchangeRate, offer.currency);
  if (!exchangeValidation.isValid) {
    errors.push(exchangeValidation.message);
  }
  
  if (offer.taxIncluded === undefined || offer.taxIncluded === null) {
    errors.push('حالة الضرائب مطلوبة');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * التحقق من تطابق إجمالي العرض مع إجمالي أسعار الأصناف
 */
export const validateOfferAmountConsistency = (
  offerTotal: number, 
  lineItemsTotal: number, 
  tolerance: number = 1
): { isConsistent: boolean; difference: number; message: string } => {
  const difference = Math.abs(offerTotal - lineItemsTotal);
  const isConsistent = difference < tolerance;
  
  return {
    isConsistent,
    difference,
    message: isConsistent 
      ? 'المبالغ متطابقة' 
      : `يوجد فارق قدره ${difference.toFixed(2)} بين إجمالي العرض وإجمالي أسعار الأصناف`
  };
};

/**
 * التحقق من اكتمال بيانات الترسية
 */
export const validateAwardedItems = (lineItems: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const awardedItems = lineItems.filter(item => item.awarded || (item.awardedQty || 0) > 0);
  
  if (awardedItems.length === 0) {
    errors.push('يجب تحديد الأصناف المرسى عليها');
  }
  
  awardedItems.forEach(item => {
    if (!item.awardedQty || item.awardedQty <= 0) {
      errors.push(`يجب تحديد كمية الترسية للسطر ${item.lineNumber}`);
    }
    
    if (item.awardedQty > item.requestedQty) {
      errors.push(`كمية الترسية للسطر ${item.lineNumber} تتجاوز الكمية المطلوبة`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};