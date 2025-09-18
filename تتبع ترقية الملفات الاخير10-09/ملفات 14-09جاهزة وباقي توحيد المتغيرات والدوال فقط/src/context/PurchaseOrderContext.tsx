
// purchases_alamin5-copy5\src\context\PurchaseOrderContext.tsx

import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { ExcludedOffer, PriceOffer, PurchaseOrderItem, Recommendation, RecommendedOffer, PurchaseOrder } from '../types';
import { db } from '../utils/db';
import { convertNumberToArabicWords, formatNumberWithCommas } from '../utils/numberToWords';

// ========== دالة جديده0===============
// تعريف الواجهات (Interfaces) سطر جديد
interface PurchaseOrderContextType {
  // حقول البيانات الأساسية
  poNumber: string;
  setPoNumber: (poNumber: string) => void;
  transactionNumber: string;
  setTransactionNumber: (number: string) => void;
  // الجهة الطالبة سطر جديد
  requesting: string;
  setRequesting: (requesting: string) => void;
  beneficiary: string;
  setBeneficiary: (beneficiary: string) => void;
  // طريقة الشراء
  purchaseMethod: string;
  setPurchaseMethod: (purchaseMethod: string) => void;
  // بيانات الجداول
  poItems: PurchaseOrderItem[];                                        /* جدول الأصناف */
  setPoItems: (items: PurchaseOrderItem[]) => void;                    /* دالة تحديث جدول الأصناف */
  priceOffers: PriceOffer[];                                           /* جدول العروض */
  setPriceOffers: (offers: PriceOffer[]) => void;                     /* دالة تحديث جدول العروض */
  excludedOffers: ExcludedOffer[];                                    /* جدول العروض المستبعدة */
  setExcludedOffers: (offers: ExcludedOffer[]) => void;                   /* دالة تحديث جدول العروض المستبعدة */
  recommendation: Recommendation | null;                                 /* جدول التوصيات */
  setRecommendation: (recommendation: Recommendation | null) => void;     /* دالة تحديث جدول التوصيات */
  // إعدادات الطباعة والعرض
  isPreliminaryPrint: boolean;  // حالة الطباعة
  setIsPreliminaryPrint: (value: boolean) => void;
  offerCount: number; // إضافة عدد العروض إلى السياق
  setOfferCount: (count: number) => void;
  // حالة البيانات
  hasUnsavedChanges: boolean;  // حالة وجود تغييرات غير محفوظة
  isDataSaved: boolean;  // حالة وجود بيانات محفوظة
  // سطر جديد1 لاضافة PurchaseOrder  تعريف الخاصية في الواجهة،
  purchaseOrder: PurchaseOrder | null; // 🟢 يجب إضافة هذا السطر
  // دوال العمليات
  loadPurchaseOrder: (data: any) => Promise<boolean>;  // دالة لتحميل طلب الشراء
  savePurchaseOrder: () => Promise<boolean>;  // دالة لحفظ طلب الشراء
  clearAllFields: () => void;
  handlePoNumberChange: (newPoNumber: string) => void;
  // دوال جديدة لإدارة العروض
  updatePriceOffer: (vendor: string, updates: Partial<PriceOffer>) => void;
  // بيانات التكاليف التقديرية
  estimatedCosts: {[key: number]: number};
  setEstimatedCosts: (costs: {[key: number]: number}) => void;
  // بيانات المواصفات
  itemSpecifications: {[key: number]: string};
  setItemSpecifications: (specs: {[key: number]: string}) => void;
  // الدوال الجديدة التي تم إضافتها
  deletePurchaseOrderData: (poNum: string) => Promise<boolean>;
  checkDuplicatePurchaseOrder: (
    poNum: string,
    transNum: string
  ) => Promise<{ isDuplicate: boolean; message: string; dataExists: boolean }>;
  // دوال جديدة لحساب الإجماليات
  calculateMaxOfferAmountInYR: () => number; // لحساب أكبر قيمة معادلة بالريال للعروض (للطباعة الأولية)
  calculateTotalAwardedInYR: () => number; // لحساب إجمالي العروض المرسى عليها (للطباعة النهائية)
  getSalutationForPrint: () => string; // لتحديد المخاطب في الصفحة الرئيسية
  getSignatoryForPrint: () => string; // لتحديد المعتمد في النص الثابت
  shouldShowPreliminarySignature: () => boolean; // لتحديد إظهار مدير عام الإدارة في الطباعة الأولية
  shouldShowFinalSignature: () => boolean; // لتحديد إظهار مدير عام المشتريات في الطباعة النهائية
  // دوال جديدة لإدارة الرسائل
  generateVendorMessages: () => {
    awarded: { vendor: string; message: string }[];
    excluded: { vendor: string; message: string }[];
    financial: string;
  };
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

export const PurchaseOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // حالات البيانات الأساسية
  const [poNumber, setPoNumberState] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  // الجهة الطالبة سطر جديد
  const [requesting, setRequesting] = useState<string>('');
  const [beneficiary, setBeneficiary] = useState<string>('');
  // طريقة الشراء
  const [purchaseMethod, setPurchaseMethod] = useState<string>('');
  // بيانات التكاليف التقديرية
  const [estimatedCosts, setEstimatedCosts] = useState<{[key: number]: number}>({});
  
