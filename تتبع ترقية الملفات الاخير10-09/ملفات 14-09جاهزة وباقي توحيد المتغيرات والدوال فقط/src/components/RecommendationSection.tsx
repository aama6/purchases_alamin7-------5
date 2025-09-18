// purchases_alamin7-copy5\src\components\RecommendationSection.tsx



// purchases_alamin7-final\src\components\RecommendationSection.tsx
import React, { useEffect, useState } from 'react';
import { Award, Printer, Mail, X } from 'lucide-react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { convertNumberToArabicWords, formatNumberWithCommas, toFixed2Raw } from '../utils/numberToWords';
import { OfferLineItem, RecommendedOffer } from '../types';

export const RecommendationSection: React.FC = () => {
  const {
    poNumber,
    transactionNumber,
    priceOffers,
    recommendation,
    setRecommendation,
    excludedOffers,
    setExcludedOffers,
    savePurchaseOrder,
    isPreliminaryPrint,
    setIsPreliminaryPrint,
    offerCount,
    clearAllFields,
    setPoNumber,
    checkDuplicatePurchaseOrder,
    getSignatoryForPrint,
    calculateMaxOfferAmountInYR,
    shouldShowFinalSignature,
    calculateTotalAwardedInYR,
    poItems,
    shouldShowPreliminarySignature,
    requesting,
    beneficiary,
    purchaseMethod
  } = usePurchaseOrder();

  const [printStatus, setPrintStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [manualAmounts, setManualAmounts] = useState<{ [vendor: string]: string }>({});
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [messageType, setMessageType] = useState<'awarded' | 'excluded' | 'financial'>('awarded');
  const [printType, setPrintType] = useState<'preliminary' | 'final'>('preliminary');

  // تأثيرات إدارة الطباعة
  useEffect(() => {
    const handleBeforePrint = () => {
      console.log('بدء الطباعة...');
    };

    const handleAfterPrint = () => {
      console.log('انتهاء الطباعة...');
      if (isPreliminaryPrint) {
        setIsPreliminaryPrint(false);
      }
      
      // بعد طباعة التقرير الأساسي، إذا كانت الطباعة نهائية اطبع الرسائل الإضافية
      if (printType === 'final') {
        setTimeout(() => {
          try {
            handleAdditionalPrinting();
          } catch (e) {
            console.error('Failed to print additional letters after final report:', e);
          }
        }, 200);
      }
      
      setPrintStatus('idle');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isPreliminaryPrint, setIsPreliminaryPrint, printType]);

  // دالة تحديث المبلغ كتابة
  const updateAmountInWords = (offer: RecommendedOffer): RecommendedOffer => {
    const amount = offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0;
    return {
      ...offer,
      amountInWords: convertNumberToArabicWords(amount, offer.currency)
    };
  };

  // دالة حساب الإجمالي بالريال
  const updateTotalAwardedInYR = (selectedOffers: RecommendedOffer[]) => {
    const totalInYR = selectedOffers.reduce((sum, offer) => {
      const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
      if (originalOffer) {
        if (offer.isManualAmount && offer.manualAmount !== undefined) {
          const exchangeRate = originalOffer.exchangeRate || 1;
          return sum + (offer.manualAmount * exchangeRate);
        } else {
          return sum + (originalOffer.totalInYR || 0);
        }
      }
      return sum;
    }, 0);
    
    const totalInYRWords = convertNumberToArabicWords(totalInYR, 'ريال يمني');
    return {
      totalAwardedInYR: totalInYR,
      totalAwardedInYRWords: totalInYRWords
    };
  };

  /**
   * دالة حساب المبالغ المرسى عليها بناءً على الكميات والأسعار شاملة الضريبة
   * هذه الدالة تحسب إجمالي المبالغ للكميات التي تم الإرساء عليها فقط، وليس إجمالي مبلغ العرض
   */
  const calculateAwardedAmount = (lineItems: OfferLineItem[], exchangeRate: number = 1) => {
    return lineItems.reduce((total, lineItem) => {
      if (lineItem.awarded || (lineItem.awardedQty && lineItem.awardedQty > 0)) {
        const awardedQty = lineItem.awardedQty || lineItem.offeredQty || 0;
        const unitPrice = lineItem.unitPriceAfterTax || lineItem.unitPrice || 0;
        return total + (awardedQty * unitPrice);
      }
      return total;
    }, 0) * exchangeRate;
  };

  // إضافة/إزالة مورد من التوصية
  const toggleVendorSelection = (vendor: string) => {
    const selectedOffer = priceOffers.find(offer => offer.vendor === vendor);
    if (!selectedOffer) return;

    // حساب إجمالي المبالغ للكميات المرسى عليها فقط
    let awardedTotal = 0;
    const awardedLineNumbers: number[] = [];
    const awardedLineItems: any[] = [];
    // const awardedLineItems: OfferLineItem[] = [];

    if (selectedOffer.lineItems && selectedOffer.lineItems.length > 0) {
      selectedOffer.lineItems.forEach(lineItem => {
        if (lineItem.awarded || (lineItem.awardedQty && lineItem.awardedQty > 0)) {
          const awardedQty = lineItem.awardedQty || lineItem.offeredQty || 0;
          // استخدام سعر الوحدة بعد الضريبة إذا كان متوفراً، وإلا السعر العادي
          const unitPrice = lineItem.unitPriceAfterTax || lineItem.unitPrice || 0;
          const lineTotal = awardedQty * unitPrice;
          
          awardedTotal += lineTotal;
          awardedLineNumbers.push(lineItem.lineNumber);
          
          // نقل الالتزامات على مستوى السطر
          awardedLineItems.push({
            lineNumber: lineItem.lineNumber,
            name: lineItem.name,
            unit: lineItem.unit,
            awardedQty: awardedQty,
            unitPrice: unitPrice,
            total: lineTotal,
            commitments: lineItem.commitments || [] // إضافة الالتزامات على مستوى السطر
          });
        }
      });
    }

    // في حال عدم وجود تفاصيل أصناف، استخدم إجمالي العرض
    if (awardedTotal === 0 && (!selectedOffer.lineItems || selectedOffer.lineItems.length === 0)) {
      awardedTotal = selectedOffer.total || 0;
    }

    const newOffer: RecommendedOffer = {
      vendor: selectedOffer.vendor,
      amount: awardedTotal, // استخدام المبلغ المحسوب للكميات المرسى عليها فقط
      currency: selectedOffer.currency,
      amount: awardedTotal,
      currency: selectedOffer.currency, // استخدام المبلغ المحسوب للكميات المرسى عليها فقط
      amountInWords: convertNumberToArabicWords(awardedTotal, selectedOffer.currency),
      isManualAmount: false,
      totalInYR: awardedTotal * (selectedOffer.exchangeRate || 1),
      awardedLineNumbers: awardedLineNumbers,
      lineItems: awardedLineItems
    };

    if (!recommendation) {
      const newSelectedOffers = [newOffer];
      const totals = updateTotalAwardedInYR(newSelectedOffers);
      setRecommendation({
        selectedOffers: newSelectedOffers,
        ...totals
      });
      return;
    }

    const existingOfferIndex = recommendation.selectedOffers.findIndex(
      offer => offer.vendor === vendor
    );
    
    let newSelectedOffers: RecommendedOffer[];
    if (existingOfferIndex >= 0) {
      newSelectedOffers = recommendation.selectedOffers.filter(
        offer => offer.vendor !== vendor
      );
    } else {
      newSelectedOffers = [...recommendation.selectedOffers, newOffer];
    }
    
    const totals = updateTotalAwardedInYR(newSelectedOffers);
    setRecommendation({
      selectedOffers: newSelectedOffers,
      ...totals
    });
  };

  // تحديث مبلغ مورد
  const updateOfferAmount = (vendor: string, newAmount: number | undefined, isManual: boolean = true) => {
    if (!recommendation) return;
    
    const updatedOffers = recommendation.selectedOffers.map(offer => {
      if (offer.vendor === vendor) {
        const nextAmount = newAmount ?? offer.amount; // ensure number
        const updatedOffer: RecommendedOffer = {
          ...offer,
          amount: nextAmount,
          manualAmount: isManual ? newAmount : undefined,
          isManualAmount: isManual
        };
        return updateAmountInWords(updatedOffer);
      }
      return offer;
    });
    
    const totals = updateTotalAwardedInYR(updatedOffers);
    setRecommendation({
      selectedOffers: updatedOffers,
      ...totals
    });
  };

  // إعادة تعيين المبلغ إلى القيمة الأصلية
  const resetOfferAmount = (vendor: string) => {
    const originalOffer = priceOffers.find(offer => offer.vendor === vendor);
    if (originalOffer) {
      updateOfferAmount(vendor, originalOffer.total, false);
      setManualAmounts(prev => ({ ...prev, [vendor]: formatNumberWithCommas(originalOffer.total) }));
    }
  };

  // الحصول على العروض المطابقة
  const matchingOffers = priceOffers.filter(offer =>
    (offer.result === 'مطابق' || offer.result === 'مطابق جزئي') && offer.vendor
  );

  // التحقق من صحة الطباعة الأولية
  const validatePreliminaryPrint = (): string | null => {
    const errors = [] as string[];
    if (!poNumber.trim()) errors.push('ادخال رقم طلب الشراء');
    if (!transactionNumber.trim()) errors.push('ادخال رقم المعاملة');
    if (!requesting?.trim()) errors.push('ادخال الجهة الطالبة');
    if (!beneficiary?.trim()) errors.push('ادخال الجهة المستفيدة');
    
    const hasValidOffers = priceOffers.some(
      offer => offer.vendor && ((offer.total ?? 0) > 0) && offer.currency
    );
    if (!hasValidOffers) {
      errors.push('تعبئة جدول عروض الاسعار');
    }
    
    return errors.length > 0 ? `يجب عليك ${errors.join(' - ')}` : null;
  };

  // التحقق من صحة الطباعة النهائية
  const validateFinalPrint = (): string | null => {
    const errors = [] as string[];
    if (!poNumber.trim()) errors.push('ادخال رقم طلب الشراء');
    if (!transactionNumber.trim()) errors.push('ادخال رقم المعاملة');
    if (!requesting?.trim()) errors.push('ادخال الجهة الطالبة');
    if (!beneficiary?.trim()) errors.push('ادخال الجهة المستفيدة');
    if (!purchaseMethod?.trim()) errors.push('تحديد طريقة الشراء');
    
    if (!recommendation || !recommendation.selectedOffers || recommendation.selectedOffers.length === 0) {
      errors.push('اختيار التوصية');
    }
    
    const hasResults = priceOffers.every(offer => offer.vendor ? !!offer.result : true);
    if (!hasResults) {
      errors.push('ادخال نتيجة المطابقة لجميع الموردين');
    }
    
    // const hasExclusionReasons = excludedOffers.every(offer => offer.reason.trim());
    // if (excludedOffers.length > 0 && !hasExclusionReasons) {
    //   errors.push('ادخال اسباب الاستبعاد');
    // }
    
    return errors.length > 0 ? `يجب عليك ${errors.join(' - ')}` : null;
  };

  // دالة الحصول على الالتزامات المصنفة
  const getCategorizedCommitments = (vendor: string) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    if (!offer) return { vendorLevel: [], lineLevel: [] };
    
    const vendorLevel = offer.commitments || [];
    const lineLevel = offer.lineItems
      ?.filter(item => (item.awarded || (item.awardedQty || 0) > 0) && item.commitments && item.commitments.length > 0)
      .map(item => ({
        lineNumber: item.lineNumber,
        commitments: item.commitments
      })) || [];
      
    return { vendorLevel, lineLevel };
  };

  // دالة التوقيعات الديناميكية
  const getDynamicSignatures = () => {
    const isPreliminaryMode = printType === 'preliminary';
    const amount = isPreliminaryMode ? calculateMaxOfferAmountInYR() : calculateTotalAwardedInYR();

    if (isPreliminaryMode) {
      if (amount <= 150000) {
        return [
          { title: "المختص", name: "الاسم", role: "---------------------" },
          { title: "رئيس القسم", name: "الاسم", role: "---------------------" },
          { title: "مدير الإدارة", name: "الاسم", role: "---------------------" }
        ];
      } else {
        return [
          { title: "المختص", name: "الاسم", role: "---------------------" },
          { title: "رئيس القسم", name: "الاسم", role: "---------------------" },
          { title: "مدير الإدارة", name: "الاسم", role: "---------------------" },
          { title: "مدير عام الإدارة", name: "الاسم", role: "---------------------" }
        ];
      }
    } else {
      if (amount <= 150000) {
        return [
          { title: "المختص", name: "الاسم", role: "---------------------" },
          { title: "رئيس قسم المشتريات", name: "الاسم", role: "---------------------" },
          { title: "مدير ادارة المشتريات", name: "الاسم", role: "---------------------" }
        ];
      } else {
        return [
          { title: "المختص", name: "الاسم", role: "---------------------" },
          { title: "رئيس قسم المشتريات", name: "الاسم", role: "---------------------" },
          { title: "مدير ادارة المشتريات", name: "الاسم", role: "---------------------" },
          { title: "مدير عام المشتريات والمخازن", name: "الاسم", role: "---------------------" }
        ];
      }
    }
  };

  // دالة تحديد المخاطب بناء على المبلغ
  const getRecipient = () => {
    const totalAwarded = calculateTotalAwardedInYR();
    return totalAwarded <= 150000 ? "الأخ/مدير عام المشتريات والمخازن" : "الأخ/المدير العام التنفيذي";
  };

  // دالة الطباعة الأولية
  const handlePreliminaryPrint = async () => {
    const validationError = validatePreliminaryPrint();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setPrintStatus('processing');
    setPrintType('preliminary');
    
    try {
      const saveSuccess = await savePurchaseOrder();
      if (!saveSuccess) {
        alert('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.');
        setPrintStatus('error');
        setTimeout(() => setPrintStatus('idle'), 3000);
        return;
      }
      
      // تحديث العروض المستبعدة
      let newExcludedOffers = excludedOffers.filter(ex => {
        const offer = priceOffers.find(o => o.vendor === ex.vendor);
        return !(offer && offer.result === 'مطابق');
      });
      
      let addedCount = 0;
      priceOffers.forEach((offer) => {
        if (offer.vendor && offer.vendor.trim() !== '' && (offer.amount || 0) > 0) {
          if (offer.result !== 'مطابق') {
            if (!newExcludedOffers.some(excluded => excluded.vendor === offer.vendor)) {
              newExcludedOffers.push({
                id: `excluded-preliminary-${Date.now()}-${offer.vendor}`,
                vendor: offer.vendor,
                reason: '',
                notes: '',
              });
              addedCount++;
            }
          }
        }
      });
      
      if (addedCount > 0) {
        setExcludedOffers(newExcludedOffers);
        setTimeout(async () => {
          await savePurchaseOrder();
        }, 100);
      }
      
      setIsPreliminaryPrint(true);
      setPrintStatus('success');
      
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (error) {
      console.error('Error during preliminary print:', error);
      alert('حدث خطأ أثناء الطباعة الأولية.');
      setPrintStatus('error');
      setTimeout(() => setPrintStatus('idle'), 3000);
    }
  };

  // دالة إنشاء رسائل الموردين
  const generateVendorMessage = (vendor: string, type: 'awarded' | 'excluded'): string => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    const selectedOffer = recommendation?.selectedOffers.find(s => s.vendor === vendor);
    const today = new Date().toLocaleDateString('ar-SA');
    
    if (type === 'awarded' && offer && selectedOffer) {
      const commitments = getCategorizedCommitments(vendor);
      
      let message = `بسم الله الرحمن الرحيم\n\n`;
      message += `التاريخ: ${today}\n`;
      message += `إلى: ${vendor}\n`;
      message += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
      message += `تحية طيبة وبعد،\n\n`;
      message += `نتشرف بإبلاغكم بأنه تم الترسية عليكم في طلب الشراء رقم ${poNumber} `;
      message += `الخاص بـ ${beneficiary} بمبلغ إجمالي قدره `;
      message += `${formatNumberWithCommas(selectedOffer.isManualAmount ? selectedOffer.manualAmount || 0 : selectedOffer.amount || 0)} ${selectedOffer.currency}\n\n`;
      
      if (selectedOffer.awardedLineNumbers && selectedOffer.awardedLineNumbers.length > 0) {
        message += `الأسطر المرسى عليها: ${selectedOffer.awardedLineNumbers.join(', ')}\n\n`;
      }
      
      // إضافة تفاصيل الأصناف المرسى عليها
      if (selectedOffer.lineItems && selectedOffer.lineItems.length > 0) {
        message += `تفاصيل الأصناف المرسى عليها:\n\n`;
        selectedOffer.lineItems.forEach(item => {
          message += `- الصنف: ${item.name}\n`;
          message += `  الكمية: ${item.awardedQty} ${item.unit}\n`;
          message += `  سعر الوحدة: ${formatNumberWithCommas(item.unitPrice)} ${offer.currency}\n`;
          message += `  الإجمالي: ${formatNumberWithCommas(item.total)} ${offer.currency}\n`;
          
          if (item.commitments && item.commitments.length > 0) {
            message += `  الالتزامات: ${item.commitments.join(', ')}\n`;
          }
          
          message += `\n`;
        });
      }
      
      if (commitments.vendorLevel.length > 0) {
        message += `مع الالتزام بالآتي:\n`;
        commitments.vendorLevel.forEach((commitment, index) => {
          message += `${index + 1}. ${commitment}\n`;
        });
        message += `\n`;
      }
      
      if (commitments.lineLevel.length > 0) {
        message += `التزامات خاصة بالأسطر:\n`;
        commitments.lineLevel.forEach(lineCommitment => {
          message += `السطر ${lineCommitment.lineNumber}:\n`;
          (lineCommitment.commitments || []).forEach((commitment, index) => {
            message += `  ${index + 1}. ${commitment}\n`;
          });
        });
        message += `\n`;
      }
      
      message += `يرجى التواصل مع إدارة المشتريات لاستكمال الإجراءات.\n\n`;
      message += `مع تحياتنا،\n`;
      message += `إدارة المشتريات والمخازن`;
      
      return message;
    } else if (type === 'excluded') {
      let message = `بسم الله الرحمن الرحيم\n\n`;
      message += `التاريخ: ${today}\n`;
      message += `إلى: ${vendor}\n`;
      message += `الموضوع: إشعار عدم ترسية طلب الشراء رقم ${poNumber}\n\n`;
      message += `تحية طيبة وبعد،\n\n`;
      message += `نشكركم على مشاركتكم في طلب الشراء رقم ${poNumber} `;
      message += `الخاص بـ ${beneficiary}.\n\n`;
      message += `نأسف لإبلاغكم بأنه لم يتم الترسية عليكم في هذا الطلب `;
      message += `لأسباب فنية ومالية.\n\n`;
      message += `نتطلع للتعاون معكم في الفرص القادمة.\n\n`;
      message += `مع تحياتنا،\n`;
      message += `إدارة المشتريات والمخازن`;
      
      return message;
    }
    
    return '';
  };

  // دالة إنشاء رسالة الشؤون المالية
  const generateFinancialMessage = (): string => {
    const today = new Date().toLocaleDateString('ar-SA');
    const totalAwarded = calculateTotalAwardedInYR();
    
    let message = `بسم الله الرحمن الرحيم\n\n`;
    message += `التاريخ: ${today}\n`;
    message += `إلى: إدارة الشؤون المالية\n`;
    message += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
    message += `تحية طيبة وبعد،\n\n`;
    message += `نفيدكم بأنه تم الترسية في طلب الشراء رقم ${poNumber} `;
    message += `رقم المعاملة ${transactionNumber} الخاص بـ ${beneficiary}\n\n`;
    
    message += `تفاصيل الترسية:\n`;
    recommendation?.selectedOffers.forEach((offer, index) => {
      message += `${index + 1}. ${offer.vendor}: `;
      message += `${formatNumberWithCommas(offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0)} ${offer.currency}`;
      
      const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
      if (offer.currency !== 'ريال' && originalOffer) {
        const totalInYR = offer.isManualAmount && offer.manualAmount 
          ? offer.manualAmount * (originalOffer.exchangeRate || 1)
          : originalOffer.totalInYR || 0;
        message += ` (${formatNumberWithCommas(totalInYR)} ريال)`;
      }
      message += `\n`;
      
      // إضافة تفاصيل الأصناف المرسى عليها
      if (offer.lineItems && offer.lineItems.length > 0) {
        message += `   تفاصيل الأصناف:\n`;
        offer.lineItems.forEach(item => {
          message += `   - ${item.name}: ${item.awardedQty} ${item.unit} × ${formatNumberWithCommas(item.unitPrice)} = ${formatNumberWithCommas(item.total)} ${offer.currency}\n`;
        });
      }
    });
    
    message += `\nالإجمالي: ${formatNumberWithCommas(totalAwarded)} ريال\n`;
    message += `الإجمالي كتابة: ${convertNumberToArabicWords(totalAwarded, 'ريال')}\n\n`;
    message += `يرجى اتخاذ الإجراءات المالية اللازمة.\n\n`;
    message += `مع تحياتنا،\n`;
    message += `إدارة المشتريات والمخازن`;
    
    return message;
  };

  // دالة نسخ الرسالة إلى الحافظة
  const copyMessageToClipboard = (message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      alert('تم نسخ الرسالة إلى الحافظة');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('تم نسخ الرسالة إلى الحافظة');
    });
  };

  /**
   * دالة الطباعة النهائية مع إصلاح المشكلة التي تمنع الطباعة
   * الآن ستعمل هذه الدالة بشكل صحيح بعد إصلاح الخطأ
   */
  const handleFinalPrint = async () => {
    // التحقق من صحة البيانات قبل الطباعة
    const validationError = validateFinalPrint();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    // تعيين حالة الطباعة
    setPrintStatus('processing');
    setPrintType('final');
    
    try {
      // التحقق من وجود طلبات مكررة
      const duplicateCheck = await checkDuplicatePurchaseOrder(poNumber, transactionNumber);
      if (duplicateCheck.dataExists && !duplicateCheck.isDuplicate) {
        if (!window.confirm(duplicateCheck.message)) {
          setPrintStatus('idle');
          return;
        }
      } else if (duplicateCheck.isDuplicate) {
        alert(duplicateCheck.message);
        setPrintStatus('idle');
        return;
      }
      
      // حفظ البيانات قبل الطباعة
      const saveSuccess = await savePurchaseOrder();
      if (!saveSuccess) {
        alert('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.');
        setPrintStatus('error');
        setTimeout(() => setPrintStatus('idle'), 3000);
        return;
      }
      
      // تعيين حالة الطباعة النهائية
      setIsPreliminaryPrint(false);
      
      // إظهار تأكيد نهائي لضمان "user activation" قبل الطباعة
      const proceedToPrint = window.confirm('سيتم طباعة التقرير النهائي الآن. اضغط موافق للمتابعة.');
      if (!proceedToPrint) {
        setPrintStatus('idle');
        return;
      }
      
      // طباعة مباشرة بإطار رسم واحد (احتياطي لمنع أي حظر)
      if (typeof window.requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          setPrintStatus('success');
          window.print();
          // سيتم استدعاء طباعة الرسائل الإضافية تلقائياً في afterprint عندما يكون printType === 'final'
          // سيتم استدعاء طباعة الرسائل الإضافية تلقائياً في `afterprint` عندما يكون `printType === 'final'`
        });
      } else {
        setPrintStatus('success');
        window.print();
      }
    } catch (error) {
      console.error('Error during final print:', error);
      alert('حدث خطأ أثناء الطباعة النهائية.');
      setPrintStatus('error');
      setTimeout(() => setPrintStatus('idle'), 3000);
    }
  };

  /**
   * دالة طباعة الرسائل الإضافية مع جميع التفاصيل
   * هذه الدالة تطبع رسائل الشؤون المالية والموردين مع جميع تفاصيل الأصناف المرسى عليها
   */
  const handleAdditionalPrinting = () => {
    if (!recommendation?.selectedOffers?.length) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const dateTimeStr = `${year}/${month}/${day} ${hours}:${minutes} ${ampm}`;
    
    // رسالة الشؤون المالية
    const financialLetterContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 6px; line-height: 1.2;">
        <div style="display: flex; justify-content: flex-start; align-items: center; font-size: 11px; margin: 2px 0 4px 0;">
          <div style="text-align: left;">التاريخ: ${dateTimeStr}</div>
        </div>
        <div style="display: grid; grid-template-columns: 20% 55% 25%; align-items: center; text-align: center; margin-bottom: 2px;">
          <div style="border: 1px solid #000; padding: 2px 4px; font-size: 12px; text-align: right;">
            رقم طلب الشراء: ${poNumber}
          </div>
          <h2 style="margin: 0; font-size: 18px; text-align: center;">خلاصة صرف مستحقات</h2>
          <div style="border: 1px solid #000; padding: 2px 4px; font-size: 12px; text-align: left;">
            رقم المعاملة: ${transactionNumber}
          </div>
        </div>
        <hr style="border: 1px solid #000; margin: 5px 0;">
        <p style="font-weight: bold; margin: 5px 0; display: flex; justify-content: space-between;">
        <p style="font-weight: bold; margin: 5px 0; display: flex; justify-content: space-between;" class="print:hidden">
          <span>الأخ/ مدير عام الشؤون المالية</span>
          <span style="margin-left: 35px;">المحترم</span>
        </p>
        <p style="margin: 5px 0; padding-right: 35px; font-size: 10px;">تحية طيبة وبعد،،،</p>
        <p style="margin: 5px 0;">بناءً على موافقة ${getRecipient()} على الشراء بموجب الأوليات المرفقة، يرجى التوجيه باستكمال إجراءات سداد مستحقات الموردين:</p>
        <div style="margin: 10px 0; padding: 10px; border: 1px solid #000;">
          ${(recommendation?.selectedOffers ?? []).map(offer => {
            const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
            const totalInYR = offer.isManualAmount && offer.manualAmount 
              ? offer.manualAmount * (originalOffer?.exchangeRate || 1)
              : originalOffer?.totalInYR || 0;
              
            return `
              <p style="margin: 2px 0;"><strong>اسم المورد:</strong> ${offer.vendor}</p>
              <p style="margin: 2px 0;"><strong>المبلغ:</strong> ${formatNumberWithCommas(offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0)} ${offer.currency} شاملاً الضرائب وجميع المصاريف الأخرى</p>
              <p style="margin: 2px 0;"><strong>المبلغ المعادل بالريال اليمني:</strong> ${formatNumberWithCommas(totalInYR)} ريال</p>
              
              ${offer.lineItems && offer.lineItems.length > 0 ? `
                <div style="margin: 5px 0;">
                  <p style="margin: 2px 0; font-weight: bold;">تفاصيل الأصناف:</p>
                  <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 5px;">
                    <thead>
                      <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid #ccc; padding: 3px; text-align: right;">الصنف</th>
                        <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">الكمية</th>
                        <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">سعر الوحدة</th>
                        <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">الإجمالي</th>
                        <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">التزامات السطر</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${offer.lineItems.map(item => {
                        const commitmentsText = (item.commitments && item.commitments.length > 0)
                          ? item.commitments.join('، ')
                          : '—';
                        return `
                        <tr>
                          <td style="border: 1px solid #ccc; padding: 3px; text-align: right;">${item.name}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${item.awardedQty} ${item.unit}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${formatNumberWithCommas(item.unitPrice)} ${offer.currency}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${formatNumberWithCommas(item.total)} ${offer.currency}</td>
                          <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${commitmentsText}</td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
              
              <hr style="border: 1px solid #ccc; margin: 5px 0;">
            `;
          }).join('')}
        </div>
        <p style="margin: 10px 0; text-align: right;">مع خالص التقدير والاحترام،،،</p>
        
        <!-- التوقيعات -->
        <div style="margin-top: 20px;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; gap: 10px;">
            <div>
              <div style="height: 3px; margin-bottom: 5px;"></div>
              <span>المختص</span><br><span>الاسم</span>
            </div>
            <div>
              <div style="height: 3px; margin-bottom: 5px;"></div>
              <span>رئيس قسم المشتريات</span><br><span>الاسم</span>
            </div>
            <div>
              <div style="height: 3px; margin-bottom: 5px;"></div>
              <span>مدير ادارة المشتريات</span><br><span>الاسم</span>
            </div>
            <div>
              <div style="height: 3px; margin-bottom: 5px;"></div>
              <span>مدير عام المشتريات والمخازن</span><br><span>الاسم</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // رسائل الموردين
    const selectedOffersForLetters = recommendation?.selectedOffers ?? [];
    const vendorLettersContent = selectedOffersForLetters.map(offer => {
      const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
      const commitments = getCategorizedCommitments(offer.vendor);
      
      return `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 6px; line-height: 1.2;">
          <div style="display: flex; justify-content: flex-start; align-items: center; font-size: 11px; margin: 2px 0 4px 0;">
            <div style="text-align: left;">التاريخ: ${dateTimeStr}</div>
          </div>
          <div style="display: grid; grid-template-columns: 20% 55% 25%; align-items: center; text-align: center; margin-bottom: 2px;">
            <div style="border: 1px solid #000; padding: 2px 4px; font-size: 12px; text-align: right;">
              رقم طلب الشراء: ${poNumber}
            </div>
            <h2 style="margin: 0; font-size: 18px; text-align: center;">رسالة ترسية</h2>
            <div style="border: 1px solid #000; padding: 2px 4px; font-size: 12px; text-align: left;">
              رقم المعاملة: ${transactionNumber}
            </div>
          </div>
          <hr style="border: 1px solid #000; margin: 5px 0;">
          <p style="font-weight: bold; margin: 5px 0; display: flex; justify-content: space-between;">
          <p style="font-weight: bold; margin: 5px 0; display: flex; justify-content: space-between;" class="print:hidden">
            <span>الأخوه/ ${offer.vendor}</span>
            <span style="margin-left: 35px;">المحترمون</span>
          </p>
          <p style="margin: 5px 0; padding-right: 35px; font-size: 10px;">تحية طيبة وبعد،،،</p>
          <p style="margin: 5px 0;">إشارة إلى الموضوع أعلاه، نود إعلامكم بترسية الشراء التالي:</p>
          <div style="margin: 10px 0; padding: 10px; border: 1px solid #000;">
            <p style="margin: 2px 0;"><strong>المبلغ:</strong> ${formatNumberWithCommas(offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0)} ${offer.currency} (بالأحرف: ${(offer.amountInWords || convertNumberToArabicWords((offer.isManualAmount ? (offer.manualAmount || 0) : (offer.amount || 0)), offer.currency))}) شاملاً الضرائب وجميع المصاريف الأخرى</p>
            ${originalOffer?.currency !== 'ريال' ? `
            ` : ''}
            ${offer.awardedLineNumbers && offer.awardedLineNumbers.length > 0 ? `
              <p style="margin: 10px 0 5px 0; font-weight: bold;">الأسطر المرسى عليها: ${offer.awardedLineNumbers.join(', ')}</p>
            ` : ''}
            
            ${offer.lineItems && offer.lineItems.length > 0 ? `
              <div style="margin: 10px 0;">
                <p style="margin: 2px 0; font-weight: bold;">تفاصيل الأصناف:</p>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 5px;">
                  <thead>
                    <tr style="background-color: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: right;">الصنف</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">الكمية</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">سعر الوحدة</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">الإجمالي</th>
                      <th style="border: 1px solid #ccc; padding: 3px; text-align: center;">التزامات السطر</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${offer.lineItems.map(item => `
                      <tr>
                        <td style="border: 1px solid #ccc; padding: 3px; text-align: right;">${item.name}</td>
                        <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${item.awardedQty} ${item.unit}</td>
                        <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${formatNumberWithCommas(item.unitPrice)} ${offer.currency}</td>
                        <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${formatNumberWithCommas(item.total)} ${offer.currency}</td>
                        <td style="border: 1px solid #ccc; padding: 3px; text-align: center;">${(item.commitments || []).join(', ') || '—'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
          
          ${commitments.vendorLevel.length > 0 ? `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">
              <p style="margin: 2px 0; font-weight: bold;">مع الالتزام بالآتي:</p>
              <ul style="margin: 2px 0; padding-right: 20px;">
                ${commitments.vendorLevel.map((commitment, idx) => `<li>${commitment}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${commitments.lineLevel.length > 0 ? `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">
              <p style="margin: 2px 0; font-weight: bold;">التزامات خاصة بالأسطر:</p>
              ${commitments.lineLevel.map(lineCommitment => `
                <div style="margin: 5px 0;">
                  <p style="margin: 2px 0; font-weight: bold;">السطر ${lineCommitment.lineNumber}:</p>
                  <ul style="margin: 2px 0; padding-right: 20px;">
                    ${(lineCommitment.commitments || []).map((commitment, cidx) => `<li>${commitment}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <p style="margin: 10px 0; text-align: right;">يرجى التواصل مع إدارة المشتريات لاستكمال الإجراءات.</p>
          <p style="text-align: center; margin: 5px 0;">مع خالص التقدير والاحترام</p>
          
          <!-- التوقيعات -->
          <div style="margin-top: 20px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; gap: 10px;">
              <div>
                <div style="height: 3px; margin-bottom: 5px;"></div>
                <span>المختص</span><br><span>الاسم</span>
              </div>
              <div>
                <div style="height: 3px; margin-bottom: 5px;"></div>
                <span>رئيس قسم المشتريات</span><br><span>الاسم</span>
              </div>
              <div>
                <div style="height: 3px; margin-bottom: 5px;"></div>
                <span>مدير ادارة المشتريات</span><br><span>الاسم</span>
              </div>
              <div>
                <div style="height: 3px; margin-bottom: 5px;"></div>
                <span>مدير عام المشتريات والمخازن</span><br><span>الاسم</span>
              </div>
            </div>
          </div>
        </div>
        ${selectedOffersForLetters.indexOf(offer) < selectedOffersForLetters.length - 1 ? '<div style="page-break-before: always;"></div>' : ''}
      `;
    }).join('');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>رسائل إضافية</title>
          <style>
            @media print {
              @page { size: A4; margin: 5mm; }
              body { margin: 0; padding: 0; }
              body * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { border-collapse: collapse; width: 100%; }
              th, td { padding: 3px; font-size: 10.5px; }
              h1, h2, h3 { margin: 4px 0; }
              p { margin: 2px 0; }
              hr { margin: 4px 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${financialLetterContent}
          <div class="page-break"></div>
          ${vendorLettersContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // الحصول على التوقيعات المناسبة
  const signatures = getDynamicSignatures();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 print:shadow-none print:p-2 border border-gray-200 print-container">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-xl font-semibold flex items-center text-gray-800">
          <Award className="ml-2" size={20} />
          التوصية
        </h2>
        <button
          onClick={() => setShowMessagesModal(true)}
          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center text-sm"
        >
          <Mail size={16} className="ml-1" />
          الرسائل
        </button>
      </div>
      
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold text-center">التوصية:</h2>
      </div>
      
      <div className="border-2 border-gray-400 rounded-lg pt-2 print:border-2 print:border-black print:rounded-none">
        <div className="p-4 print:p-2 space-y-3 bg-gray-50 print:bg-white">
          <div className="flex items-center gap-2 print:block">
            <span className="font-medium">توصي لجنة التحليل بأن يتم الشراء حسب افضل المواصفات والأقل سعراً من:</span>
            <span className="font-medium">
              {recommendation?.selectedOffers?.length > 0
                ? recommendation.selectedOffers.map(o => o.vendor).join(' ومن ')
                : '__________________________________________________'}
            </span>
          </div>
          
          {recommendation?.selectedOffers?.some(o => (o.awardedLineNumbers || []).length > 0) && (
            <div className="text-sm text-gray-700 print:text-black space-y-1">
            <div className="text-sm text-gray-700 print:text-black space-y-1 print:hidden">
              {(recommendation?.selectedOffers ?? []).map((o: RecommendedOffer) => {
                const lines = (o.awardedLineNumbers || []).join('، ');
                if (!lines) return null;
                return (
                  <div key={o.vendor}>... ({o.vendor}) وذلك للسطور رقم {lines}</div>
                );
              })}
            </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-3 print:hidden">
              {matchingOffers.map(offer => {
                const selectedOffer = recommendation?.selectedOffers?.find(s => s.vendor === offer.vendor);
                const isPartiallyMatched = offer.result === 'مطابق جزئي';
                const commitments = getCategorizedCommitments(offer.vendor);
                
                return (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedOffer}
                        onChange={() => toggleVendorSelection(offer.vendor)}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{offer.vendor}</span>
                          <span className={`px-2 py-1 rounded text-sm ${offer.result === 'مطابق'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {offer.result}
                          </span>
                        </div>
                        
                        {!!selectedOffer && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border">
                            <div className="grid grid-cols-1 md:grid-cols-[20%_15%_65%] gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                                {isPartiallyMatched ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={manualAmounts[offer.vendor] !== undefined ? manualAmounts[offer.vendor] : ''}
                                      onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, '');
                                        if (/^\d*(?:\.\d{0,2})?$/.test(rawValue) || rawValue === '') {
                                          setManualAmounts(prev => ({ ...prev, [offer.vendor]: rawValue }));
                                        }
                                      }}
                                      onBlur={() => {
                                        const rawValue = manualAmounts[offer.vendor] ?? '';
                                        const fixedRaw = toFixed2Raw(rawValue);
                                        if (fixedRaw !== '') {
                                          const parsedAmount = parseFloat(fixedRaw);
                                          updateOfferAmount(offer.vendor, parsedAmount, true);
                                          setManualAmounts(prev => ({ ...prev, [offer.vendor]: formatNumberWithCommas(parsedAmount) }));
                                        } else {
                                          updateOfferAmount(offer.vendor, undefined, true);
                                          setManualAmounts(prev => ({ ...prev, [offer.vendor]: '' }));
                                        }
                                      }}
                                      onFocus={() => {
                                        const amountValue = selectedOffer.isManualAmount ? selectedOffer.manualAmount : selectedOffer.amount;
                                        if (amountValue !== undefined && amountValue !== null) {
                                          setManualAmounts(prev => ({ ...prev, [offer.vendor]: toFixed2Raw(amountValue) }));
                                        }
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      style={{ fontFamily: 'Arial, sans-serif' }}
                                    />
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={formatNumberWithCommas(offer.total)}
                                    readOnly
                                    className="w-full bg-gray-100 border border-gray-300 rounded-md py-1 px-2 text-sm"
                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                  />
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                                <input
                                  type="text"
                                  value={offer.currency}
                                  readOnly
                                  className="w-full bg-gray-100 border border-gray-300 rounded-md py-1 px-2 text-sm"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ كتابة</label>
                                <input
                                  value={selectedOffer.amountInWords || ''}
                                  readOnly
                                  className={`w-full bg-gray-100 border border-gray-300 rounded-md py-1 px-2 text-sm amount-in-words ${(selectedOffer.amountInWords || '').length > 50 ? 'long-text' : ''}`}
                                />
                              </div>
                            </div>
                            
                            {/* عرض الالتزامات */}
                            {(commitments.vendorLevel.length > 0 || commitments.lineLevel.length > 0) && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">الالتزامات المطلوبة:</label>
                                <div className="bg-gray-100 p-2 rounded border text-sm">
                                  {commitments.vendorLevel.length > 0 && (
                                    <div className="mb-2">
                                      <strong>التزامات عامة:</strong>
                                      <ul className="list-disc pr-5 space-y-1 mt-1">
                                        {commitments.vendorLevel.map((commitment, idx) => (
                                          <li key={idx}>{commitment}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {commitments.lineLevel.length > 0 && (
                                    <div>
                                      <strong>التزامات خاصة بالأسطر:</strong>
                                      {commitments.lineLevel.map((lineCommitment, idx) => (
                                        <div key={idx} className="mt-1">
                                          <span className="font-medium">السطر {lineCommitment.lineNumber}:</span>
                                          <ul className="list-disc pr-5 space-y-1 mt-1">
                                            {(lineCommitment.commitments || []).map((commitment, cidx) => (
                                              <li key={cidx}>{commitment}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* عرض تفاصيل الأصناف المرسى عليها */}
                            {selectedOffer.lineItems && selectedOffer.lineItems.length > 0 && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل الأصناف المرسى عليها:</label>
                                <div className="bg-gray-100 p-2 rounded border text-sm max-h-40 overflow-y-auto">
                                  <table className="w-full text-sm border-collapse border border-gray-300">
                                    <thead>
                                      <tr className="bg-gray-200">
                                        <th className="border border-gray-300 p-1 text-center">م</th>
                                        <th className="border border-gray-300 p-1 text-right">الصنف</th>
                                        <th className="border border-gray-300 p-1 text-center">الكمية</th>
                                        <th className="border border-gray-300 p-1 text-center">الوحدة</th>
                                        <th className="border border-gray-300 p-1 text-center">السعر</th>
                                        <th className="border border-gray-300 p-1 text-center">الإجمالي</th>
                                        <th className="border border-gray-300 p-1 text-right">التزامات السطر</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedOffer.lineItems.map((item: OfferLineItem, idx: number) => {
                                        const commitmentsText = (item.commitments && item.commitments.length > 0) ? item.commitments.join('، ') : '—';
                                        return (
                                          <tr key={idx}>
                                            <td className="border border-gray-300 p-1 text-center">{idx + 1}</td>
                                            <td className="border border-gray-300 p-1 text-right">{item.name}</td>
                                            <td className="border border-gray-300 p-1 text-center">{item.awardedQty}</td>
                                            <td className="border border-gray-300 p-1 text-center">{item.unit}</td>
                                            <td className="border border-gray-300 p-1 text-center">{formatNumberWithCommas(item.unitPrice)}</td>
                                            <td className="border border-gray-300 p-1 text-center">{formatNumberWithCommas(item.total)}</td>
                                            <td className="border border-gray-300 p-1 text-right">{commitmentsText}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
              
              {(recommendation?.selectedOffers ?? []).length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">إجمالي المبلغ المرسى عليه:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">المبلغ بالريال اليمني</label>
                      <div className="text-lg font-bold text-blue-900">
                        {formatNumberWithCommas(recommendation?.totalAwardedInYR || 0)} ريال يمني
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">المبلغ كتابة</label>
                      <div className="text-sm text-blue-800 bg-white p-2 rounded border">
                        {recommendation?.totalAwardedInYRWords || ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* جدول التوصية للطباعة */}
            <div className="hidden print:block print:space-y-0">
              {printType === 'preliminary' ? (
                // جدول فارغ للطباعة الأولية
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex gap-3 mb-6">
                      <div className="w-[25%]">
                        <span className="font-medium block">بمبلغ(رقماً):__________________</span>
                      </div>
                      <div className="w-[15%]">
                        <span className="font-medium block">العملة:_____________</span>
                      </div>
                      <div className="w-[60%]">
                        <span className="font-medium block">المبلغ كتابة:___________________________________________________________</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-1 print:pb-4">
                    <p>ملاحظات:__________________________________________________________________________________________________________________</p>
                    <p>____________________________________________________________________________________________________________________________</p>
                  </div>
                </div>
              ) : (
                // بيانات حقيقية للطباعة النهائية
                (recommendation?.selectedOffers ?? []).length > 0 ? (
                  (recommendation?.selectedOffers ?? []).map((offer, index: number) => {
                    const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
                    const commitments = getCategorizedCommitments(offer.vendor);
                    
                    return (
                      <div key={offer.vendor} className="mt-2">
                        <div className="border-b border-gray-300 pb-2 mb-2 last:border-b-0">
                          <div className="flex items-center gap-3 flex-wrap print-tight">
                            <span className="font-medium">
                              {index === 0 ? '' : 'ومن'} {offer.vendor}
                            </span>
                            <span className="text-gray-700">بمبلغ</span>
                            <span className="font-medium">
                              {formatNumberWithCommas(
                                offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0
                              )}
                            </span>
                            <span className="font-medium">{offer.currency}</span>
                            <span className="font-medium">المبلغ كتابة:</span>
                            <span className="flex-1 amount-in-words">{offer.amountInWords}</span>
                            <span className="text-sm text-gray-700">شاملاً الضرائب وجميع المصاريف الأخرى</span>
                          </div>
                          
                          {offer.awardedLineNumbers && offer.awardedLineNumbers.length > 0 && (
                            <div className="mt-1 text-sm">
                              <span className="font-medium">الأسطر المرسى عليها: </span>
                              {offer.awardedLineNumbers.join(', ')}
                            </div>
                          )}
                          
                          {/* جدول تفاصيل الأسطر المرسى عليها */}
                          {offer.lineItems && offer.lineItems.length > 0 && (
                            <div className="mt-2 overflow-x-auto">
                              <table className="w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-gray-300 px-2 py-1 text-right">الصنف</th>
                                    <th className="border border-gray-300 px-2 py-1 text-center">الكمية المرسى عليها</th>
                                    <th className="border border-gray-300 px-2 py-1 text-center">سعر الوحدة</th>
                                    <th className="border border-gray-300 px-2 py-1 text-center">الإجمالي</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">التزامات السطر</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {offer.lineItems.map((li: OfferLineItem, idx: number) => {
                                    const commitmentsText = (li.commitments && li.commitments.length > 0) ? li.commitments.join('، ') : '—';
                                    return (
                                      <tr key={idx}>
                                        <td className="border border-gray-300 px-2 py-1 text-right">{li.name}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-center">{li.awardedQty} {li.unit}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-center">{formatNumberWithCommas(li.unitPrice)} {offer.currency}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-center">{formatNumberWithCommas(li.total)} {offer.currency}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-right">{commitmentsText}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          
                          {/* الالتزامات على مستوى المورد */}
                          {commitments.vendorLevel.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">مع الالتزام بالاتي:</p>
                              <ul className="list-disc pr-5 text-sm">
                                {commitments.vendorLevel.map((commitment, idx) => (
                                  <li key={idx}>{commitment}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* الالتزامات على مستوى الأسطر */}
                          {commitments.lineLevel.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">التزامات خاصة بالأسطر:</p>
                              {commitments.lineLevel.map((lineCommitment, idx) => (
                                <div key={idx} className="mt-1">
                                  <span className="font-medium">السطر {lineCommitment.lineNumber}:</span>
                                  <ul className="list-disc pr-5 text-sm">
                                    {(lineCommitment.commitments || []).map((commitment, cidx) => (
                                      <li key={cidx}>{commitment}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex gap-3 mb-6">
                    <div className="w-[25%]">
                      <span className="font-medium block">بمبلغ(رقماً):__________________</span>
                    </div>
                    <div className="w-[15%]">
                      <span className="font-medium block">العملة:_____________</span>
                    </div>
                    <div className="w-[60%]">
                      <span className="font-medium block">المبلغ كتابة:___________________________________________________________</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* أزرار الطباعة */}
      <div className="mt-6 flex gap-4 print:hidden">
        <button
          onClick={handlePreliminaryPrint}
          disabled={printStatus === 'processing'}
          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Printer size={16} />
          <span>طباعة أولية</span>
        </button>
        <button
          onClick={handleFinalPrint}
          disabled={printStatus === 'processing'}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Printer size={16} />
          <span>طباعة نهائية</span>
        </button>
      </div>
      
      {/* قسم التوقيعات للطباعة */}
      <div className="hidden print:block mt-2 space-y-2 print:mt-0 print:space-y-0">
        <div className="border-t border-gray-300 pt-2 print:my-0">
          <div className="grid gap-0 text-center" style={{ gridTemplateColumns: `repeat(${signatures.length}, minmax(0, 1fr))` }}>
            {signatures.map((signature, index) => (
              <div key={index} className="signature-box">
                <div className="signature-title">{signature.title}</div>
                <div className="signature-name">{signature.name}</div>
                <div className="text-xs text-gray-600">{signature.role}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* النص الثابت بعد التوقيعات (للطباعة النهائية فقط) */}
        {printType === 'final' && (
          <div className="hidden print:block border border-gray-300 rounded-lg p-2 mt-4 print:mt-2">
            <p className="font-medium pt-2 pb-1">حياكم الله..</p>
            <p>مع الموافقة وإستكمال إجراءات الشراء حسب النظام</p>
            <p className="text-center">وشكراً...</p>
            <div className="mt-2 font-bold text-left print:mt-0">
              <p className="font-medium">{getRecipient()}</p>
              <p className="font-medium">{getSignatoryForPrint()}</p>
              <p className="text-sm mt-2 print:mt-0">
                {calculateTotalAwardedInYR() > 150000 ? 'الاستاذ' : 'التوقيع'}
              </p>
            </div>
          </div>
        )}
        
        <div style={{ border: '1px solid #000', margin: '5px 0' }}></div>
      </div>
      
      {/* علامة الطباعة الأولية */}
      {isPreliminaryPrint && (
        <div className="hidden print:block fixed top-4 left-2 text-red-600 font-bold text-xl transform -rotate-45 border-2 border-red-600 rounded-md p-2">
          طباعة أولية
        </div>
      )}
      
      {/* نافذة الرسائل */}
      {showMessagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Mail className="ml-2" size={20} />
                  إدارة الرسائل
                </h3>
                <button
                  onClick={() => setShowMessagesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMessageType('awarded')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      messageType === 'awarded' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    الموردين المرسى عليهم
                  </button>
                  <button
                    onClick={() => setMessageType('excluded')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      messageType === 'excluded' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    الموردين المستبعدين
                  </button>
                  <button
                    onClick={() => setMessageType('financial')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      messageType === 'financial' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    الشؤون المالية
                  </button>
                </div>
                
                <div className="space-y-4">
                  {messageType === 'awarded' && recommendation?.selectedOffers.map(offer => (
                    <div key={`msg-awarded-${offer.vendor}`} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-800">رسالة إلى: {offer.vendor}</h4>
                        <button
                          onClick={() => copyMessageToClipboard(generateVendorMessage(offer.vendor, 'awarded'))}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          نسخ الرسالة
                        </button>
                      </div>
                      <textarea
                        value={generateVendorMessage(offer.vendor, 'awarded')}
                        readOnly
                        className="w-full h-40 border border-green-300 rounded p-3 text-sm bg-white"
                      />
                    </div>
                  ))}
                  
                  {messageType === 'excluded' && priceOffers
                    .filter(offer => offer.vendor && offer.result !== 'مطابق')
                    .map(offer => (
                    <div key={`msg-excluded-${offer.vendor}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-red-800">رسالة إلى: {offer.vendor}</h4>
                        <button
                          onClick={() => copyMessageToClipboard(generateVendorMessage(offer.vendor, 'excluded'))}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          نسخ الرسالة
                        </button>
                      </div>
                      <textarea
                        value={generateVendorMessage(offer.vendor, 'excluded')}
                        readOnly
                        className="w-full h-40 border border-red-300 rounded p-3 text-sm bg-white"
                      />
                    </div>
                  ))}
                  
                  {messageType === 'financial' && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-800">رسالة إلى: إدارة الشؤون المالية</h4>
                        <button
                          onClick={() => copyMessageToClipboard(generateFinancialMessage())}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          نسخ الرسالة
                        </button>
                      </div>
                      <textarea
                        value={generateFinancialMessage()}
                        readOnly
                        className="w-full h-40 border border-blue-300 rounded p-3 text-sm bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowMessagesModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



 


// في ملف التوصية

// 1عند الضغط على زر الطباعة النهائي لا يقوم بالطباعة ارجو اصلاح الخلل

// 2
// يجب عمل التعديلات اللازمة لإضافة عمود لإظهار الالتزامات التي على مستوى السطر في جدول الترسية في الجدول الخاص بالأصناف المرسى عليها

// 3-
// يجب ان تضاف نص "شاملاً الضرائب وجميع المصاريف الأخرى بعد المبلغ الإجمالي للمورد في جدول التوصية وفي رسائل الترسية

// يرجى حل الاخطاء التالية

// Parameter 'item' implicitly has an 'any' type.



// 'recommendation.selectedOffers.length' is possibly 'undefined'.

// 'recommendation' is possibly 'null'.



// Parameter 'item' implicitly has an 'any' type.

// Parameter 'idx' implicitly has an 'any' type.

// 'recommendation.selectedOffers.length' is possibly 'undefined'.

// 'recommendation' is possibly 'null'.



// 'recommendation.selectedOffers.length' is possibly 'undefined'.

// Parameter 'li' implicitly has an 'any' type.



// Parameter 'idx' implicitly has an 'any' type.


// شرح الكود المدمج والمحسن
// 1. التقنية والمرونة
// تم دمج أفضل المميزات من الكودين معاً
// إضافة دعم أفضل للالتزامات على مستوى المورد والسطر
// تحسين في إدارة التوقيعات الديناميكية
// إضافة نافذة منبثقة لإدارة الرسائل
// 2. الدقة واحتواء حالات البيانات المتنوعة
// تحسين في عرض وتخزين تفاصيل الأصناف المرسى عليها
// دعم أفضل للترسية على مستوى الصنف والمورد
// تحسين في عرض الالتزامات على مستوى المورد والسطر
// إضافة دعم لعرض المبلغ المعادل بالريال اليمني على الشاشة فقط
// 3. التنظيم وسهولة الصيانة والوضوح
// تحسين في تنظيم الكود وتقسيمه إلى وظائف أصغر
// إضافة تعليقات توضيحية للكود
// تحسين في تسمية المتغيرات والوظائف
// تحسين في هيكل المكونات
// 4. المتطلبات الخاصة
// الفصل بين الطباعة الأولية والنهائية
// تغيير التوقيعات بناءً على المبلغ
// إظهار أو إخفاء النص الثابت بناءً على نوع الطباعة
// طباعة جدول التوصية والعروض المستبعدة فارغاً في الطباعة الأولية
// تغيير المخاطب بناءً على إجمالي المبلغ
// إظهار أو إخفاء توقيع مدير عام المشتريات والمخازن بناءً على المبلغ
// إظهار المبلغ المعادل بالريال اليمني على الشاشة فقط
// طباعة رسائل للشؤون المالية والموردين
// عرض الالتزامات في جدول التوصية
// نقل الأصناف المرسى عليها إلى رسائل الموردين
// حفظ جميع حقول جدول التوصية في قاعدة البيانات
// دعم الترسية على مستوى الإجمالي أو التفصيلي
// هذا الكود المدمج يلبي جميع المتطلبات المحددة ويجمع بين أفضل المميزات من الكودين الأصليين.





//  الملف المرفق كود ملف التوصية يرجى الاطلاع عليه ثم القيام بتعديله لتحقيق المطلوب



// في صفحة جدول التوصية

// 1-
// عند الضغط على زر الطباعة النهائية لا يتم الطباعة حيث تظهر رسالة
// رقم طلب الشراء محفوظ مسبقاً بنفس رقم المعاملة، سيتم تحديث البيانات.
// وبعد التأكيد لا يتم الطباعة
//  يتم اصلاح الخلل
// 2-
//  التأكد من أن التوقيعات تظهر بشكل افقي ويتغير المعنيين وعددهم عند اختلاف نوع الطباعة كما يلي:
// أولاً: عند الطباعة الاولية
// 1-
// اذا كان المعادل بالريال اليمني لاكبر عرض هو أقل من 150,000 ريال يمني
// فتظهر ثلاثة  توقيعات المختص -رئيس القسم -مدير الادارة
// 2-
// اذا كان المبلغ المعادل بالريال لاكبر عرض هو اكبر من 150,000 ريال يمني
// تظهر اربعه توقيعات كالتالي
// المختص -رئيس القسم -مدير الادارة- مدير عام الادارة 

// ثانياً: عند الطباعة النهائية
// إذا كان اجمالي المبالغ المرسى عليها تعادل 150 الف ريال يمني أو اقل فيتم عمل:
//  أ-
//  تعيين المخاطب في الصفحة الرئيسية "الأخ/مدير عام المشتريات والمخازن"
//  ب-
// تظهر ثلاثة توقيعات 
// المختص -رئيس قسم المشتريات -مدير ادارة المشتريات
// ج- تعيين المعتمد في النص الثابت للطباعة النهائية بعد التوقيعات "مدير عام المشتريات والمخازن"
//    وتحته يظهر نص "التوقيع"

// وإذا كان اجمالي المبالغ المرسى عليها أكبر من 150 الف ريال يمني فيتم عمل:
// أ- تعيين المخاطب في الصفحة الرئيسية "الأخ/لمدير العام التنفيذي"

// ب- تظهر التوقيعات النهائية 4 توقيعات 
// المختص -رئيس قسم المشتريات -مدير ادارة المشتريات-مدير عام المشتريات والمخازن 
//  ج- تعيين المعتمد في النص الثابت للطباعة النهائية بعد التوقيعات "المدير العام التنفيذي"
//  وتحته يظهر نص "الاستاذ"



// ملاحظة(( 
// يتم تحديد التوقيعات الأولية وعددها بناء على مبلغ أكبر عرض (المبلغ بالمعادل بالريال اليمني) هل هو اكبر من 150 الف ر ريال او اصغر
// يتم تحديد التوقيعات النهائية وعددها والمخاطب والمعتمد بناء على إجمالي مبالغ الترسية (المبلغ بالمعادل بالريال اليمني) هل هو اكبر من 150 الف ر ريال او أصغر))






// 3-

// يجب عمل التعديلات اللازمة 

// لاظهار الالتزمات التي يتم ادخالها في جدول على عروض الأسعار على مستوى السطر ان وجدت بحيث تظهر في جدول تفاصيل الأصناف المرسى عليها:

// 4-اصلاح ظهور حقل المبلغ كتابة عندما يتم الترسية على اجمالي العرض بدون ادخال اسعار الأصناف

// 5-تقديم وعمل مقترحات التحسين والمحافظة على التعليات واضافة اي تعليقات توضيحية
// ------------------


