
// // purchases_alamin7-copy5\src\components\PriceOffersSection.tsx
// // مكون جدول عروض الأسعار مع تحسينات شاملة ومتقدمة للواجهة والوظائف



import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Plus, Save, Edit, X, FileText, Award, Settings, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { PriceOffer, OfferLineItem, Currency, OfferResult } from '../types';
import { convertNumberToArabicWords, formatNumberWithCommas } from '../utils/numberToWords';

export const PriceOffersSection: React.FC = () => {
  const {
    priceOffers, // قائمة عروض الأسعار
    setPriceOffers,
    poItems,  // تفاصيل الأصناف في طلب الشراء
    offerCount,  // عدد عروض الأسعار
    setOfferCount,
    savePurchaseOrder,
    isPreliminaryPrint,
    excludedOffers,
    setExcludedOffers,
    recommendation,
    setRecommendation
  } = usePurchaseOrder();

  // حالات إدارة العروض المحسنة
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [showLineItemsModal, setShowLineItemsModal] = useState<string | null>(null);
  const [showAwardedItemsModal, setShowAwardedItemsModal] = useState<string | null>(null);
  const [showSpecificationsModal, setShowSpecificationsModal] = useState<{ offerId: string, lineNumber: number } | null>(null);
  const [showCommitmentsModal, setShowCommitmentsModal] = useState<{ offerId: string, lineNumber?: number } | null>(null);
  const [inputType, setInputType] = useState<'إجمالي' | 'تفصيلي'>('إجمالي');

  // حالات مؤقتة للتعديل
  const [tempOfferData, setTempOfferData] = useState<Partial<PriceOffer>>({});
  const [tempLineItems, setTempLineItems] = useState<OfferLineItem[]>([]);
  const [tempAwardedItems, setTempAwardedItems] = useState<OfferLineItem[]>([]);
  const [tempSpecifications, setTempSpecifications] = useState<{ [key: string]: string }>({});
  const [tempCommitments, setTempCommitments] = useState<string[]>([]);

  // حالات التحقق من تطابق المبالغ
  const [showAmountMismatchDialog, setShowAmountMismatchDialog] = useState(false);
  const [amountMismatchData, setAmountMismatchData] = useState<{
    offerId: string;  // معرف العرض
    offerTotal: number; // إجمالي مبلغ العرض
    lineItemsTotal: number; // إجمالي أسعار الأصناف
    difference: number;  // الفارق بين المجموعين
  } | null>(null);

  // حالات الرسائل التحذيرية
  const [showQuantityWarning, setShowQuantityWarning] = useState<{
    type: 'offered' | 'awarded';
    offerId: string;  // معرف العرض
    lineNumber?: number;  // اختياري للسطر المحدد
    requested: number; // الكمية المطلوبة
    offered?: number; // الكمية المقدمة
    awarded?: number; // الكمية المرساة
    message: string;  // رسالة التحذير
    onConfirm: () => void;
  } | null>(null);

  // حالات الإكمال التلقائي للموردين
  const [vendorSuggestions, setVendorSuggestions] = useState<string[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState<{ [key: number]: boolean }>({});

  // حالة لقيم الإدخال المؤقتة
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  // مراجع للحقول
  const vendorInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Flag to save after specs update to avoid stale closures
  const specsSavePendingRef = useRef(false);

  /**
   * تهيئة العروض عند تغيير عدد العروض
   * ينشئ عروض فارغة جديدة أو يحذف الزائد حسب العدد المطلوب
   */
  useEffect(() => {
    if (priceOffers.length < offerCount) {
      const newOffers: PriceOffer[] = [];
      for (let i = priceOffers.length; i < offerCount; i++) {
        newOffers.push({
          id: `offer-${Date.now()}-${i}`,
          vendor: '', // اسم المورد
          offerNumber: '', // رقم العرض
          amount: 0, // مبلغ العرض قبل الضرائب
          currency: 'ريال' as Currency, // العملة
          exchangeRate: undefined, // سعر الصرف (فارغ افتراضياً لغير الريال)
          taxIncluded: null, // هل العرض شامل للضرائب
          total: 0, // الإجمالي بعد الضرائب
          totalInWords: '',
          result: '' as OfferResult, // نتيجة العرض
          totalInYR: 0, // المعادل بالريال اليمني
          lineItems: [], // تفاصيل الأصناف
          commitments: [], // التزامات المورد
          notes: '' // ملاحظات
          ,

          items: undefined,
          totalAfterTax: undefined,
          totalInYR: undefined,
          totalAfterTaxInYR: undefined
        });
      }
      setPriceOffers([...priceOffers, ...newOffers]);
    } else if (priceOffers.length > offerCount) {
      setPriceOffers(priceOffers.slice(0, offerCount));
    }
  }, [offerCount, priceOffers.length]);

  /**
   * تفعيل نوع الإدخال تلقائياً حسب بيانات العرض
   * إذا كان العرض يحتوي على تفاصيل أصناف، يصبح "تفصيلي"
   */
  useEffect(() => {
    if (editingOffer) {
      const offer = priceOffers.find(o => o.id === editingOffer);
      if (offer && offer.lineItems && offer.lineItems.length > 0) {
        setInputType('تفصيلي');
        setTempLineItems([...offer.lineItems]);
      } else {
        setInputType('إجمالي');
        setTempLineItems([]);
      }
    }
  }, [editingOffer, priceOffers]);

  /**
   * دالة البحث عن الموردين للإكمال التلقائي
   */
  const searchVendors = (inputValue: string, index: number) => {
    if (!inputValue.trim()) {
      setVendorSuggestions([]);
      setShowVendorSuggestions(prev => ({ ...prev, [index]: false }));
      return;
    }
    // الحصول على قائمة الموردين الحاليين من جميع العروض
    const allVendors = Array.from(new Set(
      priceOffers.map(offer => offer.vendor).filter(vendor => vendor && vendor.trim())
    ));
    // فلترة الموردين الذين يتطابقون مع نص البحث
    const filtered = allVendors.filter(vendor =>
      vendor.toLowerCase().includes(inputValue.toLowerCase())
    );
    setVendorSuggestions(filtered);
    setShowVendorSuggestions(prev => ({ ...prev, [index]: true }));
  };

  /**
   * دالة تحديث عرض مع إعادة حساب الإجماليات والتحقق من التطابق
   */
  const handleUpdateOffer = (index: number, updates: Partial<PriceOffer>) => {
    setPriceOffers(priceOffers.map((offer, i) => {
      if (i === index) {
        const updatedOffer = { ...offer, ...updates };
        // إعادة حساب الإجماليات عند تغيير المبلغ أو العملة أو سعر الصرف أو الضرائب
        if ('amount' in updates || 'currency' in updates || 'exchangeRate' in updates || 'taxIncluded' in updates) {
          const amount = updates.amount !== undefined ? updates.amount : offer.amount;
          const currency = updates.currency || offer.currency;
          const exchangeRate = updates.exchangeRate !== undefined ? updates.exchangeRate : offer.exchangeRate;
          const taxIncluded = updates.taxIncluded !== undefined ? updates.taxIncluded : offer.taxIncluded;

          // حساب الإجمالي بعد الضرائب
          let total = amount;
          if (taxIncluded === false) {
            total = amount * (105 / 98); // إضافة 15% ضريبة
          }

          // حساب المعادل بالريال اليمني
          const totalInYR = currency === 'ريال' ? total : total * (exchangeRate || 1);

          // تحويل المبلغ إلى كلمات
          const totalInWords = convertNumberToArabicWords(total, currency);

          updatedOffer.total = total;  // الإجمالي بعد الضرائب
          updatedOffer.totalAfterTax = total; // إجمالي مبلغ العرض بعد الضرائب
          updatedOffer.totalInYR = totalInYR; // المعادل بالريال اليمني
          updatedOffer.totalInWords = totalInWords; // تحويل المبلغ إلى كلمات
        }
        return updatedOffer;
      }
      return offer;
    }));
  };

  /**
   * دالة بدء تعديل عرض عند النقر على سطر المورد
   */
  const handleStartEdit = (index: number) => {
    const offer = priceOffers[index];
    setEditingOffer(offer.id);
    setTempOfferData({ ...offer });
    // تحديد نوع الإدخال تلقائياً حسب بيانات العرض
    if (offer.lineItems && offer.lineItems.length > 0) {
      setInputType('تفصيلي');
      setTempLineItems([...offer.lineItems]);
    } else {
      setInputType('إجمالي');
      setTempLineItems([]);
    }
  };

  /**
   * دالة التحقق من تطابق إجمالي العرض مع إجمالي أسعار الأصناف
   */
  const checkAmountConsistency = (index: number): boolean => {
    const offer = priceOffers[index];
    if (!offer || !offer.lineItems || offer.lineItems.length === 0) return true;

    const lineItemsTotal = offer.lineItems.reduce((sum, item) => {
      // إذا كانت الضرائب غير شاملة، نستخدم المبلغ قبل الضريبة
      return sum + (offer.taxIncluded === false ? (item.lineTotalBeforeTax || 0) : (item.lineTotal || 0));
    }, 0);

    const offerTotal = offer.amount || 0;
    const difference = Math.abs(lineItemsTotal - offerTotal);

    // السماح بفارق صغير (أقل من 1 ريال) لتجنب مشاكل التقريب
    return difference < 1;
  };

  /**
   * دالة حفظ التعديلات مع التحقق من صحة البيانات وتطابق المبالغ
   */
  const handleSaveOffer = async (index: number) => {
    const offer = priceOffers[index];

    if (!tempOfferData.vendor) {
      alert('يجب إدخال اسم المورد على الأقل');
      return;
    }

    // التحقق من اكتمال البيانات المطلوبة
    const requiredFields = ['vendor', 'offerNumber', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !tempOfferData[field as keyof PriceOffer]);

    if (missingFields.length > 0) {
      alert(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
      return;
    }

    if (tempOfferData.currency !== 'ريال' && (!tempOfferData.exchangeRate || tempOfferData.exchangeRate <= 0)) {
      alert('سعر الصرف مطلوب للعملات الأجنبية');
      return;
    }

    if (tempOfferData.taxIncluded === null) {
      alert('يجب تحديد حالة الضرائب');
      return;
    }

    // التحقق من تطابق المبالغ إذا كان هناك تفاصيل أصناف
    if (inputType === 'تفصيلي' && tempLineItems.length > 0) {
      const lineItemsTotal = tempLineItems.reduce((sum, item) => {
        // إذا كانت الضرائب غير شاملة، نستخدم المبلغ قبل الضريبة
        return sum + (tempOfferData.taxIncluded === false ? (item.lineTotalBeforeTax || 0) : (item.lineTotal || 0));
      }, 0);

      const offerTotal = tempOfferData.amount || 0;
      const difference = Math.abs(lineItemsTotal - offerTotal);

      if (difference >= 1) {
        setAmountMismatchData({
          offerId: offer.id,
          offerTotal,
          lineItemsTotal,
          difference
        });
        setShowAmountMismatchDialog(true);
        return;
      }
    }

    // دمج المواصفات السابقة إن وُجدت عند الحفظ النهائي لتفادي فقدانها
    let finalLineItems = inputType === 'تفصيلي' ? tempLineItems : [];
    if (offer.lineItems && finalLineItems.length > 0) {
      finalLineItems = finalLineItems.map(li => {
        const prev = offer.lineItems!.find(p => p.lineNumber === li.lineNumber || p.itemId === li.itemId);
        return prev ? { ...li, vendorSpecifications: li.vendorSpecifications ?? prev.vendorSpecifications } : li;
      });
    }

    // تحديث العرض مع البيانات الجديدة
    const updates: Partial<PriceOffer> = {
      ...tempOfferData,
      lineItems: finalLineItems,
      result: tempOfferData.result || '' as OfferResult
    };

    handleUpdateOffer(index, updates);
    setEditingOffer(null);
    setTempOfferData({});
    setTempLineItems([]);
    await savePurchaseOrder();
  };

  /**
   * دالة معالجة عدم تطابق المبالغ مع خيارات الحل
   */
  const handleAmountMismatch = async (action: 'updateOffer' | 'saveWithNote') => {
    if (!amountMismatchData) return;
    const { offerId, lineItemsTotal } = amountMismatchData;

    if (action === 'updateOffer') {
      // تحديث إجمالي مبلغ العرض بحسب إجمالي الأصناف
      setTempOfferData(prev => ({
        ...prev,
        amount: lineItemsTotal,
        total: lineItemsTotal,
        totalAfterTax: lineItemsTotal
      }));
    } else if (action === 'saveWithNote') {
      // الحفظ مع إضافة ملاحظة عن الخطأ
      setTempOfferData(prev => ({
        ...prev,
        notes: (prev.notes || '') + '\n⚠️ ملاحظة: يوجد اختلاف بين إجمالي مبلغ العرض وإجمالي أسعار الأصناف'
      }));
    }

    setShowAmountMismatchDialog(false);
    setAmountMismatchData(null);

    // متابعة عملية الحفظ
    setTimeout(() => {
      const offerIndex = priceOffers.findIndex(o => o.id === amountMismatchData?.offerId);
      if (offerIndex !== -1) {
        handleSaveOffer(offerIndex);
      }
    }, 100);
  };

  /**
   * دالة إلغاء التعديل مع تنظيف البيانات المؤقتة
   */
  const handleCancelEdit = () => {
    setEditingOffer(null);
    setTempOfferData({});
    setTempLineItems([]);
    setTempAwardedItems([]);
  };

  /**
   * دالة التحقق من الكميات وإظهار الرسائل التحذيرية
   */
  const validateQuantities = (
    type: 'offered' | 'awarded',
    lineNumber: number,
    offeredQty: number,
    awardedQty?: number,
    onConfirm?: () => void
  ) => {
    const poItem = poItems.find(item => item.lineNumber === lineNumber);
    if (!poItem) return true;

    const requestedQty = poItem.quantity;

    if (type === 'offered' && offeredQty > requestedQty) {
      setShowQuantityWarning({
        type: 'offered',
        offerId: editingOffer || '',
        lineNumber,
        requested: requestedQty,
        offered: offeredQty,
        message: `الكمية المقدمة (${offeredQty}) تتجاوز الكمية المطلوبة (${requestedQty})`,
        onConfirm: onConfirm || (() => { })
      });
      return false;
    }

    if (type === 'awarded' && awardedQty !== undefined) {
      if (awardedQty > offeredQty) {
        setShowQuantityWarning({
          type: 'awarded',
          offerId: editingOffer || '',
          lineNumber,
          requested: requestedQty,
          offered: offeredQty,
          awarded: awardedQty,
          message: `الكمية المرسى عليها (${awardedQty}) تتجاوز الكمية المقدمة (${offeredQty})`,
          onConfirm: onConfirm || (() => { })
        });
        return false;
      }

      if (awardedQty > requestedQty) {
        setShowQuantityWarning({
          type: 'awarded',
          offerId: editingOffer || '',
          lineNumber,
          requested: requestedQty,
          offered: offeredQty,
          awarded: awardedQty,
          message: `الكمية المرسى عليها (${awardedQty}) تتجاوز الكمية المطلوبة (${requestedQty})`,
          onConfirm: onConfirm || (() => { })
        });
        return false;
      }
    }

    return true;
  };

  /**
   * دالة تحديث سطر في تفاصيل الأصناف مع إعادة حساب الإجماليات
   */
  const handleUpdateLineItem = (index: number, updates: Partial<OfferLineItem>) => {
    const updatedLineItems = tempLineItems.map((item, i) => {
      if (i === index) {
        // Preserve existing vendorSpecifications if not explicitly provided in updates
        const merged: OfferLineItem = {
          ...item,
          ...updates,
          vendorSpecifications: updates.vendorSpecifications ?? item.vendorSpecifications,
        } as OfferLineItem;

        // إعادة حساب إجمالي السطر عند تغيير الكمية أو السعر
        if ('offeredQty' in updates || 'unitPrice' in updates) {
          const qty = merged.offeredQty || 0;
          const price = merged.unitPrice || 0;

          // حساب الإجمالي قبل الضريبة
          merged.lineTotalBeforeTax = qty * price;

          // حساب الإجمالي بعد الضريبة
          if (tempOfferData.taxIncluded === false) {
            merged.lineTotalAfterTax = qty * (price * (105 / 98));
            merged.unitPriceAfterTax = Math.round((price * (105 / 98)) * 100) / 100;
          } else {
            merged.lineTotalAfterTax = qty * price;
            merged.unitPriceAfterTax = price;
          }

          merged.lineTotal = merged.lineTotalAfterTax;
        }

        return merged;
      }
      return item;
    });

    setTempLineItems(updatedLineItems);

    // تحديث نتيجة العرض تلقائياً بناءً على الكميات المرسى عليها
    updateOfferResultBasedOnAwarded(updatedLineItems);
  };

  /**
   * دالة تحديث نتيجة العرض تلقائياً بناءً على الكميات المرسى عليها
   */
  const updateOfferResultBasedOnAwarded = (lineItems: OfferLineItem[]) => {
    if (!editingOffer) return;

    const hasAwardedItems = lineItems.some(item => (item.awardedQty || 0) > 0);
    if (!hasAwardedItems) return;

    const allFullyAwarded = lineItems.every(item => {
      const awardedQty = item.awardedQty || 0;
      const offeredQty = item.offeredQty || 0;
      return awardedQty > 0 && awardedQty === offeredQty;
    });

    const newResult = allFullyAwarded ? 'مطابق' : 'مطابق جزئي';

    setTempOfferData(prev => ({
      ...prev,
      result: newResult
    }));
  };

  /**
   * دالة إضافة سطر في تفاصيل الأصناف
   */
  const handleAddLineItem = () => {
    if (!showLineItemsModal) return;

    const newLineItem: OfferLineItem = {
      itemId: `line-${Date.now()}`,
      lineNumber: tempLineItems.length + 1, // رقم السطر
      name: '',  // اسم الصنف
      unit: '', // وحدة القياس
      requestedQty: 0, // الكمية المطلوبة
      offeredQty: 0, // الكمية المقدمة
      unitPrice: 0, // السعرUNT
      lineTotal: 0, // إجمالي السطر
      awarded: false, // هل تم الإرساء على الصنف
      specifications: {}, // مواصفات الصنف المطلوب
      commitments: [] // التزامات الصنف
    };

    setTempLineItems([...tempLineItems, newLineItem]);
  };

  /**
   * دالة حذف سطر من تفاصيل الأصناف
   */
  const handleRemoveLineItem = (index: number) => {
    setTempLineItems(tempLineItems.filter((_, i) => i !== index));
  };

  /**
   * دالة فتح نافذة المواصفات مع تهيئة الحقول من الأصناف المطلوبة
   */
  // const handleOpenSpecifications = (offerId: string, lineNumber: number) => {
  //   const offer = priceOffers.find(o => o.id === offerId);
  //   const lineItem = offer?.lineItems?.find(li => li.lineNumber === lineNumber);

  //   // تهيئة المواصفات من الأصناف المطلوبة كحقول فارغة
  //   const poItem = poItems.find(item => item.lineNumber === lineNumber);
  //   const initialSpecs: { [key: string]: string } = {};

  //   if (poItem?.specifications) {
  //     // إنشاء حقول فارغة بناءً على مواصفات الصنف المطلوب
  //     Object.keys(poItem.specifications).forEach(key => {
  //       initialSpecs[key] = lineItem?.vendorSpecifications?.[key] ?? '';
  //     });
  //   }

  //   // إضافة أي مواصفات إضافية موجودة من المورد
  //   if (lineItem?.vendorSpecifications) {
  //     Object.entries(lineItem.vendorSpecifications).forEach(([key, value]) => {
  //       if (!(key in initialSpecs)) {
  //         // Ensure string type; if vendor spec value is undefined, default to empty string
  //         initialSpecs[key] = value ?? '';
  //       }
  //     });
  //   }

  //   setTempSpecifications(initialSpecs);
  //   setShowSpecificationsModal({ offerId, lineNumber });
  // };

  // دالة فتح نافذة المواصفات مع تهيئة الحقول من الأصناف المطلوبة
  const handleOpenSpecifications = (offerId: string, lineNumber: number) => {
    const offer = priceOffers.find(o => o.id === offerId);
    const lineItem = offer?.lineItems?.find(li => li.lineNumber === lineNumber);

    // تهيئة المواصفات من الأصناف المطلوبة كحقول فارغة
    const poItem = poItems.find(item => item.lineNumber === lineNumber);
    const initialSpecs: { [key: string]: string } = {};

    if (poItem?.specifications) {
      // إنشاء حقول فارغة بناءً على مواصفات الصنف المطلوب
      Object.keys(poItem.specifications).forEach(key => {
        initialSpecs[key] = lineItem?.vendorSpecifications?.[key] ?? '';
      });
    }

    // إضافة أي مواصفات إضافية موجودة من المورد
    if (lineItem?.vendorSpecifications) {
      Object.entries(lineItem.vendorSpecifications).forEach(([key, value]) => {
        if (!(key in initialSpecs)) {
          // التأكد من أن القيمة سلسلة نصية
          initialSpecs[key] = typeof value === 'string' ? value : String(value || '');
        }
      });
    }

    setTempSpecifications(initialSpecs);
    setShowSpecificationsModal({ offerId, lineNumber });
  };

  // اضافة دالة مساعدة للتحقق من صحة المواصفات
  const isValidSpecification = (specs: any): specs is { [key: string]: string } => {
    return typeof specs === 'object' &&
      specs !== null &&
      !Array.isArray(specs) &&
      Object.keys(specs).length > 0;
  };

  /**
   * دالة حفظ المواصفات مع التحقق من التطابق
   */
  // const handleSaveSpecifications = () => {
  //   if (!showSpecificationsModal) return;
  //   const { offerId, lineNumber } = showSpecificationsModal;

  //   specsSavePendingRef.current = true;

  //   // تحديث المواصفات في العرض
  //   setPriceOffers(priceOffers.map(offer => {
  //     if (offer.id === offerId && offer.lineItems) {
  //       const updatedLineItems = offer.lineItems.map(li => {
  //         if (li.lineNumber === lineNumber) {
  //           return {
  //             ...li,
  //             vendorSpecifications: { ...tempSpecifications }
  //           };
  //         }
  //         return li;
  //       });
  //       return { ...offer, lineItems: updatedLineItems };
  //     }
  //     return offer;
  //   }));

  //   setShowSpecificationsModal(null);
  //   setTempSpecifications({});

  //   // سيتم الحفظ في useEffect التالي بعد تحديث الحالة
  // };

  //  تعديل دالة حفظ المواصفات في صفحة عروض الأسعار

  // دالة حفظ المواصفات مع التحقق من التطابق
  const handleSaveSpecifications = async () => {
    if (!showSpecificationsModal) return;
    const { offerId, lineNumber } = showSpecificationsModal;

    // تحديث المواصفات في العرض
    setPriceOffers(prevOffers => {
      return prevOffers.map(offer => {
        if (offer.id === offerId) {
          const updatedLineItems = [...(offer.lineItems || [])];
          const lineItemIndex = updatedLineItems.findIndex(li => li.lineNumber === lineNumber);

          if (lineItemIndex !== -1) {
            // تحديث المواصفات للسطر المحدد
            updatedLineItems[lineItemIndex] = {
              ...updatedLineItems[lineItemIndex],
              vendorSpecifications: { ...tempSpecifications }
            };
          } else {
            // إذا لم يكن السطر موجودًا، أضف سطرًا جديدًا
            const poItem = poItems.find(item => item.lineNumber === lineNumber);
            if (poItem) {
              updatedLineItems.push({
                itemId: poItem.id,
                lineNumber: poItem.lineNumber,
                name: poItem.name,
                unit: poItem.unit,
                requestedQty: poItem.quantity,
                offeredQty: poItem.quantity,
                unitPrice: 0,
                lineTotal: 0,
                awarded: false,
                specifications: {},
                vendorSpecifications: { ...tempSpecifications },
                commitments: []
              });
            }
          }

          return {
            ...offer,
            lineItems: updatedLineItems
          };
        }
        return offer;
      });
    });

    setShowSpecificationsModal(null);
    setTempSpecifications({});

    // حفظ التغييرات في قاعدة البيانات فوراً
    try {
      await savePurchaseOrder();
      console.log("تم حفظ المواصفات بنجاح في قاعدة البيانات");
    } catch (error) {
      console.error("خطأ في حفظ المواصفات:", error);
    }
  };

  /**
   * دالة فتح نافذة الالتزامات (على مستوى السطر أو المورد)
   */
  const handleOpenCommitments = (offerId: string, lineNumber?: number) => {
    const offer = priceOffers.find(o => o.id === offerId);

    if (lineNumber !== undefined) {
      // التزامات على مستوى السطر
      const lineItem = offer?.lineItems?.find(li => li.lineNumber === lineNumber);
      setTempCommitments(lineItem?.commitments || []);
    } else {
      // التزامات على مستوى المورد
      setTempCommitments(offer?.commitments || []);
    }

    setShowCommitmentsModal({ offerId, lineNumber });
  };

  /**
   * دالة حفظ الالتزامات حسب المستوى (سطر أو مورد)
   */
  // const handleSaveCommitments = () => {
  //   if (!showCommitmentsModal) return;
  //   const { offerId, lineNumber } = showCommitmentsModal;

  //   setPriceOffers(priceOffers.map(offer => {
  //     if (offer.id === offerId) {
  //       if (lineNumber !== undefined && offer.lineItems) {
  //         // حفظ على مستوى السطر
  //         const updatedLineItems = offer.lineItems.map(li => {
  //           if (li.lineNumber === lineNumber) {
  //             return { ...li, commitments: [...tempCommitments.filter(c => c.trim())] };
  //           }
  //           return li;
  //         });
  //         return { ...offer, lineItems: updatedLineItems };
  //       } else {
  //         // حفظ على مستوى المورد
  //         return { ...offer, commitments: [...tempCommitments.filter(c => c.trim())] };
  //       }
  //     }
  //     return offer;
  //   }));

  //   setShowCommitmentsModal(null);
  //   setTempCommitments([]);
  //   savePurchaseOrder();
  // };

  // تعديل دالة حفظ الالتزامات لتحسين الأداء
  // دالة حفظ الالتزامات حسب المستوى (سطر أو مورد)
const handleSaveCommitments = () => {
  if (!showCommitmentsModal) return;
  const { offerId, lineNumber } = showCommitmentsModal;
  
  // استخدام setTimeout لتجنب مشاكل التحديث المتزامن
  setTimeout(() => {
    setPriceOffers(prevOffers => {
      return prevOffers.map(offer => {
        if (offer.id === offerId) {
          if (lineNumber !== undefined && offer.lineItems) {
            // حفظ على مستوى السطر
            const updatedLineItems = offer.lineItems.map(li => {
              if (li.lineNumber === lineNumber) {
                return { 
                  ...li, 
                  commitments: [...tempCommitments.filter(c => c && c.trim())] 
                };
              }
              return li;
            });
            return { ...offer, lineItems: updatedLineItems };
          } else {
            // حفظ على مستوى المورد
            return { 
              ...offer, 
              commitments: [...tempCommitments.filter(c => c && c.trim())] 
            };
          }
        }
        return offer;
      });
    });
    
    setShowCommitmentsModal(null);
    setTempCommitments([]);
    
    // حفظ التغييرات في قاعدة البيانات
    savePurchaseOrder();
  }, 0);
};


  /**
   * دالة إضافة التزام جديد
   */
  const handleAddCommitment = () => {
    setTempCommitments([...tempCommitments, '']);
  };

  /**
   * دالة تحديث التزام محدد
   */
  const handleUpdateCommitment = (index: number, value: string) => {
    const updatedCommitments = tempCommitments.map((commitment, i) =>
      i === index ? value : commitment
    );
    setTempCommitments(updatedCommitments);
  };

  /**
   * دالة حذف التزام محدد
   */
  const handleRemoveCommitment = (index: number) => {
    setTempCommitments(tempCommitments.filter((_, i) => i !== index));
  };

  /**
   * دالة التحقق من اكتمال العرض
   */
  const isOfferComplete = (offer: PriceOffer): boolean => {
    return !!(
      offer.vendor &&
      offer.offerNumber &&
      offer.amount > 0 &&
      offer.currency &&
      offer.taxIncluded !== null &&
      (offer.currency === 'ريال' || (offer.exchangeRate && offer.exchangeRate > 0))
    );
  };

  /**
   * دالة إعادة استخدام سعر الصرف من عروض أخرى
   */
  const getReuseableExchangeRate = (currency: string): number | undefined => {
    const existingOffer = priceOffers.find(offer =>
      offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
    );
    return existingOffer?.exchangeRate;
  };

  /**
   * دالة حساب إجمالي تفاصيل الأصناف
   */
  const calculateLineItemsTotal = (lineItems: OfferLineItem[]): number => {
    return lineItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  };

  /**
   * دالة حساب إجمالي الكميات المرسى عليها
   */
  const calculateAwardedTotal = (lineItems: OfferLineItem[]): number => {
    return lineItems.reduce((sum, item) => {
      const awardedQty = item.awardedQty || 0;
      const price = item.unitPriceAfterTax || item.unitPrice || 0;
      return sum + (awardedQty * price);
    }, 0);
  };

  /**
   * دالة فتح نافذة الكميات المرسى عليها
   */
  const handleOpenAwardedItems = (offerId: string) => {
    const offer = priceOffers.find(o => o.id === offerId);
    if (offer && offer.lineItems) {
      setTempAwardedItems([...offer.lineItems]);
    } else {
      // إنشاء قائمة من الأصناف المطلوبة للترسية
      const awardedItems = poItems.map(item => ({
        itemId: item.id,
        lineNumber: item.lineNumber,
        name: item.name,
        unit: item.unit,
        requestedQty: item.quantity,
        offeredQty: item.quantity,
        unitPrice: 0,
        lineTotal: 0,
        awarded: false,
        awardedQty: 0,
        specifications: {}, // مواصفات الصنف المطلوب
        commitments: []
      }));
      setTempAwardedItems(awardedItems);
    }
    setShowAwardedItemsModal(offerId);
  };

  /**
   * دالة حفظ تفاصيل الترسية
   */
  const handleSaveAwardedItems = () => {
    if (!showAwardedItemsModal) return;

    // تحديث العرض مع تفاصيل الترسية مع الحفاظ على vendorSpecifications إن وُجدت
    const offerIndex = priceOffers.findIndex(o => o.id === showAwardedItemsModal);
    if (offerIndex !== -1) {
      const existing = priceOffers[offerIndex].lineItems || [];
      const mergedItems = tempAwardedItems.map(t => {
        const prev = existing.find(p => p.lineNumber === t.lineNumber || p.itemId === t.itemId);
        return prev ? { ...t, vendorSpecifications: prev.vendorSpecifications ?? t.vendorSpecifications } : t;
      });

      // تحديد النتيجة تلقائياً بناءً على الكميات المرسى عليها
      const hasAnyAwarded = mergedItems.some(li => (li.awardedQty || 0) > 0 || li.awarded);
      let newResult: OfferResult = '' as OfferResult;

      if (hasAnyAwarded) {
        const fullyAwarded = mergedItems.every(li => {
          const awardedQty = li.awardedQty || 0;
          const offeredQty = li.offeredQty || 0;
          return awardedQty > 0 && awardedQty === offeredQty;
        });
        newResult = fullyAwarded ? 'مطابق' : 'مطابق جزئي';
      }

      handleUpdateOffer(offerIndex, { lineItems: mergedItems, result: newResult });

      // تحديث التوصية تلقائياً: إضافة الموردين الذين لديهم ترسية فقط
      const vendorName = priceOffers[offerIndex].vendor;
      if (vendorName && hasAnyAwarded) {
        setRecommendation((prev: any) => {
          const existingRec = prev?.selectedOffers || [];
          const already = existingRec.some((o: any) => o.vendor === vendorName);

          if (already) return prev || null;

          // حساب المبلغ بناءً على الكميات المرسى عليها فقط
          const awardedTotal = mergedItems.reduce((sum, li) => {
            if (li.awarded || (li.awardedQty || 0) > 0) {
              const awardedQty = li.awardedQty || li.offeredQty || 0;
              const unitPrice = li.unitPriceAfterTax || li.unitPrice || 0;
              return sum + (awardedQty * unitPrice);
            }
            return sum;
          }, 0);

          const currency = priceOffers[offerIndex].currency;
          const totalInYR = awardedTotal * (priceOffers[offerIndex].exchangeRate || 1);
          const awardedLineNumbers = mergedItems
            .filter(li => li.awarded || (li.awardedQty || 0) > 0)
            .map(li => li.lineNumber);
          const amountInWords = convertNumberToArabicWords(awardedTotal, currency);

          const newOffer = {
            vendor: vendorName,
            amount: awardedTotal,
            currency,
            amountInWords,
            totalInYR,
            awardedLineNumbers,
            lineItems: mergedItems.filter(li => li.awarded || (li.awardedQty || 0) > 0).map(li => ({
              lineNumber: li.lineNumber,
              name: li.name,
              unit: li.unit,
              awardedQty: li.awardedQty || li.offeredQty || 0,
              unitPrice: li.unitPriceAfterTax || li.unitPrice || 0,
              total: (li.awardedQty || li.offeredQty || 0) * (li.unitPriceAfterTax || li.unitPrice || 0),
              commitments: li.commitments || []
            }))
          } as any;

          return { selectedOffers: [...existingRec, newOffer] } as any;
        });
      }
    }

    setShowAwardedItemsModal(null);
    savePurchaseOrder();
  };

  /**
   * دالة فتح نافذة إضافة أسعار الأصناف مع تهيئة البيانات
   */
  const handleOpenLineItemsModal = (offerId: string) => {
    const offer = priceOffers.find(o => o.id === offerId);

    // تهيئة البيانات المؤقتة للعرض الحالي
    if (offer && offer.lineItems) {
      setTempLineItems([...offer.lineItems]);
    } else {
      // إنشاء قائمة من الأصناف المطلوبة
      const lineItems = poItems.map(item => ({
        itemId: item.id,
        lineNumber: item.lineNumber,
        name: item.name,
        unit: item.unit,
        requestedQty: item.quantity,
        offeredQty: item.quantity,
        unitPrice: 0,
        lineTotal: 0,
        awarded: false,
        specifications: {},
        vendorSpecifications: {},
        commitments: []
      }));
      setTempLineItems(lineItems);
    }

    // تحديث بيانات العرض المؤقتة
    if (offer) {
      setTempOfferData({ ...offer });
    }

    setShowLineItemsModal(offerId);
  };

  /**
   * دالة تحديث قيمة الإدخال
   */
  const handleInputChange = (offerId: string, field: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [`${offerId}-${field}`]: value
    }));
  };

  // Save after specs update to avoid losing changes due to async state batching
  useEffect(() => {
    if (specsSavePendingRef.current) {
      specsSavePendingRef.current = false;
      savePurchaseOrder();
    }
  }, [priceOffers]);

  /**
   * دالة معالجة الضغط على مفتاح Enter للانتقال إلى الحقل التالي
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldIndex: number, totalFields: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();

      // الانتقال إلى الحقل التالي في نفس العرض
      const nextFieldIndex = (fieldIndex + 1) % totalFields;
      const nextField = document.querySelectorAll(`[data-field-index="${nextFieldIndex}"]`)[0] as HTMLInputElement;

      if (nextField) {
        nextField.focus();
      }
    }
  };

  /**
   * دالة التحقق من الحقول الإلزامية قبل الانتقال إلى العرض التالي
   */
  const validateRequiredFields = (offerIndex: number): boolean => {
    const offer = priceOffers[offerIndex];

    // التحقق من الحقول الإلزامية
    const requiredFields = ['vendor', 'offerNumber', 'currency'];

    for (const field of requiredFields) {
      if (!offer[field as keyof PriceOffer]) {
        alert(`يجب إدخال قيمة حقل ${field === 'vendor' ? 'مقدم العرض' : field === 'offerNumber' ? 'رقم العرض' : 'العملة'} قبل الانتقال إلى العرض التالي`);
        return false;
      }
    }

    if (offer.amount <= 0) {
      alert('يجب إدخال قيمة إجمالي مبلغ العرض قبل الانتقال إلى العرض التالي');
      return false;
    }

    if (offer.currency !== 'ريال' && (!offer.exchangeRate || offer.exchangeRate <= 0)) {
      alert('يجب إدخال سعر الصرف للعملات الأجنبية قبل الانتقال إلى العرض التالي');
      return false;
    }

    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200 print:mb-0 print-container">
      {/* رأس القسم المحسن */}
      <div className="flex items-center justify-between mb-4 print:mb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            <DollarSign className="ml-2 icon" size={20} />
            عروض الأسعار
          </h2>
          {/* عرض إحصائيات العروض */}
          <div className="flex items-center gap-4 text-sm text-gray-600 print:hidden">
            <span>العدد: {priceOffers.length}</span>
            <span>المكتملة: {priceOffers.filter(offer => isOfferComplete(offer)).length}</span>
            <span>المطابقة: {priceOffers.filter(offer => offer.result === 'مطابق').length}</span>
          </div>
        </div>
        {/* إعدادات عدد العروض ونوع الإدخال */}
        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">عدد العروض:</label>
            <select
              value={offerCount}
              onChange={(e) => setOfferCount(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">نوع الإدخال:</label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value as 'إجمالي' | 'تفصيلي')}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="إجمالي">إجمالي</option>
              <option value="تفصيلي">تفصيلي</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول العروض الرئيسي المحسن - عمود لكل مورد */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="border border-gray-300 p-3 text-center font-semibold" style={{ width: '20%' }}>
                البيان
              </th>
              {priceOffers.map((_, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-3 text-center font-medium"
                  style={{ width: `${80 / priceOffers.length}%` }}
                >
                  العرض {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* سطر مقدم العرض */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">مقدم العرض</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <div className="relative">
                    <input
                      ref={(el) => vendorInputRefs.current[index] = el}
                      type="text"
                      value={offer.vendor || ''}
                      onChange={(e) => {
                        handleUpdateOffer(index, { vendor: e.target.value });
                        searchVendors(e.target.value, index);
                      }}
                      onFocus={() => {
                        if (offer.vendor) {
                          searchVendors(offer.vendor, index);
                        }
                      }}
                      onBlur={(e) => {
                        // التحقق من الحقول الإلزامية عند المغادرة
                        if (e.target.value.trim() && index < priceOffers.length - 1) {
                          validateRequiredFields(index);
                        }
                        setTimeout(() => {
                          setShowVendorSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, 0, 5)}
                      data-field-index={0}
                      className="w-full border-0 focus:outline-none print:bg-transparent p-1 text-center"
                      placeholder="اسم مقدم العرض"
                      required
                    />
                    {showVendorSuggestions[index] && vendorSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto print:hidden">
                        {vendorSuggestions.map((suggestion, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-right"
                            onMouseDown={() => {
                              handleUpdateOffer(index, { vendor: suggestion });
                              setShowVendorSuggestions(prev => ({ ...prev, [index]: false }));
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* سطر رقم العرض */}
            <tr className={`${!isPreliminaryPrint ? 'print:hidden' : ''}`}>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">رقم العرض</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={offer.offerNumber || ''}
                    onChange={(e) => handleUpdateOffer(index, { offerNumber: e.target.value })}
                    onBlur={(e) => {
                      // التحقق من الحقول الإلزامية عند المغادرة
                      if (e.target.value.trim() && index < priceOffers.length - 1) {
                        validateRequiredFields(index);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, 1, 5)}
                    data-field-index={1}
                    className="w-full border-0 focus:outline-none print:bg-transparent p-1 text-center"
                    placeholder="رقم العرض"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    required
                  />
                </td>
              ))}
            </tr>

            {/* سطر العملة */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">العملة</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <select
                    value={offer.currency || 'ريال'}
                    onChange={(e) => {
                      const newCurrency = e.target.value as Currency;
                      handleUpdateOffer(index, { currency: newCurrency });

                      // إذا كانت العملة الأجنبية قد تم تحديدها من قبل، استخدم سعر الصرف السابق
                      if (newCurrency !== 'ريال' && newCurrency !== offer.currency) {
                        const existingRate = getReuseableExchangeRate(newCurrency);
                        if (existingRate) {
                          handleUpdateOffer(index, { exchangeRate: existingRate });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // التحقق من الحقول الإلزامية عند المغادرة
                      if (index < priceOffers.length - 1) {
                        validateRequiredFields(index);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, 2, 5)}
                    data-field-index={2}
                    className="w-full border rounded p-1 text-center"
                    required
                  >
                    <option value="ريال">ريال</option>
                    <option value="دولار">دولار</option>
                    <option value="ريال سعودي">ريال سعودي</option>
                    <option value="يورو">يورو</option>
                  </select>
                </td>
              ))}
            </tr>

            {/* سطر سعر الصرف */}
            <tr className="exchange-rate-row">
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">سعر الصرف</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2 print:p-0.5 print:text-xs">
                  {offer.currency !== 'ريال' && (
                    <input
                      type="number"
                      value={offer.exchangeRate || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          handleUpdateOffer(index, { exchangeRate: value });
                        }
                      }}
                      onBlur={(e) => {
                        // التحقق من الحقول الإلزامية عند المغادرة
                        if (e.target.value && index < priceOffers.length - 1) {
                          validateRequiredFields(index);
                        }
                      }}
                      onKeyDown={(e) => handleKeyDown(e, 3, 5)}
                      data-field-index={3}
                      className="w-full border-0 focus:outline-none [appearance:textfield] print:bg-transparent bg-yellow-50 p-1 text-center"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      placeholder="سعر الصرف"
                      required
                    />
                  )}
                </td>
              ))}
            </tr>

            {/* سطر الضرائب */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">الضرائب</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <select
                    value={offer.taxIncluded === null ? '' : (offer.taxIncluded ? 'شامل' : 'غير شامل')}
                    onChange={(e) => {
                      const val = e.target.value as '' | 'شامل' | 'غير شامل';
                      handleUpdateOffer(index, {
                        taxIncluded: val === '' ? null : (val === 'شامل'),
                        result: offer.result // الحفاظ على النتيجة الحالية
                      });
                    }}
                    onKeyDown={(e) => handleKeyDown(e, 4, 5)}
                    data-field-index={4}
                    className="w-full border-0 focus:outline-none print:hidden p-1 text-center"
                    required
                  >
                    <option value="">اختر</option>
                    <option value="شامل">شامل</option>
                    <option value="غير شامل">غير شامل</option>
                  </select>
                  <div className="hidden print:block">
                    {offer.taxIncluded === null ? 'اختر' : (offer.taxIncluded ? 'شامل' : 'غير شامل')}
                  </div>
                </td>
              ))}
            </tr>

            {/* سطر إجمالي مبلغ العرض */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">إجمالي مبلغ العرض</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputValues[`${offer.id}-amount`] || (offer.amount ? formatNumberWithCommas(offer.amount) : '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^\d*\.?\d*$/.test(raw)) {
                        handleInputChange(offer.id, 'amount', raw);
                        handleUpdateOffer(index, {
                          inputValue: raw,
                          amount: parseFloat(raw) || 0
                        });
                      }
                    }}
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      const parsed = parseFloat(raw);
                      if (!isNaN(parsed)) {
                        handleUpdateOffer(index, {
                          amount: parsed,
                          inputValue: parsed.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })
                        });
                      } else {
                        handleUpdateOffer(index, { inputValue: '', amount: 0 });
                      }

                      // التحقق من الحقول الإلزامية عند المغادرة
                      if (index < priceOffers.length - 1) {
                        validateRequiredFields(index);
                      }
                    }}
                    onFocus={(e) => {
                      if (offer.amount !== undefined && offer.amount !== 0) {
                        handleInputChange(offer.id, 'amount', offer.amount.toString());
                      } else {
                        handleInputChange(offer.id, 'amount', '');
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, 5, 5)}
                    data-field-index={5}
                    className="no-spin w-full border-0 focus:outline-none [appearance:textfield] print:bg-transparent p-1 text-center text-black-700 font-semibold"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    placeholder="0.00"
                    required
                  />
                </td>
              ))}
            </tr>

            {/* سطر الإجمالي بعد الضرائب */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">
                إجمالي مبلغ العرض
                <br />
                <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>(بعد الضرائب)</span>
              </td>
              {priceOffers.map((offer) => (
                <td key={offer.id} className="text-blue-600 font-bold border border-gray-300 p-2">
                  <input
                    type="text"
                    value={formatNumberWithCommas(offer.total || offer.totalAfterTax || 0)}
                    readOnly
                    className="w-full bg-gray-100 border-0 print:bg-transparent p-1 text-center"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </td>
              ))}
            </tr>

            {/* سطر المعادل بالريال اليمني - منفصل */}
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 font-medium text-center">المعادل بالريال اليمني</td>
              {priceOffers.map((offer) => (
                <td key={offer.id} className="text-green-600 font-bold border border-gray-300 p-2">
                  <input
                    type="text"
                    value={offer.totalInYR ? formatNumberWithCommas(offer.totalInYR) : ''}
                    readOnly
                    className="w-full bg-gray-100 border-0 print:bg-transparent p-1 text-center"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </td>
              ))}
            </tr>

            {/* سطر النتيجة */}
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">النتيجة</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <select
                    value={offer.result || ''}
                    onChange={(e) => {
                      const value = e.target.value as PriceOffer['result'];
                      handleUpdateOffer(index, { result: value });
                      if (value === 'مطابق جزئي') {
                        handleOpenAwardedItems(offer.id);
                      }
                    }}
                    className="border rounded p-1"
                  >
                    <option value="">اختر النتيجة</option>
                    <option value="مطابق">مطابق</option>
                    <option value="غير مطابق">غير مطابق</option>
                    <option value="مطابق جزئي">مطابق جزئي</option>
                  </select>
                </td>
              ))}
            </tr>

            {/* سطر الأزرار - منفصل */}
            <tr className="print:hidden">
              <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">الإجراءات</td>
              {priceOffers.map((offer, index) => (
                <td key={offer.id} className="border border-gray-300 p-2">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenLineItemsModal(offer.id)}
                      disabled={!isOfferComplete(offer)}
                      className="w-full px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-300"
                    >
                      إضافة أسعار الأصناف
                    </button>
                    <button
                      onClick={() => handleOpenAwardedItems(offer.id)}
                      disabled={!isOfferComplete(offer)}
                      className="w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
                    >
                      إضافة الكميات المرسى عليها
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* رسائل التحذير المحسنة */}
      <div className="mt-4 print:hidden space-y-2">
        {priceOffers.some((offer, index) => !isOfferComplete(offer)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm font-medium">
                يوجد عروض غير مكتملة. الحقول المطلوبة: مقدم العرض، رقم العرض، العملة، المبلغ، حالة الضرائب
                {priceOffers.some(offer => offer.currency !== 'ريال' && (!offer.exchangeRate || offer.exchangeRate <= 0)) &&
                  '، سعر الصرف للعملات الأجنبية'
                }
              </p>
            </div>
          </div>
        )}
        {priceOffers.some((offer, index) => !checkAmountConsistency(index)) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-red-800 text-sm">
                <p className="font-medium mb-1">يوجد عدم تطابق في المبالغ بين إجمالي العرض وإجمالي أسعار الأصناف في العروض التالية:</p>
                <ul className="list-disc pr-5 space-y-0.5">
                  {priceOffers.map((offer, idx) => {
                    if (!offer || !offer.lineItems || offer.lineItems.length === 0) return null;
                    const lineItemsTotal = offer.lineItems.reduce((sum, item) => {
                      return sum + (offer.taxIncluded === false ? (item.lineTotalBeforeTax || 0) : (item.lineTotal || 0));
                    }, 0);
                    const offerTotal = offer.amount || 0;
                    const difference = Math.abs(lineItemsTotal - offerTotal);
                    if (difference < 1) return null;
                    const name = offer.vendor?.trim() ? offer.vendor : `العرض ${idx + 1}`;
                    return (
                      <li key={offer.id}>
                        {name}: الفرق {formatNumberWithCommas(difference)} ({formatNumberWithCommas(lineItemsTotal)} مقابل {formatNumberWithCommas(offerTotal)})
                      </li>
                    );
                  }).filter(Boolean)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نافذة إضافة أسعار الأصناف */}
      {showLineItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="ml-2" size={20} />
                  إضافة أسعار الأصناف - {priceOffers.find(o => o.id === showLineItemsModal)?.vendor}
                </h3>
                <button
                  onClick={() => setShowLineItemsModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* عرض إجمالي مبلغ العرض والمتبقي */}
              {(() => {
                const offer = priceOffers.find(o => o.id === showLineItemsModal);
                const isNonTax = (tempOfferData.taxIncluded === false) || (offer?.taxIncluded === false);
                const lineItemsTotal = isNonTax
                  ? tempLineItems.reduce((sum, li) => sum + (li.lineTotalBeforeTax || 0), 0)
                  : calculateLineItemsTotal(tempLineItems);
                const offerTotal = isNonTax ? (offer?.amount || 0) : ((offer?.total ?? offer?.amount) || 0);
                const remaining = offerTotal - lineItemsTotal;

                return (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600">إجمالي مبلغ العرض</div>
                        <div className="text-lg font-semibold text-blue-800">
                          {formatNumberWithCommas(offerTotal)} {offer?.currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">إجمالي أسعار الأصناف</div>
                        <div className="text-lg font-semibold text-purple-800">
                          {formatNumberWithCommas(lineItemsTotal)} {offer?.currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">المتبقي</div>
                        <div className={`text-lg font-semibold ${Math.abs(remaining) < 1 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {formatNumberWithCommas(remaining)} {offer?.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* جدول إضافة أسعار الأصناف */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">إضافة أسعار الأصناف</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-center">السطر</th>
                        <th className="border border-gray-300 p-2 text-center">بيان الصنف</th>
                        <th className="border border-gray-300 p-2 text-center">الوحدة</th>
                        <th className="border border-gray-300 p-2 text-center">الكمية المطلوبة</th>
                        <th className="border border-gray-300 p-2 text-center">الكمية المقدمة</th>
                        {tempOfferData.taxIncluded === false && (
                          <>
                            <th className="border border-gray-300 p-2 text-center">سعر الوحدة (قبل الضريبة)</th>
                            <th className="border border-gray-300 p-2 text-center">سعر الوحدة (بعد الضريبة)</th>
                          </>
                        )}
                        <th className="border border-gray-300 p-2 text-center">سعر الوحدة</th>
                        <th className="border border-gray-300 p-2 text-center">إجمالي السطر</th>
                        <th className="border border-gray-300 p-2 text-center">المواصفات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((poItem, itemIndex) => {
                        const lineItem = tempLineItems.find(li => li.lineNumber === poItem.lineNumber) || {
                          itemId: poItem.id,
                          lineNumber: poItem.lineNumber,
                          name: poItem.name,
                          unit: poItem.unit,
                          requestedQty: poItem.quantity,
                          offeredQty: 0,
                          unitPrice: 0,
                          lineTotal: 0,
                          awarded: false,
                          specifications: {},
                          commitments: []
                        };

                        return (
                          <tr key={`line-${poItem.lineNumber}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center">{poItem.lineNumber}</td>
                            <td className="border border-gray-300 p-2">{poItem.name}</td>
                            <td className="border border-gray-300 p-2 text-center">{poItem.unit}</td>
                            <td className="border border-gray-300 p-2 text-center">{poItem.quantity}</td>
                            <td className="border border-gray-300 p-2">
                              <input
                                type="number"
                                value={lineItem.offeredQty}
                                onChange={(e) => {
                                  const newQty = parseFloat(e.target.value) || 0;
                                  const existingIndex = tempLineItems.findIndex(li => li.lineNumber === poItem.lineNumber);

                                  if (existingIndex >= 0) {
                                    // التحقق من الكمية المقدمة
                                    if (newQty > poItem.quantity) {
                                      if (!validateQuantities('offered', poItem.lineNumber, newQty, undefined, () => {
                                        handleUpdateLineItem(existingIndex, { offeredQty: newQty });
                                      })) {
                                        return;
                                      }
                                    }
                                    handleUpdateLineItem(existingIndex, { offeredQty: newQty });
                                  } else {
                                    if (newQty > poItem.quantity) {
                                      if (!validateQuantities('offered', poItem.lineNumber, newQty, undefined, () => {
                                        setTempLineItems([...tempLineItems, { ...lineItem, offeredQty: newQty }]);
                                      })) {
                                        return;
                                      }
                                    }
                                    setTempLineItems([...tempLineItems, { ...lineItem, offeredQty: newQty }]);
                                  }
                                }}
                                className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            {tempOfferData.taxIncluded === false && (
                              <>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="number"
                                    value={lineItem.unitPrice || 0}
                                    onChange={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      const existingIndex = tempLineItems.findIndex(li => li.lineNumber === poItem.lineNumber);

                                      if (existingIndex >= 0) {
                                        handleUpdateLineItem(existingIndex, { unitPrice: newPrice });
                                      } else {
                                        setTempLineItems([...tempLineItems, { ...lineItem, unitPrice: newPrice }]);
                                      }
                                    }}
                                    className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  {lineItem.unitPriceAfterTax ? formatNumberWithCommas(lineItem.unitPriceAfterTax) : '-'}
                                </td>
                              </>
                            )}
                            <td className="border border-gray-300 p-2">
                              <input
                                type="number"
                                value={lineItem.unitPrice || 0}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  const existingIndex = tempLineItems.findIndex(li => li.lineNumber === poItem.lineNumber);

                                  if (existingIndex >= 0) {
                                    handleUpdateLineItem(existingIndex, { unitPrice: newPrice });
                                  } else {
                                    setTempLineItems([...tempLineItems, { ...lineItem, unitPrice: newPrice }]);
                                  }
                                }}
                                className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className="font-medium">
                                {formatNumberWithCommas(lineItem.lineTotal)}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <button
                                onClick={() => handleOpenSpecifications(showLineItemsModal, poItem.lineNumber)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                مواصفات
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleOpenCommitments(showLineItemsModal)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  التزامات المورد
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLineItemsModal(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => {
                      // التحقق من تطابق المبالغ قبل الحفظ
                      const offer = priceOffers.find(o => o.id === showLineItemsModal);
                      const lineItemsTotal = calculateLineItemsTotal(tempLineItems);
                      const offerTotal = offer?.total || offer?.amount || 0;
                      const difference = Math.abs(lineItemsTotal - offerTotal);

                      if (difference >= 1) {
                        setAmountMismatchData({
                          offerId: showLineItemsModal,
                          offerTotal,
                          lineItemsTotal,
                          difference
                        });
                        setShowAmountMismatchDialog(true);
                        return;
                      }

                      // حفظ تفاصيل الأصناف في العرض
                      const offerIndex = priceOffers.findIndex(o => o.id === showLineItemsModal);
                      if (offerIndex !== -1) {
                        handleUpdateOffer(offerIndex, { lineItems: tempLineItems });
                      }

                      setShowLineItemsModal(null);
                      savePurchaseOrder();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    حفظ التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الترسية (الكميات المرسى عليها) */}
      {showAwardedItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="ml-2" size={20} />
                  تفاصيل الترسية - {priceOffers.find(o => o.id === showAwardedItemsModal)?.vendor}
                </h3>
                <button
                  onClick={() => setShowAwardedItemsModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* جدول الكميات المرسى عليها */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">الكميات المرسى عليها</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-gray-300 p-2 text-center">السطر</th>
                        <th className="border border-gray-300 p-2 text-center">بيان الصنف</th>
                        <th className="border border-gray-300 p-2 text-center">الكمية المطلوبة</th>
                        <th className="border border-gray-300 p-2 text-center">الكمية المقدمة</th>
                        <th className="border border-gray-300 p-2 text-center">الكمية المرسى عليها</th>
                        <th className="border border-gray-300 p-2 text-center">مرسى؟</th>
                        <th className="border border-gray-300 p-2 text-center">التزامات السطر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempAwardedItems.map((item, index) => (
                        <tr key={`awarded-${item.lineNumber}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-center">{item.lineNumber}</td>
                          <td className="border border-gray-300 p-2">{item.name}</td>
                          <td className="border border-gray-300 p-2 text-center">{item.requestedQty}</td>
                          <td className="border border-gray-300 p-2 text-center">{item.offeredQty}</td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={item.awardedQty || 0}
                              onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                const updatedItems = tempAwardedItems.map((aItem, i) =>
                                  i === index ? { ...aItem, awardedQty: newQty, awarded: newQty > 0 } : aItem
                                );
                                setTempAwardedItems(updatedItems);
                              }}
                              className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.awarded || (item.awardedQty || 0) > 0}
                              onChange={(e) => {
                                const updatedItems = tempAwardedItems.map((aItem, i) =>
                                  i === index ? { ...aItem, awarded: e.target.checked } : aItem
                                );
                                setTempAwardedItems(updatedItems);
                              }}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <button
                              onClick={() => handleOpenCommitments(showAwardedItemsModal!, item.lineNumber)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              التزامات
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* حقل الإجمالي للكميات المرسى عليها */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600">إجمالي الكميات المرسى عليها (بعد الضريبة)</div>
                  <div className="text-lg font-semibold text-green-800">
                    {formatNumberWithCommas(calculateAwardedTotal(tempAwardedItems))} {tempOfferData.currency}
                  </div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleOpenCommitments(showAwardedItemsModal!)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  التزامات المورد ككل
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAwardedItemsModal(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={handleSaveAwardedItems}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    حفظ تفاصيل الترسية
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة المواصفات المحسنة */}
      {showSpecificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">مواصفات الصنف</h3>
                <button
                  onClick={() => setShowSpecificationsModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* عرض المواصفات المطلوبة كمرجع */}
              {(() => {
                const poItem = poItems.find(item => item.lineNumber === showSpecificationsModal.lineNumber);
                return poItem?.specifications && Object.keys(poItem.specifications).length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">المواصفات المطلوبة:</h4>
                    {Object.entries(poItem.specifications).map(([key, value]) => (
                      <div key={key} className="text-sm text-blue-700">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* إدخال المواصفات المقدمة من المورد */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">المواصفات المقدمة من المورد:</h4>
                {Object.entries(tempSpecifications).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <label className="w-24 text-sm font-medium">{key}:</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setTempSpecifications(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder={`أدخل ${key} المقدم`}
                    />
                  </div>
                ))}

                {/* إضافة مواصفة جديدة */}
                <button
                  onClick={() => {
                    const newKey = prompt('اسم المواصفة الجديدة:');
                    if (newKey) {
                      setTempSpecifications(prev => ({
                        ...prev,
                        [newKey]: ''
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  إضافة مواصفة جديدة
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowSpecificationsModal(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveSpecifications}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الالتزامات المحسنة */}
      {showCommitmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {showCommitmentsModal.lineNumber !== undefined
                    ? `التزامات السطر ${showCommitmentsModal.lineNumber}`
                    : 'التزامات المورد ككل'
                  }
                </h3>
                <button
                  onClick={() => setShowCommitmentsModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {tempCommitments.map((commitment, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={commitment}
                      onChange={(e) => handleUpdateCommitment(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="أدخل الالتزام"
                    />
                    <button
                      onClick={() => handleRemoveCommitment(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddCommitment}
                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 mb-4"
              >
                إضافة التزام جديد
              </button>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCommitmentsModal(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveCommitments}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عدم تطابق المبالغ مع خيارات الحل */}
      {showAmountMismatchDialog && amountMismatchData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">عدم تطابق في المبالغ</h3>
              </div>

              <div className="mb-6 space-y-3">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">إجمالي مبلغ العرض:</span>
                      <div className="text-lg font-semibold text-red-700">
                        {formatNumberWithCommas(amountMismatchData.offerTotal)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">إجمالي أسعار الأصناف:</span>
                      <div className="text-lg font-semibold text-blue-700">
                        {formatNumberWithCommas(amountMismatchData.lineItemsTotal)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <span className="font-medium">الفارق:</span>
                    <div className="text-lg font-semibold text-red-800">
                      {formatNumberWithCommas(amountMismatchData.difference)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 font-medium">اختر إحدى الخيارات التالية:</p>

                <button
                  onClick={() => handleAmountMismatch('updateOffer')}
                  className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-right"
                >
                  <div className="font-medium text-blue-800">أ- تعديل إجمالي مبلغ العرض</div>
                  <div className="text-sm text-blue-600 mt-1">
                    سيتم تحديث إجمالي مبلغ العرض ليطابق إجمالي أسعار الأصناف
                  </div>
                </button>

                <button
                  onClick={() => handleAmountMismatch('saveWithNote')}
                  className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-right"
                >
                  <div className="font-medium text-yellow-800">ب- الحفظ والتصحيح مع ملاحظة الخطأ</div>
                  <div className="text-sm text-yellow-600 mt-1">
                    سيتم الحفظ والتصحيح مع إضافة ملاحظة تشير إلى وجود اختلاف في المبالغ
                  </div>
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAmountMismatchDialog(false);
                    setAmountMismatchData(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الرسائل التحذيرية للكميات */}
      {showQuantityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">تحذير</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">{showQuantityWarning.message}</p>
                <p className="text-gray-600">هل تريد المتابعة رغم التحذير؟</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowQuantityWarning(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    // تنفيذ دالة التأكيد ثم إغلاق النافذة
                    showQuantityWarning.onConfirm();
                    setShowQuantityWarning(null);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  تأكيد الحفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// -في صفحة جدول عروض الأسعار
// 1-
// يجب ان يكون ادخال جقول( مقدم العرض- رقم العرض -العملة-سعر الصرف للعملات الاجنبية -واجمالي مبلغ العرض) الزامي ولا يسمح بالانتقال الى العرض التالي الا بعد ادخال قيم هذه الحقول
// 2-
// عند ادخال العروض يجب تحسين الانتقال سوء بالضغط على انتر او تاب حيث يجب أن يتم الانتقال الى الحقل التالي في نفس عمود العرض وليس الى عمود العرض التالي

// 3-(مكرر مع صفحة المقارنة)
// يجب ان تظهر المواصفات في صفحة المقارنة في جدول "مقارنة المواصفات" وفي "مقارنة المواصفات"
// مباشرة بمجرد ادخالها في جدول عروض الأسعار

// (بنفس الطريقة التي يتم اظهار عملة العروض)
// 4-
// كما يجب ان تظل المواصفات محفوظة وظاهرة في جدول عروض الأسعار عند الضغط على زر المواصفات
// 5-
// عندما تكون العملة أجنبية يجب ان يظهر حقل سعر الصرف فارغاً والزامي لادخال قيمته
// 6-
// عندي اختيار عملة عرض اجنبية سبق وان تم اختيارها في عرض سابق يجب ان ينقل سعر الصرف تلقائياً من العرض السابق لنفس العملة لضمان عدم اختلاف أسعار الصرف للعملة الواحدة

// 7-
// يجب تعديل الاكواد الخاصة بوجود اختلاف بين اجمالي مبلغ العرض واجمالي اسعار الاصناف لتصبح على النحو التالي
// اذا كان هناك  اختلاف بين اجمالي مبلغ العرض واجمالي اسعار الاصناف وظهرت الرسالة
// '\n⚠️ ملاحظة: يوجد اختلاف بين إجمالي مبلغ العرض وإجمالي أسعار الأصناف'
// فإذا تم اختيار
// أ- تعديل إجمالي مبلغ العرض
//  فيجب ان يتم تعديل حقل"إجمالي مبلغ العرض
// (بعد الضرائب)"
// بناء على اجمالي أسعار الأصناف المدخله
// واذا تم اختيار
// ب- الحفظ والتصحيح مع ملاحظة الخطأ
//  فيجب ان يتم تعديل حقل"إجمالي مبلغ العرض
// (بعد الضرائب)"
// وتضاف ملاحظة في صفحة المقارنة في "ملاحظات الاختلافات في المواصفات
// هناك خطاء في إجمالي مبلغ العرض
// وكذلك تظهر هذه الملاحظة في جدول العرض المستبعدة في عمود أسباب تفصيلية تلقائية

// 8-
// يجب ان يسمح بالطباعة النهائية حتى اذا لم يتم إضافة أسعار الأصتاف بحيث يتم المطابقة كاجماليات

// 9-
// يجب تفديم أي مقترحات لتحسين ادخال العروض وتسهيل العمل

// 10-
// يرجى المحافظة على التعليقات واضافة اي تليقات توضيحية بالعربية على اهم السطور والدوال

// 11- يرجى اصلاح الخطاء التالي
// Argument of type '(prev: any) => any' is not assignable to parameter of type 'Recommendation'.

// ----------------------------------------

// ما تم عمله

// ثانيًا: تعديلات صفحة عروض الأسعار
// جعل حقول معينة إلزامية:
// سنضيف تحققًا من الحقول الإلزامية قبل الانتقال إلى العرض التالي.
// تحسين الانتقال بين الحقول:
// سنضيف معالجًا لحدثي onKeyDown وonBlur للتحكم في الانتقال بين الحقول.
// إظهار المواصفات مباشرة في صفحة المقارنة:
// سنضمن أن المواصفات تظهر فور إدخالها.
// جعل حقل سعر الصرف فارغًا وإلزاميًا للعملات الأجنبية:
// سنعدل طريقة عرض حقل سعر الصرف.
// نقل سعر الصرف تلقائيًا:
// سنضيف دالة لنقل سعر الصرف من العروض السابقة.
// تعديل التعامل مع اختلاف المبالغ:
// سنعدل دالة handleAmountMismatch لتنفيذ الخيارات المطلوبة.
// السماح بالطباعة النهائية حتى بدون أسعار أصناف:
// سنعدل شروط الطباعة.
// إضافة مقترحات لتحسين إدخال العروض:
// سنضيف بعض التحسينات لواجهة المستخدم.
// إضافة تعليقات توضيحية:
// سنضيف تعليقات بالعربية للدوال المهمة.
// إصلاح الخطأ "Argument of type '(prev: any) => any' is not assignable to parameter of type 'Recommendation'":
// سنعدل نوع البيانات في دالة setRecommendation.



