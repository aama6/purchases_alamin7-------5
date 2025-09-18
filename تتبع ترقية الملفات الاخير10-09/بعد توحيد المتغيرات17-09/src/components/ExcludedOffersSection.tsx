

// purchases_alamin7-copy5\src\components\ExcludedOffersSection.tsx
// مكون جدول العروض المستبعدة مع أسباب تلقائية محسنة ومنع التكرار

import { Ban, FileMinus, AlertTriangle, DollarSign, Palette, Settings, Printer, CheckCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { ExcludedOffer } from '../types';
// توسيع واجهة ExcludedOffer لدعم الخصائص الجديدة
interface ExtendedExcludedOffer extends ExcludedOffer {
  priceReason?: string;
  colorReason?: string;
  specReasons?: string[];
}
export const ExcludedOffersSection: React.FC = () => {
  const { priceOffers, excludedOffers, setExcludedOffers, isPreliminaryPrint, poItems } = usePurchaseOrder();
  const [newReason, setNewReason] = useState('');
  const [newNotes, setNewNotes] = useState('');
  // حالات إضافية للتحكم في التعديل ومنع التكرار
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ExtendedExcludedOffer>>({});
  const [processedOffers, setProcessedOffers] = useState<Set<string>>(new Set());
  const [printReasons, setPrintReasons] = useState(true); // ✅ حالة جديدة للتحكم في طباعة الأسباب
  // مرجع للحاوية لضبط الارتفاعات قبل الطباعة النهائية
  const containerRef = useRef<HTMLDivElement | null>(null);
  /**
   * دالة لضبط ارتفاع جميع حقول النص وفق المحتوى (للطباعة النهائية فقط)
   */
  const adjustTextareasHeight = () => {
    if (!containerRef.current) return;
    const areas = containerRef.current.querySelectorAll<HTMLTextAreaElement>('textarea.excluded-textarea');
    areas.forEach((ta) => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  };
  // استمع لحدث beforeprint لضمان الضبط وقت الطباعة النهائية
  useEffect(() => {
    const before = () => {
      if (!isPreliminaryPrint) adjustTextareasHeight();
    };
    window.addEventListener('beforeprint', before);
    return () => window.removeEventListener('beforeprint', before);
  }, [isPreliminaryPrint, excludedOffers]);
  // عند أي تحديث للمحتوى في الوضع النهائي، اضبط الارتفاعات
  useEffect(() => {
    if (!isPreliminaryPrint) adjustTextareasHeight();
  }, [excludedOffers, isPreliminaryPrint]);
  /**
   * ✅ نقل أسباب عدم المطابقة تلقائياً إلى جدول العروض المستبعدة
   */
  useEffect(() => {
    const transferNonMatchingOffers = () => {
      if (!priceOffers || priceOffers.length === 0) return;
      const newExcludedOffers = [...excludedOffers];
      let hasChanges = false;
      priceOffers.forEach(offer => {
        // نقل العروض غير المطابقة والمطابقة جزئياً
        if (offer.vendor &&
          offer.result &&
          offer.result !== 'مطابق' &&
          !excludedOffers.some(excluded => excluded.vendor === offer.vendor)) {
          const autoReasons = generateAutoReasons(offer.vendor);
          const newOffer: ExtendedExcludedOffer = {
            id: `excluded-${Date.now()}-${offer.vendor}`,
            vendor: offer.vendor,
            reason: '', // يُترك فارغاً ويُدخل يدوياً فقط
            notes: '',
            priceReason: autoReasons.priceReason,
            colorReason: autoReasons.colorReason,
            specReasons: autoReasons.specReasons
          };
          newExcludedOffers.push(newOffer);
          setProcessedOffers(prev => new Set([...prev, offer.vendor]));
          hasChanges = true;
        }
      });
      if (hasChanges) {
        setExcludedOffers(newExcludedOffers);
      }
    };
    transferNonMatchingOffers();
  }, [priceOffers]);
  /**
   * دالة توليد أسباب الاستبعاد التلقائية المحسنة
   */
  const generateAutoReasons = (vendor: string) => {
    const priceOffer = priceOffers.find(offer => offer.vendor === vendor);
    if (!priceOffer) {
      return {
        priceReason: 'لا يوجد عرض سعر لهذا المورد',
        colorReason: '',
        specReasons: []
      };
    }
    const reasons: {
      priceReason: string;
      colorReason: string;
      specReasons: string[];
    } = {
      priceReason: '',
      colorReason: '',
      specReasons: []
    };
    
    // ✅ أسباب عدم المطابقة بناءً على نتيجة العرض
    if (priceOffer.result === 'غير مطابق') {
      reasons.priceReason = 'العرض غير مطابق للمواصفات المطلوبة';
    } else if (priceOffer.result === 'مطابق جزئي') {
      reasons.priceReason = 'العرض مطابق جزئياً للمواصفات';
    }
    
    // ✅ مقارنة الأسعار مع التكلفة التقديرية لكل صنف - تعديل حسب المتطلبات الجديدة
    if (priceOffer.lineItems && poItems) {
      poItems.forEach(poItem => {
        const lineItem = priceOffer.lineItems?.find(li => li.lineNumber === poItem.lineNumber);

        // التحقق من النقص في الكميات المقدمة
        if (lineItem && poItem.quantity) {
          const requiredQuantity = poItem.quantity;
          const offeredQuantity = lineItem.quantity || 0;

          if (offeredQuantity < requiredQuantity) {
            const shortage = requiredQuantity - offeredQuantity;
            reasons.specReasons.push(`الصنف ${poItem.lineNumber}: يوجد نقص في الكمية المقدمة (${shortage} وحدة من أصل ${requiredQuantity})`);
          } else if (offeredQuantity === 0) {
            reasons.specReasons.push(`الصنف ${poItem.lineNumber}: لم يتم تقديم كمية لهذا الصنف`);
          }
        }

        if (lineItem && poItem.estimatedCost) {
          const estimatedCost = poItem.estimatedCost.amount || 0;
          const offeredPrice = lineItem.unitPrice || 0;
          
          if (estimatedCost > 0 && offeredPrice > 0) {
            const difference = offeredPrice - estimatedCost;
            const percentage = (difference / estimatedCost * 100).toFixed(1);
            
            if (Math.abs(difference) > 0.01) { // تجاهل الفروقات الطفيفة
              if (difference > 0) {
                reasons.priceReason += `الصنف ${poItem.lineNumber}: سعر الوحدة المقدمة أعلى من التكلفة التقديرية بنسبة ${percentage}%\n`;
              } else {
                reasons.priceReason += `الصنف ${poItem.lineNumber}: سعر الوحدة المقدمة أقل من التكلفة التقديرية بنسبة ${Math.abs(Number(percentage))}%\n`;
              }
            }
          }
        }
      });
    }
    
    // ✅ مقارنة المواصفات المطلوبة مع المواصفات المقدمة - تعديل حسب المتطلبات الجديدة
    if (priceOffer.lineItems && poItems) {
      poItems.forEach(poItem => {
        const lineItem = priceOffer.lineItems?.find(li => li.lineNumber === poItem.lineNumber);
        
        if (poItem.specifications && lineItem?.vendorSpecifications) {
          const requiredSpecs = poItem.specifications;
          const offeredSpecs = lineItem.vendorSpecifications;
          
          // التحقق من تطابق المواصفات
          const requiredKeys = Object.keys(requiredSpecs);
          const offeredKeys = Object.keys(offeredSpecs);
          
          // التحقق من وجود جميع المواصفات المطلوبة
          const missingSpecs = requiredKeys.filter(key => !offeredKeys.includes(key));
          
          if (missingSpecs.length > 0) {
            reasons.specReasons.push(`الصنف ${poItem.lineNumber}: غير مطابق - يوجد اختلاف بين المواصفات حيث أن المطلوب (${missingSpecs.join(', ')}) والمقدم (غير مقدم)`);
          } else {
            // التحقق من تطابق قيم المواصفات
            let specsMatch = true;
            const mismatchedSpecs: string[] = [];
            
            requiredKeys.forEach(key => {
              const requiredValue = String(requiredSpecs[key]).trim();
              const offeredValue = String(offeredSpecs[key]).trim();
              
              if (requiredValue !== offeredValue) {
                specsMatch = false;
                mismatchedSpecs.push(`${key}: المطلوب (${requiredValue}) والمقدم (${offeredValue})`);
              }
            });
            
            if (!specsMatch) {
              reasons.specReasons.push(`الصنف ${poItem.lineNumber}: غير مطابق - يوجد اختلاف بين المواصفات حيث أن ${mismatchedSpecs.join(', ')}`);
            } else {
              reasons.specReasons.push(`الصنف ${poItem.lineNumber}: مطابق للمواصفات المطلوبة`);
            }
          }
        } else if (poItem.specifications && (!lineItem?.vendorSpecifications || Object.keys(lineItem.vendorSpecifications || {}).length === 0)) {
          reasons.specReasons.push(`الصنف ${poItem.lineNumber}: غير مطابق - لم يتم تقديم مواصفات`);
        }
      });
    }
    
    // ✅ أسباب سعرية إضافية
    if (priceOffer.total && priceOffer.total > 0) {
      const lowestOffer = Math.min(...priceOffers
        .filter(o => o.total && o.total > 0)
        .map(o => o.total as number));
      if (priceOffer.total > lowestOffer * 1.1) {
        const difference = ((priceOffer.total - lowestOffer) / lowestOffer * 100).toFixed(1);
        reasons.specReasons.push(`السعر الإجمالي أعلى بنسبة ${difference}% من أقل عرض`);
      }
    }
    
    return reasons;
  };
  /**
   * ✅ دالة تفريغ العروض للطباعة الأولية
   */
  const handleTransferForPrint = () => {
    let newExcludedOffers = [...excludedOffers];
    let hasChanges = false;
    
    // إضافة جميع العروض غير المطابقة
    priceOffers.forEach(offer => {
      if (offer.vendor &&
        offer.result &&
        offer.result !== 'مطابق' &&
        !newExcludedOffers.some(excluded => excluded.vendor === offer.vendor)) {
        const autoReasons = generateAutoReasons(offer.vendor);
        const newOffer: ExtendedExcludedOffer = {
          id: `excluded-${Date.now()}-${offer.vendor}`,
          vendor: offer.vendor,
          reason: '', // يُترك فارغاً ويُدخل يدوياً فقط
          notes: '',
          priceReason: autoReasons.priceReason,
          colorReason: autoReasons.colorReason,
          specReasons: autoReasons.specReasons
        };
        newExcludedOffers.push(newOffer);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setExcludedOffers(newExcludedOffers);
      alert('تم نقل العروض غير المطابقة إلى جدول المستبعدة استعداداً للطباعة');
    } else {
      alert('جميع العروض غير المطابقة موجودة بالفعل في جدول المستبعدة');
    }
  };
  /**
   * ✅ دالة طباعة مخصصة مع التحكم في إظهار الأسباب
   */
  // const handlePrint = () => {
  //   // حفظ حالة الطباعة الحالية
  //   const currentPrintState = printReasons;
  //   // إذا كانت طباعة أولية، تأكد من نقل جميع العروض أولاً
  //   if (isPreliminaryPrint) {
  //     handleTransferForPrint();
  //   }
  //   // الانتظار قليلاً ثم الطباعة
  //   setTimeout(() => {
  //     window.print();
  //     // استعادة حالة الطباعة بعد الانتهاء
  //     setTimeout(() => {
  //       setPrintReasons(currentPrintState);
  //     }, 1000);
  //   }, 500);
  // };

  // purchases_alamin7\src\components\ExcludedOffersSection.tsx
  // ... (بداية الكود كما هي)

  /**
   * دالة طباعة مخصصة مع التحكم في إظهار الأسباب
   * تم تعديل هذه الدالة لمعالجة مشكلة الطباعة
   */
  const handlePrint = () => {
    // حفظ حالة الطباعة الحالية
    const currentPrintState = printReasons;

    // إذا كانت طباعة أولية، تأكد من نقل جميع العروض أولاً
    if (isPreliminaryPrint) {
      handleTransferForPrint();
    }

    // الانتظار قليلاً ثم الطباعة
    setTimeout(() => {
      window.print();
      // استعادة حالة الطباعة بعد الانتهاء
      setTimeout(() => {
        setPrintReasons(currentPrintState);
      }, 1000);
    }, 500);
  };


  // handleUpdateExcludedOffer, startEdit, cancelEdit, saveEdit, handleAddExcludedOffer, handleRemoveExcludedOffer
  {/* دوال إدارة العروض المستبعدة (يجب إضافتها داخل المكون): */ }
  // دالة تحديث عرض مستبعد
  const handleUpdateExcludedOffer = (id: string, updates: Partial<ExcludedOffer>) => {
    setExcludedOffers(
      excludedOffers.map(offer =>
        offer.id === id ? { ...offer, ...updates } : offer
      )
    );
  };
  // دالة بدء تعديل عرض مستبعد
  const startEdit = (offer: ExcludedOffer) => {
    setEditingId(offer.id);
    setEditData({ ...offer });
  };
  // دالة إلغاء التعديل
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };
  // دالة حفظ التعديلات
  const saveEdit = () => {
    if (editingId && editData.vendor) {
      const updatedOffers = excludedOffers.map(offer =>
        offer.id === editingId ? { ...offer, ...editData } : offer
      );
      setExcludedOffers(updatedOffers);
      setEditingId(null);
      setEditData({});
    }
  };
  // دالة إضافة عرض مستبعد جديد يدوياً
  const handleAddExcludedOffer = (vendor: string) => {
    // منع إضافة مورد مكرر
    if (excludedOffers.some(excluded => excluded.vendor === vendor)) {
      alert('هذا المورد موجود بالفعل في قائمة العروض المستبعدة');
      return;
    }
    const autoReasons = generateAutoReasons(vendor);
    const newExcludedOffer: ExtendedExcludedOffer = {
      id: `excluded-${Date.now()}`,
      vendor,
      reason: newReason || 'لم يتم الارساء على هذا المورد',
      notes: newNotes,
      priceReason: autoReasons.priceReason,
      colorReason: autoReasons.colorReason,
      specReasons: autoReasons.specReasons
    };
    setExcludedOffers([...excludedOffers, newExcludedOffer]);
    setProcessedOffers(prev => new Set([...prev, vendor]));
    setNewReason('');
    setNewNotes('');
  };


  // دالة حذف عرض مستبعد
  const handleRemoveExcludedOffer = (id: string) => {
    const offerToRemove = excludedOffers.find(offer => offer.id === id);
    if (offerToRemove) {
      setProcessedOffers(prev => {
        const newSet = new Set(prev);
        newSet.delete(offerToRemove.vendor);
        return newSet;
      });
    }
    setExcludedOffers(excludedOffers.filter(offer => offer.id !== id));
  };

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200 print:mb-0 print-container">
      <div className="flex items-center justify-between mb-4 print:mb-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            <Ban className="ml-2 icon" size={20} />
            العروض المستبعدة
          </h2>
          {/* ✅ زر التحكم في طباعة الأسباب */}
          <label className="flex items-center gap-2 cursor-pointer print:hidden">
            <input
              type="checkbox"
              checked={printReasons}
              onChange={(e) => setPrintReasons(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">إظهار أسباب الاستبعاد التفصيلية</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ زر الطباعة المخصص */}
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center shadow-sm print:hidden"
            title="طباعة جدول العروض المستبعدة"
          >
            <Printer size={18} className="ml-1" />
            طباعة
          </button>
          <button
            onClick={handleTransferForPrint}
            className="py-2 px-4 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors flex items-center shadow-sm print:hidden"
          >
            <FileMinus size={18} className="ml-1" />
            تفريغ
          </button>
        </div>
      </div>
      {excludedOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Ban className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">لا توجد عروض مستبعدة</p>
          <p className="text-sm mt-1">اضغط على "تفريغ" لنقل العروض غير المطابقة تلقائياً</p>
        </div>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden print:w-[100%] print:border-gray-400">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white print:bg-blue-600">
                <th className="py-2 px-1 text-center font-semibold border border-gray-300" style={{ width: '13%' }}>
                  مقدم العرض
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-gray-300" style={{ width: '40%' }}>
                  سبب الاستبعاد العام
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-gray-300" style={{ width: '40%' }}>
                  أسباب تفصيلية تلقائية
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-gray-300 print:hidden" style={{ width: '7%' }}>
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {excludedOffers
                .filter(ex => {
                  const matched = priceOffers.find(p => p.vendor === ex.vendor);
                  return !(matched && matched.result === 'مطابق');
                })
                .map((offer) => (
                  <tr key={offer.id} className="hover:bg-blue-50 transition-colors print:border-gray-300">
                    {/* مقدم العرض */}
                    <td className="py-2 px-1 border border-gray-300 font-medium text-center print:py-1 print:px-1">
                      {offer.vendor || '\u00A0\n\u00A0'} {/* ✅ سطرين فارغين إذا لم يكن هناك محتوى */}
                    </td>
                    {/* سبب الاستبعاد العام */}
                    <td className="py-2 px-1 border border-gray-300 print:py-1 print:px-1">
                      <textarea
                        value={offer.reason}
                        onChange={(e) => handleUpdateExcludedOffer(offer.id, { reason: e.target.value })}
                        className={`excluded-textarea w-full border border-gray-300 rounded-md py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none print:hidden text-xs ${isPreliminaryPrint ? 'h-[2em] leading-tight' : ''}`}
                        placeholder="سبب الاستبعاد العام"
                        style={{
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          overflow: 'hidden',
                          minHeight: '2em',
                          lineHeight: '1.2'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          if (!isPreliminaryPrint) {
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }
                        }}
                      />
                      <div
                        className={`hidden print:block whitespace-pre-wrap break-words text-[11px] leading-tight ${printReasons ? '' : 'invisible'}`}
                        style={{
                          minHeight: '2em',
                          lineHeight: '1.2'
                        }}
                      >
                        {offer.reason || '\u00A0'}
                      </div>
                    </td>
                    {/* أسباب تفصيلية تلقائية */}
                    <td className="py-2 px-1 border border-gray-300 print:py-1 print:px-1">
                      <div className={`space-y-1 ${printReasons ? '' : 'print:hidden'}`}>
                        {(offer as ExtendedExcludedOffer).priceReason && (
                          <div className="bg-red-50 border border-red-200 p-1 rounded text-xs">
                            <span className="font-medium text-red-800 text-xs">السعر:</span>
                            <div className="text-red-700 text-xs">{(offer as ExtendedExcludedOffer).priceReason}</div>
                          </div>
                        )}
                        {(offer as ExtendedExcludedOffer).colorReason && (
                          <div className="bg-yellow-50 border border-yellow-200 p-1 rounded text-xs">
                            <span className="font-medium text-yellow-800 text-xs">اللون:</span>
                            <div className="text-yellow-700 text-xs">{(offer as ExtendedExcludedOffer).colorReason}</div>
                          </div>
                        )}
                        {(offer as ExtendedExcludedOffer).specReasons &&
                          Array.isArray((offer as ExtendedExcludedOffer).specReasons) && (
                            <div className={`bg-blue-50 border border-blue-200 p-1 rounded ${printReasons ? 'text-[10px]' : 'print:hidden'} `}>
                              <span className="font-medium text-blue-800 text-xs">المواصفات:</span>
                              <ul className="list-disc list-inside text-blue-700 space-y-0.5 text-xs">
                                {(offer as ExtendedExcludedOffer).specReasons!.length > 0 ? (
                                  (offer as ExtendedExcludedOffer).specReasons!.map((reason: string, idx: number) => (
                                    <li key={idx} className="leading-tight text-xs">{reason}</li>
                                  ))
                                ) : (
                                  <li className="text-gray-400 italic text-xs">لا توجد أسباب تفصيلية</li>
                                )}
                              </ul>
                            </div>
                          )}
                        {!(offer as ExtendedExcludedOffer).priceReason &&
                          !(offer as ExtendedExcludedOffer).colorReason &&
                          (!(offer as ExtendedExcludedOffer).specReasons || (offer as ExtendedExcludedOffer).specReasons!.length === 0) && (
                            <div className="text-gray-400 text-xs italic">
                              {printReasons ? 'لا توجد أسباب تفصيلية' : '\u00A0'}
                            </div>
                          )}
                      </div>
                      {/* ✅ مساحة فارغة عند إخفاء الأسباب */}
                      {!printReasons && (
                        <div className="hidden print:block whitespace-pre-wrap break-words text-[10px] leading-tight"
                          style={{ minHeight: '2em', lineHeight: '1.2' }}>
                          {'\u00A0\n\u00A0'}
                        </div>
                      )}
                    </td>
                    {/* ملاحظات حقول عمود إضافية */}
                    {/* <td className="py-2 px-1 border border-gray-300 print:py-1 print:px-1">
                      <textarea
                        value={offer.notes}
                        onChange={(e) => handleUpdateExcludedOffer(offer.id, { notes: e.target.value })}
                        className={`excluded-textarea w-full border border-gray-300 rounded-md py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none print:hidden text-xs ${isPreliminaryPrint ? 'h-[2em] leading-tight' : ''}`}
                        placeholder="ملاحظات إضافية"
                        style={{
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          overflow: 'hidden',
                          minHeight: '2em',
                          lineHeight: '1.2'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          if (!isPreliminaryPrint) {
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }
                        }}
                      />
                      <div
                        className="hidden print:block whitespace-pre-wrap break-words text-[11px] leading-tight"
                        style={{
                          minHeight: '2em',
                          lineHeight: '1.2'
                        }}
                      >
                        {offer.notes || '\u00A0'}
                      </div>
                    </td> */}
                    {/* الإجراءات */}
                    <td className="py-2 px-1 border border-gray-300 text-center print:hidden">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(offer)}
                          className="text-blue-500 hover:text-blue-700 transition-colors px-1 py-0.5 rounded hover:bg-blue-50 text-xs"
                          title="تعديل الأسباب"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleRemoveExcludedOffer(offer.id)}
                          className="text-red-500 hover:text-red-700 transition-colors px-1 py-0.5 rounded hover:bg-red-50 text-xs"
                          title="حذف من المستبعدة"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ✅ نصائح للطباعة */}
      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
        <h4 className="font-medium text-blue-800 mb-1 text-sm">💡 تلميحات الطباعة:</h4>
        <ul className="text-xs text-blue-700 space-y-0.5">
          <li>• اختر "طباعة أسباب الاستبعاد" لإظهار/إخفاء الأسباب التفصيلية</li>
          <li>• استخدم "تفريغ" لنقل جميع العروض غير المطابقة قبل الطباعة</li>
          <li>• في الطباعة النهائية، يتم ضبط الارتفاعات تلقائياً حسب المحتوى</li>
        </ul>
      </div>
      {/* ... (بقية الأجزاء التالية نقلت كما هي) */}
      {/* قسم إضافة عرض مستبعد جديد يدوياً (يضاف قبل نهاية المكون): */}
      {/* قسم إضافة عرض مستبعد جديد يدوياً */}
      <div className="mt-4 print:hidden">
        <details className="bg-gray-50 rounded-md border border-gray-200">
          <summary className="p-3 cursor-pointer font-medium hover:bg-gray-100 transition-colors">
            إضافة عرض مستبعد جديد يدوياً
          </summary>
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">مقدم العرض:</label>
                <select
                  className="w-full border border-gray-300 rounded-md py-2 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => e.target.value && handleAddExcludedOffer(e.target.value)}
                  value=""
                >
                  <option value="">اختر مقدم العرض</option>
                  {priceOffers
                    .filter(offer => offer.vendor && !excludedOffers.some(excluded => excluded.vendor === offer.vendor))
                    .map(offer => (
                      <option key={offer.id} value={offer.vendor}>
                        {offer.vendor}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">سبب الاستبعاد:</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سبب الاستبعاد العام"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">ملاحظات:</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات إضافية"
                />
              </div>
            </div>
          </div>
        </details>
      </div>
      {/* 3. نافذة تعديل العرض المستبعد (يضاف قبل نهاية المكون): */}
      {/* نافذة تعديل العرض المستبعد المحسنة */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Ban className="ml-2" size={20} />
                  تعديل العرض المستبعد
                </h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {/* معلومات المورد */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المورد:</label>
                  <input
                    type="text"
                    value={editData.vendor || ''}
                    onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم المورد"
                  />
                </div>
                {/* سبب الاستبعاد العام */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سبب الاستبعاد العام:</label>
                  <textarea
                    value={editData.reason || ''}
                    onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="سبب الاستبعاد العام"
                    rows={2}
                  />
                </div>
                {/* أسباب الاستبعاد التفصيلية التلقائية */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-700 flex items-center">
                    <AlertTriangle className="ml-2" size={18} />
                    أسباب الاستبعاد التفصيلية (قابلة للتعديل)
                  </h4>
                  {/* سبب السعر */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <DollarSign className="ml-1" size={16} />
                      السعر:
                    </label>
                    <textarea
                      value={(editData as ExtendedExcludedOffer).priceReason || ''}
                      onChange={(e) => setEditData({ ...editData, priceReason: e.target.value })}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="سبب الاستبعاد المتعلق بالسعر"
                      rows={2}
                    />
                  </div>
                  {/* سبب اللون */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Palette className="ml-1" size={16} />
                      اللون:
                    </label>
                    <textarea
                      value={(editData as ExtendedExcludedOffer).colorReason || ''}
                      onChange={(e) => setEditData({ ...editData, colorReason: e.target.value })}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="سبب الاستبعاد المتعلق باللون"
                      rows={2}
                    />
                  </div>
                  {/* أسباب المواصفات */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Settings className="ml-1" size={16} />
                      المواصفات:
                    </label>
                    <textarea
                      value={(editData as ExtendedExcludedOffer).specReasons?.join('\n') || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        specReasons: e.target.value.split('\n').filter((r: string) => r.trim() !== '')
                      })}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أسباب الاستبعاد المتعلقة بالمواصفات (كل سبب في سطر منفصل)"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 أدخل كل سبب في سطر منفصل
                    </p>
                  </div>
                </div>
                {/* ملاحظات إضافية */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية:</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ملاحظات إضافية أو تفسيرات"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 4. نصائح الاستخدام (يضاف قبل نهاية المكون): */}
      {/* نصائح للاستخدام */}
      <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 print:hidden">
        <h4 className="font-medium text-amber-800 mb-2">💡 نصائح حول العروض المستبعدة:</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• يتم نقل العروض غير المطابقة تلقائياً إلى هذا الجدول</li>
          <li>• يمكن تعديل الأسباب التلقائية أو إضافة أسباب إضافية</li>
          <li>• استخدم "تفريغ" لنقل جميع العروض غير المطابقة</li>
          <li>• اختر "طباعة أسباب الاستبعاد" للتحكم في العرض أثناء الطباعة</li>
        </ul>
      </div>
    </div>
  );
};



// ======================================================================
// في جدول العرض المستبعدة
// 1-
// يجب ان تظهر بيانات حقول عمود أسباب تفصيلية تلقائية الياً
// ليظهر الاختلاف بين الاسعار والمواصفات وذلك كما يلي 

// السعر
// يجب ان يظهر النقص في الكميات المقدمة اذا كان هناك نقص عن الكميات المطلوبة أو لم يقدم للصنف
// ونسبه إرتفاع سعر الوحدة المقدمة مقارنة بسعر الوحدة في التقديرية
// وكذلك ملاحظات النقص في سعر الوحدة من الكلفة التقديري
// أي المقارنة بين سعر التكلفة التقديرية للوحدة وسعر الوحدة المقدمة من فبل الموردين على مستوى كل صنف وكتابه الزيادة أو النقص عن سعر التكلفة

// المواصفات

// يتم مقارنه بين المواصفات المطلوبة والمواصفات المقدمة وذلك كما يلي
//  اذا كانت المواصفات المقدمة نفس المواصفات المطلوبة يتم ذكر الصنف ويكتب "مطابق" للمواصفات المطلوبة
//  اذا كان هناك اختلاف بين المواصفات فيجب ان يظهر اسم الصنف ويكتب هناك "غير مطابق" يوجد اختلاف بين المواصفات حيث أن المطلوب (كذا...........) والمقدم (كذا..............)

// 2-
//  يجب ان يعمل زر "طباعة أسباب الاستبعاد" كالتالي 

// اذا تم الغاء التفعيل يتم إخفاء جميع محتويات عمود أسباب تفصيلية تلقائية عند الطباعة ومن على الشاشة أيضا 
// واذا تم تفعيل الزر فتظهر أسباب التفصيلية عند الطباعة وعلى الشاشة أيضا

// 3-
// يجب ان يظهر أسماء مقدمي العروض في جدول العروض المستبعدة تلقائيا على الشاشة وعند الطباعة 
// وبالذات في الحالات التالية
// أ- بعد استكمال ادخال العروض
//  ب- عند الضغط على زر التفريغ 
//  ج-عند الضغط على زر الطباعة الأولية

// 4-
// يجب المحافظه على التعليقات الحاليه واضافه اي تعليقات توضيحيه

// 5-
// يجب ان يختفي اسم مقدم العرض من جدول العروض المستبعدة اذا كانت قيمة حقل النتيجة مطابق



// لقد قمت بتنفيذ معظم التعديلات المطلوبة على ملف ExcludedOffersSection.tsx:

// تعديل دالة توليد الأسباب التلقائية:

// تم تحديث قسم مقارنة الأسعار مع التكلفة التقديرية ليشمل:
// التحقق من النقص في الكميات المقدمة مقارنة بالكميات المطلوبة
// إظهار نسبة ارتفاع سعر الوحدة المقدمة مقارنة بسعر الوحدة في التقديرية
// إضافة ملاحظات النقص في سعر الوحدة من الكلفة التقديرية
// تم تحديث قسم مقارنة المواصفات المطلوبة مع المواصفات المقدمة:
// عندما تكون المواصفات المقدمة نفس المواصفات المطلوبة، يتم كتابة "مطابق للمواصفات المطلوبة"
// عند وجود اختلاف في المواصفات، يتم كتابة "غير مطابق - يوجد اختلاف بين المواصفات حيث أن المطلوب (...) والمقدم (...)"
// التحكم في زر "طباعة أسباب الاستبعاد":

// تم تعديل الكود ليتيح التحكم في إظهار/إخفاء محتويات عمود أسباب تفصيلية تلقائية عند الطباعة وعلى الشاشة
// إظهار أسماء مقدمي العروض تلقائياً:

// الكود الحالي بالفعل يقوم بنقل العروض غير المطابقة تلقائياً إلى جدول العروض المستبعدة بعد استكمال إدخال العروض
// عند الضغط على زر "تفريغ" يتم نقل جميع العروض غير المطابقة
// عند الضغط على زر الطباعة الأولية يتم أيضاً نقل العروض غير المطابقة
// المحافظة على التعليقات الحالية:

// تم الحفاظ على جميع التعليقات الحالية وإضافة تعليقات توضيحية جديدة
// إخفاء اسم مقدم العرض إذا كانت النتيجة مطابقة:

// الكود الحالي بالفعل يقوم بفلترة العروض المستبعدة لإظهار فقط العروض غير المطابقة
// هذه التعديلات تحقق جميع المتطلبات المطلوبة في صفحة جدول العروض المستبعدة.