  // بيانات المواصفات
  const [itemSpecifications, setItemSpecifications] = useState<{[key: number]: string}>({});
  // حالة طريقة الشراء
  // const [purchaseMethod, setPurchaseMethod] = useState<string>('');
  // حالات الجداول
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);  /* جدول الأصناف */
  // 🟢 إضافة حالة purchaseOrder سطر جديد2 
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null); // 🟢 يجب إضافة هذا السطر
  const [priceOffers, setPriceOffers] = useState<PriceOffer[]>([]);  /* جدول العروض */
  const [excludedOffers, setExcludedOffers] = useState<ExcludedOffer[]>([]);   /* جدول العروض المستبعدة */
  const [recommendation, setRecommendation] = useState<Recommendation | null>({ selectedOffers: [] });     /* جدول التوصيات */
  // حالات الإعدادات
  const [isPreliminaryPrint, setIsPreliminaryPrint] = useState(false);
  const [offerCount, setOfferCount] = useState(3);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  
  // 🟢 1. تعريف clearAllFields أولاً لأنه يتم استخدامه في دوال أخرى
  const clearAllFields = useCallback(() => {
    setTransactionNumber(''); // مسح رقم المعاملة
    setRequesting('');  // مسح الجهة الطالبة
    setBeneficiary(''); // مسح الجهة المستفيدة
    setPurchaseMethod(''); // مسح طريقة الشراء
    setPoItems([]); // مسح الأصناف المطلوبة
    // ✅ لا نمسح العروض هنا، سيتم إنشاؤها في PriceOffersSection
    setPriceOffers([]); // تم تعليق هذا السطر ليفتح ع 3 عروض
    setExcludedOffers([]); // مسح العروض المستبعدة
    setRecommendation(null); // مسح التوصيات
    setIsPreliminaryPrint(false); // إعادة تعيين حالة الطباعة الأولية
    setOfferCount(3); // إعادة تعيين عدد العروض الافتراضي
    setHasUnsavedChanges(false); // تعيين حالة التغييرات غير المحفوظة
    setIsDataSaved(false); // تعيين حالة البيانات المحفوظة
  }, []);
  
  // 🟢 2. تعريف loadPurchaseOrder بعد clearAllFields لأنه يعتمد على db وقبل handlePoNumberChange
  const loadPurchaseOrder = useCallback(
    async (data: any): Promise<boolean> => {
      try {
        setPoNumberState(data.po_number || data['الرقم'] || '');
        setRequesting(data.requesting || data['الجهة الطالبة'] || '');  
        setBeneficiary(data.beneficiary || data['الجهة المستفيدة'] || '');
        setPurchaseMethod(data.purchaseMethod || data['طريقة الشراء'] || '');
        setTransactionNumber(data.transaction_number || data['رقم المعاملة'] || '');
        const items = data.items || data['الأصناف'] || [];
        setPoItems(
          items.map((item: any, index: number) => ({
            id: `item-${index}`,
            name: item.name || item['البيان'],
            quantity: item.quantity || item['الكمية'],
            unit: item.unit || item['الوحدة'],
            lineNumber: item.lineNumber || item['السطر'] || item['رقم السطر'] || index + 1,
            selected: true,
            // 🟢 تحميل التكلفة التقديرية والمواصفات إن وُجدت
            estimatedCost: item.estimatedCost || item['التكلفة التقديرية'] || undefined,
            specifications: item.specifications || item['المواصفات'] || undefined, 
          }))
        );
        if (Array.isArray(data.price_offers)) {
          setPriceOffers(data.price_offers);
          setOfferCount(data.offer_count || data.price_offers.length || 3);
        } else {
          // في حالة عدم وجود عروض في البيانات المستوردة، نعيد التعيين الافتراضي
          setPriceOffers([]);
          setOfferCount(3);
        }
        if (Array.isArray(data.excluded_offers)) {
          setExcludedOffers(data.excluded_offers);
        } else {
          setExcludedOffers([]);
        }
        if (data.recommendation) {
          setRecommendation(data.recommendation);
        } else {
          setRecommendation({ selectedOffers: [] }); // لضمان عدم بقاء القيمة null
        }
        setHasUnsavedChanges(true);
        setIsDataSaved(false);
        return true;
      } catch (error) {
        console.error('خطأ في تحميل طلب الشراء:', error);
        return false;
      }
    },
    [] // لا يوجد متغيرات خارجية هنا يجب أن تعتمد عليها هذه الدالة إلا db والتي ليست جزءاً من حالة React
  );
  
  // 🟢 3. تعريف setPoNumberState (داخلي)
  const setPoNumber = useCallback(
    (newPoNumber: string) => {
      setPoNumberState(newPoNumber);
    },
    []
  );
  
  // 🟢 4. تعريف handlePoNumberChange الآن يمكنها استخدام loadPurchaseOrder و clearAllFields بأمان
  const handlePoNumberChange = useCallback(
    async (newPoNumber: string) => {
      setPoNumberState(newPoNumber); // تحديث رقم طلب الشراء
      if (newPoNumber) {
        const existingData = await db.getPurchaseOrder(newPoNumber);
        if (existingData) {
          await loadPurchaseOrder(existingData); // 🟢 الآن loadPurchaseOrder معرفة
        } else {
          clearAllFields(); // 🟢 والآن clearAllFields معرفة
        }
      } else {
        clearAllFields();
      }
    },
    [clearAllFields, loadPurchaseOrder] // إضافة loadPurchaseOrder إلى التبعيات
  );
  
  // 🟢 8. تعريف updatePriceOffer
  const updatePriceOffer = useCallback(
    (vendor: string, updates: Partial<PriceOffer>) => {
      setPriceOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.vendor === vendor ? { ...offer, ...updates } : offer
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );
  
  // =============جديد=============================
  // إضافة دالة آمنة لإرسال الرسائل
  // أضف هذه الدالة في بداية الملف أو في مكان مناسب
  const safeSendMessage = (message: any) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        // التحقق من أن المنفذ متصل قبل الإرسال
        if (chrome.runtime.id) {
          chrome.runtime.sendMessage(message);
          return true;
        }
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    }
    return false;
  };
  
  // ========================================
  
  // 🟢 5. تعريف دوال الحساب أولاً قبل استخدامها في دوال أخرى
  const calculateMaxOfferAmountInYR = useCallback((): number => {
    // لحساب أكبر قيمة معادلة بالريال للعروض (للطباعة الأولية)
    // نتحقق من كل عرض في جدول عروض الأسعار بغض النظر عن حالته
    const amounts = priceOffers.map(offer => offer.totalInYR || 0);
    return amounts.length > 0 ? Math.max(...amounts) : 0;
  }, [priceOffers]);
  
  const calculateTotalAwardedInYR = useCallback((): number => {
    // لحساب إجمالي العروض المرسى عليها (للطباعة النهائية)
    if (!recommendation || !recommendation.selectedOffers || recommendation.selectedOffers.length === 0) {
      return 0;
    }
    return recommendation.selectedOffers.reduce((sum, selectedOffer) => {
      const originalOffer = priceOffers.find(po => po.vendor === selectedOffer.vendor);
      if (originalOffer) {
        // إذا كان المبلغ معدل يدوياً، نحسب المعادل بناءً على المبلغ الجديد
        if (selectedOffer.isManualAmount && selectedOffer.manualAmount !== undefined) {
          const exchangeRate = originalOffer.exchangeRate || 1;
          return sum + (selectedOffer.manualAmount * exchangeRate);
        } else {
          // استخدام المعادل المحفوظ مسبقاً
          return sum + (originalOffer.totalInYR || 0);
        }
      }
      return sum;
    }, 0);
  }, [recommendation, priceOffers]);
  
  const getSalutationForPrint = useCallback((): string => {
    // لتحديد المخاطب في الصفحة الرئيسية بناءً على إجمالي العروض المرسى عليها
    const total = calculateTotalAwardedInYR();
    return total > 150000 ? 'الأخ/المدير العام التنفيذي' : 'الأخ/مدير عام المشتريات والمخازن';
  }, [calculateTotalAwardedInYR]);
  
  const getSignatoryForPrint = useCallback((): string => {
    // لتحديد المعتمد في النص الثابت بناءً على إجمالي العروض المرسى عليها
    const total = calculateTotalAwardedInYR();
    return total > 150000 ? 'المدير العام التنفيذي' : 'مدير عام المشتريات والمخازن';
  }, [calculateTotalAwardedInYR]);
  
  const shouldShowPreliminarySignature = useCallback((): boolean => {
    // لتحديد إظهار مدير عام الإدارة في الطباعة الأولية
    // نتحقق من أكبر قيمة معادلة بالريال للعروض
    const maxAmount = calculateMaxOfferAmountInYR();
    return maxAmount > 150000;
  }, [calculateMaxOfferAmountInYR]);
  
  const shouldShowFinalSignature = useCallback((): boolean => {
    // لتحديد إظهار مدير عام المشتريات في الطباعة النهائية
    // نتحقق من إجمالي العروض المرسى عليها
    const total = calculateTotalAwardedInYR();
    return total > 150000;
  }, [calculateTotalAwardedInYR]);
  
  // 🟢 6. تعريف savePurchaseOrder بعد تعريف جميع الدوال التي تستخدمها
  const savePurchaseOrder = useCallback(async (): Promise<boolean> => {
    try {
      // التحقق من وجود البيانات الأساسية المطلوبة
      if (!poNumber.trim()) {
        console.error('رقم طلب الشراء مطلوب للحفظ');
        return false;
      }
      
      // ✅ تسجيل مفصل لعملية الحفظ
      console.log('بدء عملية حفظ طلب الشراء:', poNumber);
      console.log('البيانات المراد حفظها:', {
        po_number: poNumber,
        transaction_number: transactionNumber,
        requesting,
        beneficiary,
        purchaseMethod,
        items_count: poItems.length,
        offers_count: priceOffers.length,
        excluded_count: excludedOffers.length
      });
      
      // ✅ التحقق من صحة البيانات قبل الحفظ
      const validOffers = priceOffers.filter(offer => 
        offer.vendor && offer.vendor.trim() !== '' && offer.amount > 0
      );
      
      console.log('عدد العروض الصالحة للحفظ:', validOffers.length);
      
      // احسب إجمالي المبلغ المرسى عليه بالريال اليمني
      const awardedTotalYER = calculateTotalAwardedInYR();
      const nowIso = new Date().toISOString();
      
      // تجهيز البيانات النهائية مع معالجة أفضل للأخطاء
      const data = {
        po_number: poNumber,
        transaction_number: transactionNumber,
        requesting,
        beneficiary,
        purchaseMethod,
        items: poItems,
        // احفظ أرقام العروض وأسعار الأصناف لكل مورد إن وجدت عبر تمرير الحقول كما هي
        price_offers: priceOffers.map(offer => {
          // إنشاء نسخة آمنة من العرض
          const safeOffer = {
            ...offer,
            // ✅ التأكد من حفظ القيم المهمة مع معالجة أفضل للأخطاء
            amount: isNaN(Number(offer.amount)) ? 0 : Number(offer.amount),
            total: isNaN(Number(offer.total)) ? 0 : Number(offer.total),
            totalInYR: isNaN(Number(offer.totalInYR)) ? 0 : Number(offer.totalInYR),
            exchangeRate: isNaN(Number(offer.exchangeRate)) ? 1 : Number(offer.exchangeRate),
            // التأكد من أن lineItems مصفوفة صالحة
            lineItems: Array.isArray(offer.lineItems) ? offer.lineItems : [],
            // التأكد من أن commitments مصفوفة صالحة
            commitments: Array.isArray(offer.commitments) ? offer.commitments : [],
          };
          
          // حذف الحقول غير الضرورية التي قد تسبب مشاكل
          delete (safeOffer as any).inputValue;
          
          return safeOffer;
        }),
        excluded_offers: excludedOffers,
        recommendation: recommendation ? { ...recommendation, totalAwardedInYR: awardedTotalYER } : null,
        offer_count: offerCount,
        date: nowIso,
        date_only: nowIso.slice(0, 10),
        time_only: nowIso.slice(11, 19),
        awarded_total_yer: awardedTotalYER,
        awarded_total_yer_words: convertNumberToArabicWords(awardedTotalYER, 'ريال'),
      };
      
      console.log('البيانات النهائية للحفظ:', data);
      
      // استخدام الدالة الآمنة للحفظ
      const saveMessage = {
        type: 'SAVE_PURCHASE_ORDER',
        data: data
      };
      
      // محاولة الحفظ باستخدام الطريقة الآمنة
      const messageSent = safeSendMessage(saveMessage);
      
      if (!messageSent) {
        console.warn('فشل في إرسال رسالة الحفظ، محاولة بديلة...');
        // محاولة بديلة: حفظ مباشر في localStorage إذا كان متاحًا
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`purchase_order_${poNumber}`, JSON.stringify(data));
            console.log('تم حفظ البيانات في localStorage كنسخة احتياطية');
          } catch (storageError) {
            console.error('فشل في حفظ البيانات في localStorage:', storageError);
          }
        }
      }
      
      // استدعاء دالة الحفظ الأصلية
      const success = await db.savePurchaseOrder(data);
      
      if (success) {
        console.log('تم حفظ البيانات بنجاح:', poNumber);
        setHasUnsavedChanges(false);
        setIsDataSaved(true);
      } else {
        console.error('فشل في حفظ البيانات');
      }
      
      return success;
    } catch (error) {
      console.error('خطأ في حفظ بيانات طلب الشراء:', error);
      
      // ✅ تسجيل تفاصيل الخطأ
      if (error instanceof Error) {
        console.error('تفاصيل الخطأ:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      // محاولة حفظ البيانات في sessionStorage كنسخة احتياطية
      try {
        if (typeof sessionStorage !== 'undefined') {
          const backupData = {
            poNumber,
            transactionNumber,
            requesting,
            beneficiary,
            purchaseMethod,
            poItems,
            priceOffers,
            excludedOffers,
            recommendation,
            offerCount,
            timestamp: new Date().toISOString()
          };
          sessionStorage.setItem('purchase_order_backup', JSON.stringify(backupData));
          console.log('تم حفظ نسخة احتياطية في sessionStorage');
        }
      } catch (backupError) {
        console.error('فشل في حفظ النسخة الاحتياطية:', backupError);
      }
      
      return false;
    }
  }, [poNumber, transactionNumber, requesting, beneficiary, purchaseMethod, poItems, priceOffers, excludedOffers, recommendation, offerCount, calculateTotalAwardedInYR, convertNumberToArabicWords, db.savePurchaseOrder]);
  
  // =================================================
  
  // 🟢 7. تعريف deletePurchaseOrderData
  const deletePurchaseOrderData = useCallback(async (poNum: string): Promise<boolean> => {
    try {
      const success = await db.deletePurchaseOrder(poNum);
      if (success) {
        clearAllFields(); // 🟢 الآن clearAllFields معرفة
        setPoNumberState('');
        console.log(`Purchase order ${poNum} deleted successfully.`);
      }
      return success;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return false;
    }
  }, [clearAllFields]); // إضافة clearAllFields إلى التبعيات
  
  // 🟢 8. تعريف checkDuplicatePurchaseOrder
  const checkDuplicatePurchaseOrder = useCallback(
    async (
      poNum: string,
      transNum: string
    ): Promise<{ isDuplicate: boolean; message: string; dataExists: boolean }> => {
      const existingPO = await db.getPurchaseOrder(poNum);
      if (existingPO) {
        if (existingPO.transaction_number === transNum) {
          return {
            isDuplicate: true,
            message: 'رقم طلب الشراء محفوظ مسبقاً بنفس رقم المعاملة، سيتم تحديث البيانات.',
            dataExists: true,
          };
        } else {
          return {
            isDuplicate: false,
            message:
              'رقم طلب الشراء هذا محفوظ مسبقاً برقم معاملة مختلف. هل تريد الحفظ كطلب شراء جديد (برقم معاملة جديد)؟',
            dataExists: true,
          };
        }
      }
      return { isDuplicate: false, message: '', dataExists: false };
    },
    []
  );
  
  /**
   * دالة توليد الرسائل للموردين والشؤون المالية
   */
  const generateVendorMessages = useCallback(() => {
    const today = new Date().toLocaleDateString('ar-SA');
    const totalAwarded = calculateTotalAwardedInYR();
    
    // رسائل الموردين المرسى عليهم
    const awardedMessages = (recommendation?.selectedOffers || []).map(selectedOffer => {
      const offer = priceOffers.find(o => o.vendor === selectedOffer.vendor);
      let message = `بسم الله الرحمن الرحيم\n\n`;
      message += `التاريخ: ${today}\n`;
      message += `إلى: ${selectedOffer.vendor}\n`;
      message += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
      message += `تحية طيبة وبعد،\n\n`;
      message += `نتشرف بإبلاغكم بأنه تم الترسية عليكم في طلب الشراء رقم ${poNumber} `;
      message += `الخاص بـ ${beneficiary} بمبلغ إجمالي قدره `;
      message += `${formatNumberWithCommas(selectedOffer.amount)} ${selectedOffer.currency}\n\n`;
      
      if (selectedOffer.awardedLineNumbers && selectedOffer.awardedLineNumbers.length > 0) {
        message += `الأسطر المرسى عليها: ${selectedOffer.awardedLineNumbers.join(', ')}\n\n`;
      }
      
      // إضافة الالتزامات إن وجدت
      if (offer?.commitments && offer.commitments.length > 0) {
        message += `مع الالتزام بالآتي:\n`;
        offer.commitments.forEach((commitment, index) => {
          message += `${index + 1}. ${commitment}\n`;
        });
        message += `\n`;
      }
      
      message += `يرجى التواصل مع إدارة المشتريات لاستكمال الإجراءات.\n\n`;
      message += `مع تحياتنا،\n`;
      message += `إدارة المشتريات والمخازن`;
      
      return { vendor: selectedOffer.vendor, message };
    });
    
    // رسائل الموردين المستبعدين
    const excludedMessages = priceOffers
      .filter(offer => offer.vendor && offer.result !== 'مطابق')
      .map(offer => {
        let message = `بسم الله الرحمن الرحيم\n\n`;
        message += `التاريخ: ${today}\n`;
        message += `إلى: ${offer.vendor}\n`;
        message += `الموضوع: إشعار عدم ترسية طلب الشراء رقم ${poNumber}\n\n`;
        message += `تحية طيبة وبعد،\n\n`;
        message += `نشكركم على مشاركتكم في طلب الشراء رقم ${poNumber} `;
        message += `الخاص بـ ${beneficiary}.\n\n`;
        message += `نأسف لإبلاغكم بأنه لم يتم الترسية عليكم في هذا الطلب `;
        message += `لأسباب فنية ومالية.\n\n`;
        message += `نتطلع للتعاون معكم في الفرص القادمة.\n\n`;
        message += `مع تحياتنا،\n`;
        message += `إدارة المشتريات والمخازن`;
        
        return { vendor: offer.vendor, message };
      });
    
    // رسالة الشؤون المالية
    let financialMessage = `بسم الله الرحمن الرحيم\n\n`;
    financialMessage += `التاريخ: ${today}\n`;
    financialMessage += `إلى: إدارة الشؤون المالية\n`;
    financialMessage += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
    financialMessage += `تحية طيبة وبعد،\n\n`;
    financialMessage += `نفيدكم بأنه تم الترسية في طلب الشراء رقم ${poNumber} `;
    financialMessage += `رقم المعاملة ${transactionNumber} الخاص بـ ${beneficiary}\n\n`;
    
    financialMessage += `تفاصيل الترسية:\n`;
    (recommendation?.selectedOffers || []).forEach((offer, index) => {
      financialMessage += `${index + 1}. ${offer.vendor}: `;
      financialMessage += `${formatNumberWithCommas(offer.amount)} ${offer.currency}`;
      if (offer.currency !== 'ريال') {
        const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
        const totalInYR = offer.isManualAmount && offer.manualAmount 
          ? offer.manualAmount * (originalOffer?.exchangeRate || 1)
          : offer.totalInYR;
        financialMessage += ` (${formatNumberWithCommas(totalInYR || 0)} ريال)`;
      }
      financialMessage += `\n`;
    });
    
    financialMessage += `\nالإجمالي: ${formatNumberWithCommas(totalAwarded)} ريال\n`;
    financialMessage += `الإجمالي كتابة: ${convertNumberToArabicWords(totalAwarded, 'ريال')}\n\n`;
    financialMessage += `يرجى اتخاذ الإجراءات المالية اللازمة.\n\n`;
    financialMessage += `مع تحياتنا،\n`;
    financialMessage += `إدارة المشتريات والمخازن`;
    
    return {
      awarded: awardedMessages,
      excluded: excludedMessages,
      financial: financialMessage
    };
  }, [recommendation, priceOffers, poNumber, transactionNumber, beneficiary, purchaseMethod, calculateTotalAwardedInYR]);
  
  return (
    <PurchaseOrderContext.Provider
      value={{
        // البيانات الأساسية
        poNumber,
        setPoNumber, // هذا هو setPoNumberState
        transactionNumber,
        setTransactionNumber,
        requesting,
        setRequesting,
        beneficiary,
        setBeneficiary,
        purchaseMethod, // طريقة الشراء
        setPurchaseMethod,
        // بيانات الجداول
        poItems,  //
        setPoItems, 
        priceOffers, // عروض الاسعار
        setPriceOffers, 
        excludedOffers,
        setExcludedOffers,
        recommendation, // التوصية
        setRecommendation,
        // الإعدادات
        isPreliminaryPrint,  // حالة الطباعة الأولية
        setIsPreliminaryPrint, 
        offerCount,  // عدد العروض
        setOfferCount,
        // حالة البيانات
        hasUnsavedChanges,  // حالة البيانات المحفوظة
        isDataSaved,  
        // 🟢 إضافة purchaseOrder إلى القيمة سطر جديد3
        purchaseOrder, // 🟢 يجب إضافة هذا السطر
        // العمليات
        loadPurchaseOrder,
        savePurchaseOrder,
        clearAllFields,
        handlePoNumberChange,
        updatePriceOffer,
        // إضافة الدوال الجديدة هنا إلى قيمة السياق
        deletePurchaseOrderData,
        checkDuplicatePurchaseOrder,
        estimatedCosts,
        setEstimatedCosts,
        itemSpecifications,
        setItemSpecifications,
        // دوال جديدة لحساب الإجماليات
        calculateMaxOfferAmountInYR,
        calculateTotalAwardedInYR,
        getSalutationForPrint,
        getSignatoryForPrint,
        shouldShowPreliminarySignature,
        shouldShowFinalSignature,
        // دوال جديدة لإدارة الرسائل
        generateVendorMessages,
      }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
};

/**
 * usePurchaseOrder
 * سياق إدارة طلبات الشراء:
 * - يتيح مشاركة الحالة بين المكونات
 * - يوفر وظائف لإدارة دورة حياة طلب الشراء
 * - يتعامل مع عمليات CRUD مع قاعدة البيانات
 * - يدعم عمليات الطباعة والتخزين
 */
export const usePurchaseOrder = (): PurchaseOrderContextType => {
  const context = useContext(PurchaseOrderContext);
  if (context === undefined) {
    throw new Error('usePurchaseOrder must be used within a PurchaseOrderProvider');
  }
  return context;
};





// ==================================================================
// import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
// import { ExcludedOffer, PriceOffer, PurchaseOrderItem, Recommendation, RecommendedOffer, PurchaseOrder } from '../types';
// import { db } from '../utils/db';
// import { convertNumberToArabicWords } from '../utils/numberToWords';

// // ========== دالة جديده0===============
// // تعريف الواجهات (Interfaces) سطر جديد
// interface PurchaseOrderContextType {
//   // حقول البيانات الأساسية
//   poNumber: string;
//   setPoNumber: (poNumber: string) => void;
//   transactionNumber: string;
//   setTransactionNumber: (number: string) => void;
//   // الجهة الطالبة سطر جديد
//   requesting: string;
//   setRequesting: (requesting: string) => void;

//   beneficiary: string;
//   setBeneficiary: (beneficiary: string) => void;
//   // طريقة الشراء
//   purchaseMethod: string;
//   setPurchaseMethod: (purchaseMethod: string) => void;

//   // بيانات الجداول
//   poItems: PurchaseOrderItem[];                                        /* جدول الأصناف */
//   setPoItems: (items: PurchaseOrderItem[]) => void;                    /* دالة تحديث جدول الأصناف */
//   priceOffers: PriceOffer[];                                           /* جدول العروض */
//   setPriceOffers: (offers: PriceOffer[]) => void;                     /* دالة تحديث جدول العروض */
//   excludedOffers: ExcludedOffer[];                                    /* جدول العروض المستبعدة */
//   setExcludedOffers: (offers: ExcludedOffer[]) => void;                   /* دالة تحديث جدول العروض المستبعدة */
//   recommendation: Recommendation | null;                                 /* جدول التوصيات */
//   setRecommendation: (recommendation: Recommendation | null) => void;     /* دالة تحديث جدول التوصيات */

//   // إعدادات الطباعة والعرض
//   isPreliminaryPrint: boolean;  // حالة الطباعة
//   setIsPreliminaryPrint: (value: boolean) => void;
//   offerCount: number; // إضافة عدد العروض إلى السياق
//   setOfferCount: (count: number) => void;

//   // حالة البيانات
//   hasUnsavedChanges: boolean;  // حالة وجود تغييرات غير محفوظة
//   isDataSaved: boolean;  // حالة وجود بيانات محفوظة

//   // سطر جديد1 لاضافة PurchaseOrder  تعريف الخاصية في الواجهة،
//   purchaseOrder: PurchaseOrder | null; // 🟢 يجب إضافة هذا السطر

//   // دوال العمليات
//   loadPurchaseOrder: (data: any) => Promise<boolean>;  // دالة لتحميل طلب الشراء
//   savePurchaseOrder: () => Promise<boolean>;  // دالة لحفظ طلب الشراء
//   clearAllFields: () => void;
//   handlePoNumberChange: (newPoNumber: string) => void;

//   // دوال جديدة لإدارة العروض
//   updatePriceOffer: (vendor: string, updates: Partial<PriceOffer>) => void;

//   // بيانات التكاليف التقديرية
//   estimatedCosts: {[key: number]: number};
//   setEstimatedCosts: (costs: {[key: number]: number}) => void;

//   // بيانات المواصفات
//   itemSpecifications: {[key: number]: string};
//   setItemSpecifications: (specs: {[key: number]: string}) => void;

//   // الدوال الجديدة التي تم إضافتها
//   deletePurchaseOrderData: (poNum: string) => Promise<boolean>;
//   checkDuplicatePurchaseOrder: (
//     poNum: string,
//     transNum: string
//   ) => Promise<{ isDuplicate: boolean; message: string; dataExists: boolean }>;

//   // دوال جديدة لحساب الإجماليات
//   calculateMaxOfferAmountInYR: () => number; // لحساب أكبر قيمة معادلة بالريال للعروض (للطباعة الأولية)
//   calculateTotalAwardedInYR: () => number; // لحساب إجمالي العروض المرسى عليها (للطباعة النهائية)
//   getSalutationForPrint: () => string; // لتحديد المخاطب في الصفحة الرئيسية
//   getSignatoryForPrint: () => string; // لتحديد المعتمد في النص الثابت
//   shouldShowPreliminarySignature: () => boolean; // لتحديد إظهار مدير عام الإدارة في الطباعة الأولية
//   shouldShowFinalSignature: () => boolean; // لتحديد إظهار مدير عام المشتريات في الطباعة النهائية

//   // دوال جديدة لإدارة الرسائل
//   generateVendorMessages: () => {
//     awarded: { vendor: string; message: string }[];
//     excluded: { vendor: string; message: string }[];
//     financial: string;
//   };
// }

// const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

// export const PurchaseOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   // حالات البيانات الأساسية
//   const [poNumber, setPoNumberState] = useState<string>('');
//   const [transactionNumber, setTransactionNumber] = useState<string>('');

//   // الجهة الطالبة سطر جديد
//   const [requesting, setRequesting] = useState<string>('');
//   const [beneficiary, setBeneficiary] = useState<string>('');

//   // طريقة الشراء
//   const [purchaseMethod, setPurchaseMethod] = useState<string>('');

//   // بيانات التكاليف التقديرية
//   const [estimatedCosts, setEstimatedCosts] = useState<{[key: number]: number}>({});
  
//   // بيانات المواصفات
//   const [itemSpecifications, setItemSpecifications] = useState<{[key: number]: string}>({});

//   // حالة طريقة الشراء
//   // const [purchaseMethod, setPurchaseMethod] = useState<string>('');

//   // حالات الجداول
//   const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);  /* جدول الأصناف */
//   // 🟢 إضافة حالة purchaseOrder سطر جديد2 
//   const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null); // 🟢 يجب إضافة هذا السطر

//   const [priceOffers, setPriceOffers] = useState<PriceOffer[]>([]);  /* جدول العروض */
//   const [excludedOffers, setExcludedOffers] = useState<ExcludedOffer[]>([]);   /* جدول العروض المستبعدة */
//   const [recommendation, setRecommendation] = useState<Recommendation | null>({ selectedOffers: [] });     /* جدول التوصيات */

//   // حالات الإعدادات
//   const [isPreliminaryPrint, setIsPreliminaryPrint] = useState(false);
//   const [offerCount, setOfferCount] = useState(3);
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
//   const [isDataSaved, setIsDataSaved] = useState(false);

//   // 🟢 1. تعريف clearAllFields أولاً لأنه يتم استخدامه في دوال أخرى
//   const clearAllFields = useCallback(() => {
//     setTransactionNumber(''); // مسح رقم المعاملة
//     setRequesting('');  // مسح الجهة الطالبة
//     setBeneficiary(''); // مسح الجهة المستفيدة
//     setPurchaseMethod(''); // مسح طريقة الشراء
//     setPoItems([]); // مسح الأصناف المطلوبة
//     // ✅ لا نمسح العروض هنا، سيتم إنشاؤها في PriceOffersSection
//     setPriceOffers([]); // تم تعليق هذا السطر ليفتح ع 3 عروض
//     setExcludedOffers([]); // مسح العروض المستبعدة
//     setRecommendation(null); // مسح التوصيات
//     setIsPreliminaryPrint(false); // إعادة تعيين حالة الطباعة الأولية
//     setOfferCount(3); // إعادة تعيين عدد العروض الافتراضي
//     setHasUnsavedChanges(false); // تعيين حالة التغييرات غير المحفوظة
//     setIsDataSaved(false); // تعيين حالة البيانات المحفوظة
//   }, []);

//   // 🟢 2. تعريف loadPurchaseOrder بعد clearAllFields لأنه يعتمد على db وقبل handlePoNumberChange
//   const loadPurchaseOrder = useCallback(
//     async (data: any): Promise<boolean> => {
//       try {
//         setPoNumberState(data.po_number || data['الرقم'] || '');
//         setRequesting(data.requesting || data['الجهة الطالبة'] || '');  
//         setBeneficiary(data.beneficiary || data['الجهة المستفيدة'] || '');
//         setPurchaseMethod(data.purchaseMethod || data['طريقة الشراء'] || '');
//         setTransactionNumber(data.transaction_number || data['رقم المعاملة'] || '');

//         const items = data.items || data['الأصناف'] || [];
//         setPoItems(
//           items.map((item: any, index: number) => ({
//             id: `item-${index}`,
//             name: item.name || item['البيان'],
//             quantity: item.quantity || item['الكمية'],
//             unit: item.unit || item['الوحدة'],
//             lineNumber: item.lineNumber || item['السطر'] || item['رقم السطر'] || index + 1,
//             selected: true,
//             // 🟢 تحميل التكلفة التقديرية والمواصفات إن وُجدت
//             estimatedCost: item.estimatedCost || item['التكلفة التقديرية'] || undefined,
//             specifications: item.specifications || item['المواصفات'] || undefined, 
//           }))
//         );

//         if (Array.isArray(data.price_offers)) {
//           setPriceOffers(data.price_offers);
//           setOfferCount(data.offer_count || data.price_offers.length || 3);
//         } else {
//           // في حالة عدم وجود عروض في البيانات المستوردة، نعيد التعيين الافتراضي
//           setPriceOffers([]);
//           setOfferCount(3);
//         }
//         if (Array.isArray(data.excluded_offers)) {
//           setExcludedOffers(data.excluded_offers);
//         } else {
//           setExcludedOffers([]);
//         }
//         if (data.recommendation) {
//           setRecommendation(data.recommendation);
//         } else {
//           setRecommendation({ selectedOffers: [] }); // لضمان عدم بقاء القيمة null
//         }

//         setHasUnsavedChanges(true);
//         setIsDataSaved(false);
//         return true;
//       } catch (error) {
//         console.error('خطأ في تحميل طلب الشراء:', error);
//         return false;
//       }
//     },
//     [] // لا يوجد متغيرات خارجية هنا يجب أن تعتمد عليها هذه الدالة إلا db والتي ليست جزءاً من حالة React
//   );

//   // 🟢 3. تعريف setPoNumberState (داخلي)
//   const setPoNumber = useCallback(
//     (newPoNumber: string) => {
//       setPoNumberState(newPoNumber);
//     },
//     []
//   );

//   // 🟢 4. تعريف handlePoNumberChange الآن يمكنها استخدام loadPurchaseOrder و clearAllFields بأمان
//   const handlePoNumberChange = useCallback(
//     async (newPoNumber: string) => {
//       setPoNumberState(newPoNumber); // تحديث رقم طلب الشراء
//       if (newPoNumber) {
//         const existingData = await db.getPurchaseOrder(newPoNumber);
//         if (existingData) {
//           await loadPurchaseOrder(existingData); // 🟢 الآن loadPurchaseOrder معرفة
//         } else {
//           clearAllFields(); // 🟢 والآن clearAllFields معرفة
//         }
//       } else {
//         clearAllFields();
//       }
//     },
//     [clearAllFields, loadPurchaseOrder] // إضافة loadPurchaseOrder إلى التبعيات
//   );

//   // 🟢 8. تعريف updatePriceOffer
//   const updatePriceOffer = useCallback(
//     (vendor: string, updates: Partial<PriceOffer>) => {
//       setPriceOffers(prevOffers => 
//         prevOffers.map(offer => 
//           offer.vendor === vendor ? { ...offer, ...updates } : offer
//         )
//       );
//       setHasUnsavedChanges(true);
//     },
//     []
//   );

// // ========================================
//   // 🟢 5. تعريف savePurchaseOrder بعد تحديد جميع الحالات التي تستخدمها
// // تعديل دالة savePurchaseOrder
// const savePurchaseOrder = useCallback(async (): Promise<boolean> => {
//   try {
//     // التحقق من وجود البيانات الأساسية المطلوبة
//     if (!poNumber.trim()) {
//       console.error('رقم طلب الشراء مطلوب للحفظ');
//       return false;
//     }

//     // ✅ تسجيل مفصل لعملية الحفظ
//     console.log('بدء عملية حفظ طلب الشراء:', poNumber);
//     console.log('البيانات المراد حفظها:', {
//       po_number: poNumber,
//       transaction_number: transactionNumber,
//       requesting,
//       beneficiary,
//       purchaseMethod,
//       items_count: poItems.length,
//       offers_count: priceOffers.length,
//       excluded_count: excludedOffers.length
//     });

//     // ✅ التحقق من صحة البيانات قبل الحفظ
//     const validOffers = priceOffers.filter(offer => 
//       offer.vendor && offer.vendor.trim() !== '' && offer.amount > 0
//     );
    
//     console.log('عدد العروض الصالحة للحفظ:', validOffers.length);

//     // احسب إجمالي المبلغ المرسى عليه بالريال اليمني
//     const awardedTotalYER = calculateTotalAwardedInYR();
//     const nowIso = new Date().toISOString();
//     const data = {
//       po_number: poNumber,
//       transaction_number: transactionNumber,
//       requesting,
//       beneficiary,
//       purchaseMethod,
//       items: poItems,
//       // احفظ أرقام العروض وأسعار الأصناف لكل مورد إن وجدت عبر تمرير الحقول كما هي
//       price_offers: priceOffers.map(offer => ({
//         ...offer,
//         // ✅ التأكد من حفظ القيم المهمة مع معالجة أفضل للأخطاء
//         amount: isNaN(Number(offer.amount)) ? 0 : Number(offer.amount),
//         total: isNaN(Number(offer.total)) ? 0 : Number(offer.total),
//         totalInYR: isNaN(Number(offer.totalInYR)) ? 0 : Number(offer.totalInYR),
//         exchangeRate: isNaN(Number(offer.exchangeRate)) ? 1 : Number(offer.exchangeRate),
//       })),
//       excluded_offers: excludedOffers,
//       recommendation: recommendation ? { ...recommendation, totalAwardedInYR: awardedTotalYER } : null,
//       offer_count: offerCount,
//       date: nowIso,
//       date_only: nowIso.slice(0, 10),
//       time_only: nowIso.slice(11, 19),
//       awarded_total_yer: awardedTotalYER,
//       awarded_total_yer_words: convertNumberToArabicWords(awardedTotalYER, 'ريال'),
//     };

//     console.log('البيانات النهائية للحفظ:', data);
    
//     const success = await db.savePurchaseOrder(data);
    
//     if (success) {
//       console.log('تم حفظ البيانات بنجاح:', poNumber);
//       setHasUnsavedChanges(false);
//       setIsDataSaved(true);
//     } else {
//       console.error('فشل في حفظ البيانات');
//     }
    
//     return success;
//   } catch (error) {
//     console.error('خطأ في حفظ بيانات طلب الشراء:', error);
//     // ✅ تسجيل تفاصيل الخطأ
//     if (error instanceof Error) {
//       console.error('تفاصيل الخطأ:', error.message);
//       console.error('Stack trace:', error.stack);
//     }
//     return false;
//   }
// }, [poNumber, transactionNumber, requesting, beneficiary,purchaseMethod, poItems, priceOffers, excludedOffers, recommendation, offerCount]);

// // =================================================

//   // 🟢 6. تعريف deletePurchaseOrderData
//   const deletePurchaseOrderData = useCallback(async (poNum: string): Promise<boolean> => {
//     try {
//       const success = await db.deletePurchaseOrder(poNum);
//       if (success) {
//         clearAllFields(); // 🟢 الآن clearAllFields معرفة
//         setPoNumberState('');
//         console.log(`Purchase order ${poNum} deleted successfully.`);
//       }
//       return success;
//     } catch (error) {
//       console.error('Error deleting purchase order:', error);
//       return false;
//     }
//   }, [clearAllFields]); // إضافة clearAllFields إلى التبعيات

//   // 🟢 7. تعريف checkDuplicatePurchaseOrder
//   const checkDuplicatePurchaseOrder = useCallback(
//     async (
//       poNum: string,
//       transNum: string
//     ): Promise<{ isDuplicate: boolean; message: string; dataExists: boolean }> => {
//       const existingPO = await db.getPurchaseOrder(poNum);

//       if (existingPO) {
//         if (existingPO.transaction_number === transNum) {
//           return {
//             isDuplicate: true,
//             message: 'رقم طلب الشراء محفوظ مسبقاً بنفس رقم المعاملة، سيتم تحديث البيانات.',
//             dataExists: true,
//           };
//         } else {
//           return {
//             isDuplicate: false,
//             message:
//               'رقم طلب الشراء هذا محفوظ مسبقاً برقم معاملة مختلف. هل تريد الحفظ كطلب شراء جديد (برقم معاملة جديد)؟',
//             dataExists: true,
//           };
//         }
//       }
//       return { isDuplicate: false, message: '', dataExists: false };
//     },
//     []
//   );

//   // دوال جديدة لحساب الإجماليات
//   const calculateMaxOfferAmountInYR = useCallback((): number => {
//     // لحساب أكبر قيمة معادلة بالريال للعروض (للطباعة الأولية)
//     // نتحقق من كل عرض في جدول عروض الأسعار بغض النظر عن حالته
//     const amounts = priceOffers.map(offer => offer.totalInYR || 0);
//     return amounts.length > 0 ? Math.max(...amounts) : 0;
//   }, [priceOffers]);

//   const calculateTotalAwardedInYR = useCallback((): number => {
//     // لحساب إجمالي العروض المرسى عليها (للطباعة النهائية)
//     if (!recommendation || !recommendation.selectedOffers || recommendation.selectedOffers.length === 0) {
//       return 0;
//     }

//     return recommendation.selectedOffers.reduce((sum, selectedOffer) => {
//       const originalOffer = priceOffers.find(po => po.vendor === selectedOffer.vendor);
//       if (originalOffer) {
//         // إذا كان المبلغ معدل يدوياً، نحسب المعادل بناءً على المبلغ الجديد
//         if (selectedOffer.isManualAmount && selectedOffer.manualAmount !== undefined) {
//           const exchangeRate = originalOffer.exchangeRate || 1;
//           return sum + (selectedOffer.manualAmount * exchangeRate);
//         } else {
//           // استخدام المعادل المحفوظ مسبقاً
//           return sum + (originalOffer.totalInYR || 0);
//         }
//       }
//       return sum;
//     }, 0);
//   }, [recommendation, priceOffers]);

//   const getSalutationForPrint = useCallback((): string => {
//     // لتحديد المخاطب في الصفحة الرئيسية بناءً على إجمالي العروض المرسى عليها
//     const total = calculateTotalAwardedInYR();
//     return total > 150000 ? 'الأخ/المدير العام التنفيذي' : 'الأخ/مدير عام المشتريات والمخازن';
//   }, [calculateTotalAwardedInYR]);

//   const getSignatoryForPrint = useCallback((): string => {
//     // لتحديد المعتمد في النص الثابت بناءً على إجمالي العروض المرسى عليها
//     const total = calculateTotalAwardedInYR();
//     return total > 150000 ? 'المدير العام التنفيذي' : 'مدير عام المشتريات والمخازن';
//   }, [calculateTotalAwardedInYR]);

//   const shouldShowPreliminarySignature = useCallback((): boolean => {
//     // لتحديد إظهار مدير عام الإدارة في الطباعة الأولية
//     // نتحقق من أكبر قيمة معادلة بالريال للعروض
//     const maxAmount = calculateMaxOfferAmountInYR();
//     return maxAmount > 150000;
//   }, [calculateMaxOfferAmountInYR]);

//   const shouldShowFinalSignature = useCallback((): boolean => {
//     // لتحديد إظهار مدير عام المشتريات في الطباعة النهائية
//     // نتحقق من إجمالي العروض المرسى عليها
//     const total = calculateTotalAwardedInYR();
//     return total > 150000;
//   }, [calculateTotalAwardedInYR]);

//   /**
//    * دالة توليد الرسائل للموردين والشؤون المالية
//    */
//   const generateVendorMessages = useCallback(() => {
//     const today = new Date().toLocaleDateString('ar-SA');
//     const totalAwarded = calculateTotalAwardedInYR();
    
//     // رسائل الموردين المرسى عليهم
//     const awardedMessages = (recommendation?.selectedOffers || []).map(selectedOffer => {
//       const offer = priceOffers.find(o => o.vendor === selectedOffer.vendor);
//       let message = `بسم الله الرحمن الرحيم\n\n`;
//       message += `التاريخ: ${today}\n`;
//       message += `إلى: ${selectedOffer.vendor}\n`;
//       message += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
//       message += `تحية طيبة وبعد،\n\n`;
//       message += `نتشرف بإبلاغكم بأنه تم الترسية عليكم في طلب الشراء رقم ${poNumber} `;
//       message += `الخاص بـ ${beneficiary} بمبلغ إجمالي قدره `;
//       message += `${formatNumberWithCommas(selectedOffer.amount)} ${selectedOffer.currency}\n\n`;
      
//       if (selectedOffer.awardedLineNumbers && selectedOffer.awardedLineNumbers.length > 0) {
//         message += `الأسطر المرسى عليها: ${selectedOffer.awardedLineNumbers.join(', ')}\n\n`;
//       }
      
//       // إضافة الالتزامات إن وجدت
//       if (offer?.commitments && offer.commitments.length > 0) {
//         message += `مع الالتزام بالآتي:\n`;
//         offer.commitments.forEach((commitment, index) => {
//           message += `${index + 1}. ${commitment}\n`;
//         });
//         message += `\n`;
//       }
      
//       message += `يرجى التواصل مع إدارة المشتريات لاستكمال الإجراءات.\n\n`;
//       message += `مع تحياتنا،\n`;
//       message += `إدارة المشتريات والمخازن`;
      
//       return { vendor: selectedOffer.vendor, message };
//     });
    
//     // رسائل الموردين المستبعدين
//     const excludedMessages = priceOffers
//       .filter(offer => offer.vendor && offer.result !== 'مطابق')
//       .map(offer => {
//         let message = `بسم الله الرحمن الرحيم\n\n`;
//         message += `التاريخ: ${today}\n`;
//         message += `إلى: ${offer.vendor}\n`;
//         message += `الموضوع: إشعار عدم ترسية طلب الشراء رقم ${poNumber}\n\n`;
//         message += `تحية طيبة وبعد،\n\n`;
//         message += `نشكركم على مشاركتكم في طلب الشراء رقم ${poNumber} `;
//         message += `الخاص بـ ${beneficiary}.\n\n`;
//         message += `نأسف لإبلاغكم بأنه لم يتم الترسية عليكم في هذا الطلب `;
//         message += `لأسباب فنية ومالية.\n\n`;
//         message += `نتطلع للتعاون معكم في الفرص القادمة.\n\n`;
//         message += `مع تحياتنا،\n`;
//         message += `إدارة المشتريات والمخازن`;
        
//         return { vendor: offer.vendor, message };
//       });
    
//     // رسالة الشؤون المالية
//     let financialMessage = `بسم الله الرحمن الرحيم\n\n`;
//     financialMessage += `التاريخ: ${today}\n`;
//     financialMessage += `إلى: إدارة الشؤون المالية\n`;
//     financialMessage += `الموضوع: إشعار ترسية طلب الشراء رقم ${poNumber}\n\n`;
//     financialMessage += `تحية طيبة وبعد،\n\n`;
//     financialMessage += `نفيدكم بأنه تم الترسية في طلب الشراء رقم ${poNumber} `;
//     financialMessage += `رقم المعاملة ${transactionNumber} الخاص بـ ${beneficiary}\n\n`;
    
//     financialMessage += `تفاصيل الترسية:\n`;
//     (recommendation?.selectedOffers || []).forEach((offer, index) => {
//       financialMessage += `${index + 1}. ${offer.vendor}: `;
//       financialMessage += `${formatNumberWithCommas(offer.amount)} ${offer.currency}`;
//       if (offer.currency !== 'ريال') {
//         const originalOffer = priceOffers.find(po => po.vendor === offer.vendor);
//         const totalInYR = offer.isManualAmount && offer.manualAmount 
//           ? offer.manualAmount * (originalOffer?.exchangeRate || 1)
//           : offer.totalInYR;
//         financialMessage += ` (${formatNumberWithCommas(totalInYR || 0)} ريال)`;
//       }
//       financialMessage += `\n`;
//     });
    
//     financialMessage += `\nالإجمالي: ${formatNumberWithCommas(totalAwarded)} ريال\n`;
//     financialMessage += `الإجمالي كتابة: ${convertNumberToArabicWords(totalAwarded, 'ريال')}\n\n`;
//     financialMessage += `يرجى اتخاذ الإجراءات المالية اللازمة.\n\n`;
//     financialMessage += `مع تحياتنا،\n`;
//     financialMessage += `إدارة المشتريات والمخازن`;
    
//     return {
//       awarded: awardedMessages,
//       excluded: excludedMessages,
//       financial: financialMessage
//     };
//   }, [recommendation, priceOffers, poNumber, transactionNumber, beneficiary,purchaseMethod, calculateTotalAwardedInYR]);
//   return (
//     <PurchaseOrderContext.Provider
//       value={{
//         // البيانات الأساسية
//         poNumber,
//         setPoNumber, // هذا هو setPoNumberState
//         transactionNumber,
//         setTransactionNumber,
//         requesting,
//         setRequesting,
//         beneficiary,
//         setBeneficiary,
//         purchaseMethod, // طريقة الشراء
//         setPurchaseMethod,

//         // بيانات الجداول
//         poItems,  //
//         setPoItems, 
//         priceOffers, // عروض الاسعار
//         setPriceOffers, 
//         excludedOffers,
//         setExcludedOffers,
//         recommendation, // التوصية
//         setRecommendation,

//         // الإعدادات
//         isPreliminaryPrint,  // حالة الطباعة الأولية
//         setIsPreliminaryPrint, 
//         offerCount,  // عدد العروض
//         setOfferCount,

//         // حالة البيانات
//         hasUnsavedChanges,  // حالة البيانات المحفوظة
//         isDataSaved,  
//         // 🟢 إضافة purchaseOrder إلى القيمة سطر جديد3
//         purchaseOrder, // 🟢 يجب إضافة هذا السطر

//         // العمليات
//         loadPurchaseOrder,
//         savePurchaseOrder,
//         clearAllFields,
//         handlePoNumberChange,
//         updatePriceOffer,
//         // إضافة الدوال الجديدة هنا إلى قيمة السياق
//         deletePurchaseOrderData,
//         checkDuplicatePurchaseOrder,
//         estimatedCosts,
//         setEstimatedCosts,
//         itemSpecifications,
//         setItemSpecifications,

//         // دوال جديدة لحساب الإجماليات
//         calculateMaxOfferAmountInYR,
//         calculateTotalAwardedInYR,
//         getSalutationForPrint,
//         getSignatoryForPrint,
//         shouldShowPreliminarySignature,
//         shouldShowFinalSignature,

//         // دوال جديدة لإدارة الرسائل
//         generateVendorMessages,
//       }}
//     >
//       {children}
//     </PurchaseOrderContext.Provider>
//   );
// };

// /**
//  * usePurchaseOrder
//  * سياق إدارة طلبات الشراء:
//  * - يتيح مشاركة الحالة بين المكونات
//  * - يوفر وظائف لإدارة دورة حياة طلب الشراء
//  * - يتعامل مع عمليات CRUD مع قاعدة البيانات
//  * - يدعم عمليات الطباعة والتخزين
//  */
// export const usePurchaseOrder = (): PurchaseOrderContextType => {
//   const context = useContext(PurchaseOrderContext);
//   if (context === undefined) {
//     throw new Error('usePurchaseOrder must be used within a PurchaseOrderProvider');
//   }
//   return context;
// };




