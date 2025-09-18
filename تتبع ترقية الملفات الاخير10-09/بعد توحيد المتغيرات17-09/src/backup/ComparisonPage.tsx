// purchases_alamin7-copy5\src\components\ComparisonPage.tsx


import React, { useState, useEffect } from 'react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { formatNumberWithCommas } from '../utils/numberToWords';

export const ComparisonPage: React.FC = () => {
  const {
    poNumber, // أضف هذا المتغير من الـ context
    priceOffers,
    poItems,
    // استيراد الدوال اللازمة للحفظ في قاعدة البيانات
    savePurchaseOrder,
    updatePriceOffer,
    // إضافة بيانات المواصفات والتكلفة التقديرية
    estimatedCosts,
    setEstimatedCosts,
    itemSpecifications,
    setItemSpecifications
  } = usePurchaseOrder();

  // حالة لتخزين التكاليف التقديرية المؤقتة قبل الحفظ
  const [tempEstimatedCosts, setTempEstimatedCosts] = useState<{ [key: number]: number }>({});
  // حالة لتخزين المواصفات المؤقتة قبل الحفظ
  const [tempSpecifications, setTempSpecifications] = useState<{ [key: number]: string }>({});

  // تهيئة الحالة عند تحميل المكون
  useEffect(() => {
    // تهيئة التكاليف التقديرية من قاعدة البيانات إذا كانت موجودة
    if (estimatedCosts && Object.keys(estimatedCosts).length > 0) {
      setTempEstimatedCosts(estimatedCosts);
    } else {
      // إنشاء تكاليف تقديرية افتراضية إذا لم تكن موجودة
      const defaultCosts = poItems.reduce((acc, item) => {
        acc[item.lineNumber] = 0;
        return acc;
      }, {} as { [key: number]: number });
      setTempEstimatedCosts(defaultCosts);
    }
    // تهيئة المواصفات من قاعدة البيانات إذا كانت موجودة
    if (itemSpecifications && Object.keys(itemSpecifications).length > 0) {
      setTempSpecifications(itemSpecifications);
    } else {
      // إنشاء مواصفات افتراضية إذا لم تكن موجودة
      const defaultSpecs = poItems.reduce((acc, item) => {
        acc[item.lineNumber] = '';
        return acc;
      }, {} as { [key: number]: string });
      setTempSpecifications(defaultSpecs);
    }
  }, [poItems, estimatedCosts, itemSpecifications]);

  // إضافة useEffect جديد لتحديث المواصفات فورًا عند تغييرها
  useEffect(() => {
    // التحقق من وجود مواصفات في عروض الأسعار وتحديثها فورًا
    if (priceOffers && priceOffers.length > 0) {
      console.log("تحديث المواصفات في صفحة المقارنة");
      // إجبار إعادة العرض لضمان ظهور المواصفات المحدثة
      const temp = [...priceOffers];
      // هذا مجرد تحديث بسيط لإجبار إعادة العرض
      temp.forEach(offer => {
        if (offer.lineItems) {
          offer.lineItems.forEach(item => {
            if (item.vendorSpecifications) {
              // التأكد من أن المواصفات محدثة
              item.vendorSpecifications = { ...item.vendorSpecifications };
            }
          });
        }
      });
    }
  }, [priceOffers, poItems]);

  // إضافة useEffect لمراقبة تغيرات المواصفات
  // إضافة هذا الـ useEffect في صفحة المقارنة
useEffect(() => {
  // تحديث المواصفات عند تغيير عروض الأسعار
  const updateSpecifications = () => {
    // يمكن إضافة منطق لتحديث المواصفات هنا إذا لزم الأمر
  };
  
  updateSpecifications();
}, [priceOffers, poItems]);

  // دالة للحصول على التكلفة التقديرية لصنف معين مع العملة
  const getEstimatedCostForItem = (lineNumber: number) => {
    const item = poItems.find(item => item.lineNumber === lineNumber);
    if (!item || !item.estimatedCost) {
      return { amount: 0, currency: 'ريال' };
    }
    return {
      amount: item.estimatedCost.amount || 0,
      currency: item.estimatedCost.currency || 'ريال'
    };
  };

  // دالة لحساب إجمالي التكلفة التقديرية بالعملة الأصلية
  const getTotalEstimatedCost = () => {
    // سنحسب الإجمالي لكل عملة على حدة
    const totalsByCurrency: { [currency: string]: number } = {};

    poItems.forEach(item => {
      if (item.estimatedCost && item.estimatedCost.amount > 0) {
        const currency = item.estimatedCost.currency || 'ريال';
        const amount = item.estimatedCost.amount * item.quantity;
        totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
      }
    });

    // إذا كان هناك عملة واحدة فقط، نرجع المبلغ والعملة
    const currencies = Object.keys(totalsByCurrency);
    if (currencies.length === 1) {
      return {
        amount: totalsByCurrency[currencies[0]],
        currency: currencies[0]
      };
    }

    // إذا كان هناك أكثر من عملة، نرجع المجموع بالريال
    const totalInRiyal = Object.entries(totalsByCurrency).reduce((total, [currency, amount]) => {
      if (currency === 'ريال') {
        return total + amount;
      }
      // البحث عن سعر الصرف
      const offerWithRate = priceOffers.find(offer =>
        offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
      );
      const exchangeRate = offerWithRate?.exchangeRate || 1;
      return total + (amount * exchangeRate);
    }, 0);

    return {
      amount: totalInRiyal,
      currency: 'ريال'
    };
  };

  // دالة لحساب المعادل بالريال لكل صنف (تستخدم فقط إذا كان هناك سعر صرف)
  const getEquivalentInRiyalForItem = (lineNumber: number) => {
    const item = poItems.find(item => item.lineNumber === lineNumber);
    if (!item || !item.estimatedCost) {
      return 0;
    }

    const { amount, currency } = item.estimatedCost;
    if (currency === 'ريال') {
      // return amount * item.quantity;  // هذا السطر يحسب المعادل بالريال لاجمالي الكمية الخاصة بالسطر 
      // يعدل السطر السابق لحساب سعر الوحدة الوادة فقط كما يلي 
      // =============================
      // فقط سعر الوحدة، بدون الكمية
      return amount ?? 0;
      // =================================
    }

    // البحث عن سعر الصرف
    const offerWithRate = priceOffers.find(offer =>
      offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
    );

    if (offerWithRate && offerWithRate.exchangeRate) {
      // return (amount * item.quantity) * offerWithRate.exchangeRate;  // هذا السطر يحسب المعادل بالريال لاجمالي الكمية الخاصة بالسطر
      // يعدل السطر السابق لحساب سعر الوحدة الوادة فقط كما يلي 
      // ======================================
      // سعر الوحدة × سعر الصرف
      return (amount ?? 0) * offerWithRate.exchangeRate;
      // ====================================
    }

    return 0; // لا يوجد سعر صرف، نرجع 0
  };

  // دالة لحساب أقل سعر معادل بالريال لكل صنف
  const getMinPriceInRiyal = (lineNumber: number) => {
    const validPrices = priceOffers
      .map(offer => {
        const lineItem = offer.lineItems?.find(li =>
          li.lineNumber === lineNumber || li.name === poItems.find(item => item.lineNumber === lineNumber)?.name
        );
        const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
        const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
        return unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : null;
      })
      .filter(price => price !== null) as number[];
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  };

  // دالة للحصول على مواصفات المورد لصنف معين
  // const getVendorSpecification = (vendor: string, lineNumber: number) => {
  //   const offer = priceOffers.find(o => o.vendor === vendor);
  //   if (!offer || !offer.lineItems) return '';
  //   const lineItem = offer.lineItems.find(li =>
  //     li.lineNumber === lineNumber || li.name === poItems.find(item => item.lineNumber === lineNumber)?.name
  //   );

  //   // تحسين عرض المواصفات - التأكد من عرض جميع المواصفات المقدمة
  //   if (lineItem?.vendorSpecifications) {
  //     const specs = lineItem.vendorSpecifications;
  //     if (typeof specs === 'object' && specs !== null) {
  //       return Object.entries(specs)
  //         .filter(([key, value]) => value !== null && value !== undefined && String(value).trim() !== '')
  //         .map(([key, value]) => `• ${key}: ${value}`)
  //         .join('<br />');
  //     } else if (typeof specs === 'string' && specs.trim() !== '') {
  //       return specs;
  //     }
  //   }

  //   // إذا لم يتم العثور على مواصفات، عرض أي معلومات متاحة من الصنف
  //   if (lineItem && Object.keys(lineItem).length > 0) {
  //     const otherInfo = [];
  //     // التحقق من وجود الخصائص قبل الوصول إليها
  //     if ('description' in lineItem && lineItem.description) otherInfo.push(`الوصف: ${lineItem.description}`);
  //     if ('brand' in lineItem && lineItem.brand) otherInfo.push(`الماركة: ${lineItem.brand}`);
  //     if ('model' in lineItem && lineItem.model) otherInfo.push(`الموديل: ${lineItem.model}`);
  //     if ('origin' in lineItem && lineItem.origin) otherInfo.push(`بلد المنشأ: ${lineItem.origin}`);
  //     // إضافة خصائص إضافية قد تكون موجودة
  //     if ('warranty' in lineItem && lineItem.warranty) otherInfo.push(`الضمان: ${lineItem.warranty}`);
  //     if ('color' in lineItem && lineItem.color) otherInfo.push(`اللون: ${lineItem.color}`);
  //     if ('size' in lineItem && lineItem.size) otherInfo.push(`الحجم: ${lineItem.size}`);
  //     if ('material' in lineItem && lineItem.material) otherInfo.push(`المادة: ${lineItem.material}`);
  //     if ('dimensions' in lineItem && lineItem.dimensions) otherInfo.push(`الأبعاد: ${lineItem.dimensions}`);
  //     if ('weight' in lineItem && lineItem.weight) otherInfo.push(`الوزن: ${lineItem.weight}`);

  //     if (otherInfo.length > 0) {
  //       return otherInfo.map(info => `• ${info}`).join('<br />');
  //     }
  //   }

  //   // إذا لم يتم العثور على أي معلومات، إرجاع رسالة مناسبة
  //   return 'لا توجد مواصفات متاحة';
  // };

  // تعديل دالة عرض المواصفات في صفحة المقارنة
  // دالة للحصول على مواصفات المورد لصنف معين
  const getVendorSpecification = (vendor: string, lineNumber: number) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    if (!offer) return '';

    const lineItem = offer.lineItems?.find(li => li.lineNumber === lineNumber);
    if (!lineItem) return '';

    // تحسين عرض المواصفات - التأكد من عرض جميع المواصفات المقدمة
    if (lineItem.vendorSpecifications) {
      const specs = lineItem.vendorSpecifications;

      // التأكد من أن المواصفات كائن وليست فارغة
      if (typeof specs === 'object' && specs !== null && Object.keys(specs).length > 0) {
        return Object.entries(specs)
          .filter(([key, value]) => {
            // التأكد من أن القيمة ليست null أو undefined أو فارغة
            return value !== null && value !== undefined && String(value).trim() !== '';
          })
          .map(([key, value]) => `• ${key}: ${value}`)
          .join('<br />');
      }
    }

    // إضافة محاولة بديلة للبحث عن المواصفات إذا لم يتم العثور عليها بالطريقة العادية
    // هذا يضمن عرض المواصفات حتى لو تم حفظها بتنسيق مختلف
    if (lineItem && typeof lineItem === 'object') {
      // البحث عن أي خصائص قد تحتوي على مواصفات
      for (const key in lineItem) {
        if (key.includes('spec') || key.includes('Specification')) {
          const specValue = (lineItem as any)[key];
          if (specValue && typeof specValue === 'object' && Object.keys(specValue).length > 0) {
            return Object.entries(specValue)
              .filter(([_, value]) => value !== null && value !== undefined && String(value).trim() !== '')
              .map(([key, value]) => `• ${key}: ${value}`)
              .join('<br />');
          }
        }
      }
    }

    // إذا لم يتم العثور على مواصفات، عرض أي معلومات متاحة من الصنف
    if (lineItem && Object.keys(lineItem).length > 0) {
      const otherInfo = [];

      // التحقق من وجود الخصائص قبل الوصول إليها
      if ('description' in lineItem && lineItem.description) otherInfo.push(`الوصف: ${lineItem.description}`);
      if ('brand' in lineItem && lineItem.brand) otherInfo.push(`الماركة: ${lineItem.brand}`);
      if ('model' in lineItem && lineItem.model) otherInfo.push(`الموديل: ${lineItem.model}`);
      if ('origin' in lineItem && lineItem.origin) otherInfo.push(`بلد المنشأ: ${lineItem.origin}`);
      if ('warranty' in lineItem && lineItem.warranty) otherInfo.push(`الضمان: ${lineItem.warranty}`);
      if ('color' in lineItem && lineItem.color) otherInfo.push(`اللون: ${lineItem.color}`);
      if ('size' in lineItem && lineItem.size) otherInfo.push(`الحجم: ${lineItem.size}`);
      if ('material' in lineItem && lineItem.material) otherInfo.push(`المادة: ${lineItem.material}`);
      if ('dimensions' in lineItem && lineItem.dimensions) otherInfo.push(`الأبعاد: ${lineItem.dimensions}`);
      if ('weight' in lineItem && lineItem.weight) otherInfo.push(`الوزن: ${lineItem.weight}`);

      if (otherInfo.length > 0) {
        return otherInfo.map(info => `• ${info}`).join('<br />');
      }
    }

    // إذا لم يتم العثور على أي معلومات، إرجاع رسالة مناسبة
    return 'لا توجد مواصفات متاحة';
  };

  // دالة للحصول على المواصفات المطلوبة لصنف معين
  const getRequiredSpecifications = (lineNumber: number) => {
    const item = poItems.find(item => item.lineNumber === lineNumber);
    if (!item?.specifications) return '';
    return Object.entries(item.specifications)
      .filter(([key, value]) => value && typeof value === 'string' && value.trim() !== '')
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('<br />');
  };

  // دالة لتحويل المبلغ إلى الريال اليمني
  const convertToYemeniRiyal = (amount: number, currency: string) => {
    if (currency === 'ريال يمني' || currency === 'ريال') return amount;

    // البحث عن سعر الصرف من عروض الأسعار
    const offerWithRate = priceOffers.find(offer =>
      offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
    );

    if (offerWithRate && offerWithRate.exchangeRate) {
      return amount * offerWithRate.exchangeRate;
    }

    return amount; // إذا لم يتم العثور على سعر صرف
  };

  // دالة لحساب إجمالي عرض المورد بالعملة الأصلية
  const getVendorTotalOffer = (vendor: string) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    if (!offer) return 0;   // تعديل: إرجاع 0 إذا لم يتم العثور على العرض

    // استخدام totalAfterTax إذا كان موجودًا، وإلا حسابه من lineItems
    if (offer.totalAfterTax) {
      return offer.totalAfterTax;
    }

    // استخدام total إذا كان موجودًا
    if (offer.total) {
      return offer.total;
    }

    // إذا لم يوجد أي من الحقول السابقة، نحسب من lineItems
    if (offer.lineItems) {
      return offer.lineItems.reduce((total, lineItem) => {
        const poItem = poItems.find(item =>
          item.lineNumber === lineItem.lineNumber || item.name === lineItem.name
        );
        if (!poItem) return total;
        const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
        return total + (unitPriceAfterTax * (lineItem.offeredQty || poItem.quantity));
      }, 0);
    }

    // إذا لم يكن هناك أي شيء، نرجع المبلغ الأصلي
    return offer.amount || 0;
  };

  // دالة لحساب إجمالي عرض المورد بالريال اليمني
  const getVendorTotalOfferInRiyal = (vendor: string) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    if (!offer) return 0;    // تعديل: إرجاع 0 إذا لم يتم العثور على العرض

    // استخدام totalInYR إذا كان موجودًا
    if (offer.totalInYR) {
      return offer.totalInYR;
    }

    // حسابه من البيانات المتاحة
    const total = getVendorTotalOffer(vendor);
    const currency = getVendorCurrency(vendor);

    if (currency === 'ريال') {
      return total;
    }

    const exchangeRate = offer.exchangeRate || 1;
    return total * exchangeRate;
  };

  // دالة للحصول على عملة المورد
  const getVendorCurrency = (vendor: string) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    return offer?.currency || 'ريال';
  };

  // دالة للحصول على ملاحظات الاختلافات بين المواصفات المطلوبة والمقدمة
  const getSpecificationDifferences = (vendor: string) => {
    const offer = priceOffers.find(o => o.vendor === vendor);
    if (!offer) return '';
    let differences = '';

    poItems.forEach(item => {
      const requiredSpecs = getRequiredSpecifications(item.lineNumber);
      const vendorSpecs = getVendorSpecification(vendor, item.lineNumber);

      // الحصول على التكلفة التقديرية والسعر المقدم
      const estimatedCostInfo = getEstimatedCostForItem(item.lineNumber);
      const estimatedCost = estimatedCostInfo.amount;
      const estimatedCurrency = estimatedCostInfo.currency;

      const lineItem = offer.lineItems?.find(li =>
        li.lineNumber === item.lineNumber || li.name === item.name
      );
      const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
      const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
      const unitPriceInRiyal = unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : 0;
      const offeredTotal = unitPriceInRiyal * (lineItem?.offeredQty || item.quantity);
      const estimatedTotal = estimatedCost * item.quantity;

      // حساب نسبة الفرق
      let priceDifference = '';
      let priceStatus = '';
      if (estimatedTotal > 0 && offeredTotal > 0) {
        const percentageDiff = ((offeredTotal - estimatedTotal) / estimatedTotal) * 100;
        if (Math.abs(percentageDiff) < 0.01) {
          priceStatus = 'مطابق';
        } else if (percentageDiff > 0) {
          priceStatus = `أعلى بنسبة ${percentageDiff.toFixed(2)}%`;
        } else {
          priceStatus = `أقل بنسبة ${Math.abs(percentageDiff).toFixed(2)}%`;
        }
        priceDifference = `<p><strong>الفرق في السعر:</strong> ${priceStatus}</p>`;
      }

      // التحقق من المواصفات
      if (!vendorSpecs || vendorSpecs === 'لا توجد مواصفات متاحة') {
        differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> لم يقدم المورد مواصفات</p>`;
        differences += priceDifference;
      } else if (!requiredSpecs || requiredSpecs === '') {
        differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> لا توجد مواصفات مطلوبة للمقارنة</p>`;
        differences += priceDifference;
      } else if (requiredSpecs === vendorSpecs) {
        differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> مطابق للمواصفات المطلوبة</p>`;
        differences += priceDifference;
      } else {
        differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> غير مطابق - يوجد اختلاف بين المواصفات</p>`;
        differences += `<div class="mr-4">`;
        differences += `<p class="text-sm"><strong>المطلوب:</strong></p>`;
        differences += `<p class="text-sm">${requiredSpecs}</p>`;
        differences += `<p class="text-sm mt-2"><strong>المقدم:</strong></p>`;
        differences += `<p class="text-sm">${vendorSpecs}</p>`;
        differences += `</div>`;
        differences += priceDifference;
      }
      
      // التحقق من الكميات المقدمة (يستخدم lineItem المعرف أعلاه)
      
      if (lineItem) {
        const requestedQty = item.quantity;
        const offeredQty = lineItem.offeredQty || 0;
        
        if (offeredQty < requestedQty) {
          const shortage = requestedQty - offeredQty;
          const shortagePercentage = ((shortage / requestedQty) * 100).toFixed(1);
          differences += `<p><strong>نقص في الكمية:</strong> المطلوب ${requestedQty} والمقدم ${offeredQty} (نقص ${shortage} وحدة - ${shortagePercentage}%)</p>`;
        }
      } else {
        differences += `<p><strong>الكمية:</strong> لم يتم تقديم كمية للصنف</p>`;
      }
    });

    // إضافة ملاحظة عن وجود خطأ في إجمالي مبلغ العرض إذا كانت موجودة
    if (offer.notes && offer.notes.includes('يوجد اختلاف بين إجمالي مبلغ العرض وإجمالي أسعار الأصناف')) {
      differences += `<p><strong>ملاحظة هامة:</strong> هناك خطأ في إجمالي مبلغ العرض</p>`;
    }

    return differences;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 print:shadow-none print:p-2 border border-gray-200 print:landscape">
      <h2 className="text-lg font-semibold mb-4 text-right">مقارنة عروض الموردين</h2>

      {/* جدول مقارنة إجمالية للعروض */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            {/* عنوان رئيسي للجدول */}
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10" colSpan={4}>
                <div className="text-sm font-semibold">بيانات طلب الشراء</div>
              </th>
              {priceOffers.map((offer, idx) => (
                <th
                  key={`vendor-${offer.id}`}
                  colSpan={3}
                  className={`border-2 border-gray-400 p-2 text-center w-6/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
                >
                  <div className="text-sm font-semibold">{offer.vendor || `العرض ${idx + 1}`}</div>
                </th>
              ))}
            </tr>
            {/* عناوين الأعمدة */}
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">رقم الطلب</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">إجمالي التكلفة التقديرية</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">العملة</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">المبلغ المعادل بالريال</th>
              {priceOffers.map((offer, idx) => (
                <React.Fragment key={`total-h-${offer.id}`}>
                  <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                    <div className="text-xs font-medium">إجمالي مبلغ العرض</div>
                  </th>
                  <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                    <div className="text-xs font-medium">العملة</div>
                  </th>
                  <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                    <div className="text-xs font-medium">المبلغ المعادل بالريال</div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* تعديل: إظهار رقم طلب الشراء فقط بدون إضافة رقم 1 */}
              <td className="border border-gray-300 p-2 text-center">{poNumber}</td>
              <td className="border border-gray-300 p-2 text-center">
                {formatNumberWithCommas(getTotalEstimatedCost().amount)} {getTotalEstimatedCost().currency}
              </td>
              <td className="border border-gray-300 p-2 text-center">{getTotalEstimatedCost().currency}</td>
              <td className="border border-gray-300 p-2 text-center">
                {formatNumberWithCommas(convertToYemeniRiyal(getTotalEstimatedCost().amount, getTotalEstimatedCost().currency))}
              </td>
              {priceOffers.map((offer, idx) => {
                const vendorTotal = getVendorTotalOffer(offer.vendor);
                const vendorTotalInRiyal = getVendorTotalOfferInRiyal(offer.vendor);
                const currency = getVendorCurrency(offer.vendor);
                return (
                  <React.Fragment key={`total-r-${offer.id}`}>
                    <td className="border border-gray-300 p-2 text-center">{formatNumberWithCommas(vendorTotal)}</td>
                    <td className="border border-gray-300 p-2 text-center">{currency}</td>
                    <td className="border border-gray-300 p-2 text-center">{formatNumberWithCommas(vendorTotalInRiyal)}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* جدول مقارنة الأسعار */}
      <h2 className="text-lg font-semibold mb-4 text-right">مقارنة عروض الموردين تفصيلي</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            {/* عنوان رئيسي للأصناف والكميات المطلوبة */}
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-1/10" colSpan={5}>
                <div className="text-sm font-semibold">الأصناف والكميات المطلوبة</div>
              </th>
              {priceOffers.map((offer, idx) => (
                <th
                  key={`vh-${offer.id}`}
                  colSpan={3}
                  className={`border-2 border-gray-400 p-2 text-center w-3/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
                >
                  <div className="text-xs font-medium">{offer.vendor || `العرض ${idx + 1}`}</div>
                </th>
              ))}
            </tr>
            {/* عناوين الأعمدة */}
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-1/10">السطر</th>
              <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-5/10">الصنف</th>
              <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">الكمية</th>
              <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">التكلفة التقديرية للوحدة</th>
              <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">المعادل بالريال للوحدة</th>
              {priceOffers.map((offer, idx) => (
                <React.Fragment key={`cols-${offer.id}`}>
                  <th className={`border border-gray-300 p-1 text-center text-xs w-2/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                    الكمية المقدمة
                  </th>
                  <th className={`border border-gray-300 p-1 text-center text-xs w-3/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                    سعر الوحدة ({offer.currency || ''})
                  </th>
                  <th className={`border border-gray-300 p-1 text-center text-xs w-3/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                    سعر الوحدة (ريال)
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {poItems.map((item) => {
              const estimatedCost = getEstimatedCostForItem(item.lineNumber);
              const equivalentInRiyal = getEquivalentInRiyalForItem(item.lineNumber);
              const minPriceInRiyal = getMinPriceInRiyal(item.lineNumber);

              return (
                <tr key={`cmp-${item.lineNumber}`} className="hover:bg-gray-50">
                  {/* معلومات الصنف الأساسية */}
                  <td className="border border-gray-300 p-2 text-center w-1/10">{item.lineNumber}</td>
                  <td className="border border-gray-300 p-2 w-5/10">{item.name}</td>
                  <td className="border border-gray-300 p-2 text-center w-2/10">{item.quantity}</td>
                  <td className="border border-gray-300 p-2 text-center w-2/10">
                    {formatNumberWithCommas(estimatedCost.amount)} {estimatedCost.currency}
                  </td>
                  <td className="border border-gray-300 p-2 text-center w-2/10">
                    {equivalentInRiyal > 0 ? formatNumberWithCommas(equivalentInRiyal) : '-'}
                  </td>

                  {/* عروض الموردين للصنف الحالي */}
                  {priceOffers.map((offer, idx) => {
                    const lineItem = offer.lineItems?.find(li =>
                      li.lineNumber === item.lineNumber || li.name === item.name
                    );
                    const qty = lineItem?.offeredQty || '';
                    const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
                    const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
                    const unitPriceInRiyal = unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : 0;

                    // تحديد إذا كان هذا هو أقل سعر
                    const isMinPrice = unitPriceInRiyal === minPriceInRiyal && unitPriceInRiyal > 0;
                    
                    // تحديد إذا كانت الكمية المقدمة أقل من المطلوبة
                    const isQuantityShort = lineItem && lineItem.offeredQty < item.quantity;

                    return (
                      <React.Fragment key={`row-${offer.id}-${item.lineNumber}`}>
                        <td className={`border border-gray-300 p-2 text-center w-2/10 ${isQuantityShort ? 'bg-red-100 text-red-700 font-semibold' : ''}`}>
                          {qty}
                          {isQuantityShort && (
                            <div className="text-xs text-red-600 mt-1">
                              نقص: {item.quantity - (lineItem?.offeredQty || 0)}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2 text-center w-3/10">
                          {unitPriceAfterTax ? formatNumberWithCommas(unitPriceAfterTax) : ''}
                        </td>
                        <td className={`border border-gray-300 p-2 text-center w-3/10 ${isMinPrice ? 'bg-green-100 font-semibold' : ''}`}>
                          {unitPriceInRiyal ? formatNumberWithCommas(unitPriceInRiyal) : ''}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* جدول مقارنة المواصفات */}
      <h2 className="text-lg font-semibold mb-4 text-right mt-8">مقارنة المواصفات</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">السطر</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-3/10">الصنف</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-3/10">المواصفات المطلوبة</th>
              {priceOffers.map((offer, idx) => (
                <th
                  key={`spec-vh-${offer.id}`}
                  className={`border-2 border-gray-400 p-2 text-center w-4/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
                >
                  <div className="text-xs font-medium">{offer.vendor || `العرض ${idx + 1}`}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poItems.map((item) => (
              <tr key={`spec-${item.lineNumber}`} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-center w-2/10">{item.lineNumber}</td>
                <td className="border border-gray-300 p-2 w-3/10">{item.name}</td>
                {/* <td className="border border-gray-300 p-2 w-3/10"> */}
                  {/* عرض المواصفات المطلوبة من جدول الأصناف */}
                  {/* <div
                    className="text-sm p-2 bg-gray-50 rounded"
                    dangerouslySetInnerHTML={{ __html: getRequiredSpecifications(item.lineNumber) || 'لا توجد مواصفات محددة' }}
                  />
                </td> */}
                {/* تعديل كيفية عرض المواصفات في الجدول */}
                 {/* في جدول مقارنة المواصفات، استخدم هذا الكود بدلاً من الكود الحالي */}
                <td className="border border-gray-300 p-2 w-3/10">
                  <div
                    className="text-sm p-2 bg-gray-50 rounded"
                    dangerouslySetInnerHTML={{ 
                      __html: getRequiredSpecifications(item.lineNumber) || 
                            '<span class="text-gray-400">لا توجد مواصفات محددة</span>' 
                    }}
                  />
                </td>
                {/* عرض مواصفات الموردين */}
                {priceOffers.map((offer, idx) => (
                  <td
                    key={`spec-row-${offer.id}-${item.lineNumber}`}
                    className={`border border-gray-300 p-2 w-4/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}
                  >
                    {/* عرض مواصفات المورد */}
                    <div
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: getVendorSpecification(offer.vendor, item.lineNumber) || 'لم يقدم مواصفات'
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ملاحظات الاختلافات بين المواصفات لكل مورد */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">ملاحظات الاختلافات في المواصفات:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priceOffers.map((offer, idx) => (
            <div key={`notes-${offer.id}`} className="border border-gray-300 rounded p-3">
              <h4 className="font-medium mb-2">{offer.vendor || `العرض ${idx + 1}`}</h4>
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: getSpecificationDifferences(offer.vendor) || 'لا توجد اختلافات في المواصفات'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* إضافة ملاحظات عامة تحت الجداول */}
      <div className="mt-6">
        <p className="font-medium">ملاحظات:</p>
        <div className="border-b border-gray-300 border-dashed pb-1 mb-2"></div>
      </div>
    </div>
  );
};




// ثانيا :في صفحة المقارنة


//  في صفحه المقارنه يجب عمل الاتي
// 1-
// يجب ان تظهر المواصفات في صفحة المقارنة في جدول "مقارنة المواصفات" وفي "مقارنة المواصفات"
// مباشرة بمجرد ادخالها في جدول عروض الأسعار

// (بنفس الطريقة التي يتم اظهار عملة العروض)
// 2-
// ويجب ان تظل المواصفات محفوظة وظاهرة في جدول عروض الأسعار عند الضغط على زر المواصفات

// 3-  يجب اصلاح الخطا الظاهر في الصفحه

//  Property 'trim' does not exist on type 'never'.
// ===============================================

// // ما تم عمله

// أولاً: تعديلات صفحة المقارنة
// إظهار قيمة حقل "إجمالي مبلغ العرض (بعد الضرائب)":
// سنعدل دالة getVendorTotalOffer لاستخدام totalAfterTax إذا كان موجودًا.
// إظهار المواصفات مباشرة في صفحة المقارنة:
// سنعدل دالة getVendorSpecification لعرض المواصفات فور إدخالها.
// إصلاح الخطأ "Property 'trim' does not exist on type 'never'":
// سنضيف تحققًا من النوع قبل استخدام trim.
// إصلاح الخطأ "Property 'totalAfterTaxInRiyal' does not exist on type 'PriceOffer'":
// سنستخدم totalInYR بدلاً من totalAfterTaxInRiyal.

// ---------------------------------
// ما تم عمله سابقا
// في صفحة المقارنة:
// تم تعديل عرض رقم طلب الشراء ليظهر بدون رقم 1.
// تم إظهار إجمالي التكلفة التقديرية بالعملة المدخلة.
// تم إظهار التكلفة التقديرية على مستوى الأصناف في جدول مقارنة عروض الموردين.
// تم إظهار قيمة حقل "إجمالي مبلغ العرض" حتى لو لم يتم إدخال تفاصيل أسعار الأصناف.
// تم التأكد من حفظ جميع مبالغ العروض حتى لو كانت العروض أكثر من ثلاثة.
// تم إصلاح الكود لضمان ظهور المواصفات المقدمة من الموردين في صفحة المقارنة.
// تم إظهار المواصفات في جدول مقارنة المواصفات وفي ملاحظات الاختلافات.
// تمت إضافة ملاحظات توضح الفرق بين التكلفة التقديرية والمبلغ المقدم ونسبة الزيادة أو النقصان.
















// =========================================
// // purchases_alamin7 - المعدل-التفصيلي-نسخة5\src\components\ComparisonPage.tsx


// import React, { useState, useEffect } from 'react';
// import { usePurchaseOrder } from '../context/PurchaseOrderContext';
// import { formatNumberWithCommas } from '../utils/numberToWords';

// export const ComparisonPage: React.FC = () => {
//   const {
//     poNumber, // أضف هذا المتغير من الـ context
//     priceOffers,
//     poItems,
//     // استيراد الدوال اللازمة للحفظ في قاعدة البيانات
//     savePurchaseOrder,
//     updatePriceOffer,
//     // إضافة بيانات المواصفات والتكلفة التقديرية
//     estimatedCosts,
//     setEstimatedCosts,
//     itemSpecifications,
//     setItemSpecifications
//   } = usePurchaseOrder();

//   // حالة لتخزين التكاليف التقديرية المؤقتة قبل الحفظ
//   const [tempEstimatedCosts, setTempEstimatedCosts] = useState<{ [key: number]: number }>({});
//   // حالة لتخزين المواصفات المؤقتة قبل الحفظ
//   const [tempSpecifications, setTempSpecifications] = useState<{ [key: number]: string }>({});

//   // تهيئة الحالة عند تحميل المكون
//   useEffect(() => {
//     // تهيئة التكاليف التقديرية من قاعدة البيانات إذا كانت موجودة
//     if (estimatedCosts && Object.keys(estimatedCosts).length > 0) {
//       setTempEstimatedCosts(estimatedCosts);
//     } else {
//       // إنشاء تكاليف تقديرية افتراضية إذا لم تكن موجودة
//       const defaultCosts = poItems.reduce((acc, item) => {
//         acc[item.lineNumber] = 0;
//         return acc;
//       }, {} as { [key: number]: number });
//       setTempEstimatedCosts(defaultCosts);
//     }
//     // تهيئة المواصفات من قاعدة البيانات إذا كانت موجودة
//     if (itemSpecifications && Object.keys(itemSpecifications).length > 0) {
//       setTempSpecifications(itemSpecifications);
//     } else {
//       // إنشاء مواصفات افتراضية إذا لم تكن موجودة
//       const defaultSpecs = poItems.reduce((acc, item) => {
//         acc[item.lineNumber] = '';
//         return acc;
//       }, {} as { [key: number]: string });
//       setTempSpecifications(defaultSpecs);
//     }
//   }, [poItems, estimatedCosts, itemSpecifications]);

//   // إضافة useEffect جديد لتحديث المواصفات فورًا عند تغييرها
//   useEffect(() => {
//     // التحقق من وجود مواصفات في عروض الأسعار وتحديثها فورًا
//     if (priceOffers && priceOffers.length > 0) {
//       console.log("تحديث المواصفات في صفحة المقارنة");
//       // إجبار إعادة العرض لضمان ظهور المواصفات المحدثة
//       const temp = [...priceOffers];
//       // هذا مجرد تحديث بسيط لإجبار إعادة العرض
//       temp.forEach(offer => {
//         if (offer.lineItems) {
//           offer.lineItems.forEach(item => {
//             if (item.vendorSpecifications) {
//               // التأكد من أن المواصفات محدثة
//               item.vendorSpecifications = { ...item.vendorSpecifications };
//             }
//           });
//         }
//       });
//     }
//   }, [priceOffers, poItems]);

//   // إضافة useEffect لمراقبة تغيرات المواصفات
//   // إضافة هذا الـ useEffect في صفحة المقارنة
// useEffect(() => {
//   // تحديث المواصفات عند تغيير عروض الأسعار
//   const updateSpecifications = () => {
//     // يمكن إضافة منطق لتحديث المواصفات هنا إذا لزم الأمر
//   };
  
//   updateSpecifications();
// }, [priceOffers, poItems]);

//   // دالة للحصول على التكلفة التقديرية لصنف معين مع العملة
//   const getEstimatedCostForItem = (lineNumber: number) => {
//     const item = poItems.find(item => item.lineNumber === lineNumber);
//     if (!item || !item.estimatedCost) {
//       return { amount: 0, currency: 'ريال' };
//     }
//     return {
//       amount: item.estimatedCost.amount || 0,
//       currency: item.estimatedCost.currency || 'ريال'
//     };
//   };

//   // دالة لحساب إجمالي التكلفة التقديرية بالعملة الأصلية
//   const getTotalEstimatedCost = () => {
//     // سنحسب الإجمالي لكل عملة على حدة
//     const totalsByCurrency: { [currency: string]: number } = {};

//     poItems.forEach(item => {
//       if (item.estimatedCost && item.estimatedCost.amount > 0) {
//         const currency = item.estimatedCost.currency || 'ريال';
//         const amount = item.estimatedCost.amount * item.quantity;
//         totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
//       }
//     });

//     // إذا كان هناك عملة واحدة فقط، نرجع المبلغ والعملة
//     const currencies = Object.keys(totalsByCurrency);
//     if (currencies.length === 1) {
//       return {
//         amount: totalsByCurrency[currencies[0]],
//         currency: currencies[0]
//       };
//     }

//     // إذا كان هناك أكثر من عملة، نرجع المجموع بالريال
//     const totalInRiyal = Object.entries(totalsByCurrency).reduce((total, [currency, amount]) => {
//       if (currency === 'ريال') {
//         return total + amount;
//       }
//       // البحث عن سعر الصرف
//       const offerWithRate = priceOffers.find(offer =>
//         offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
//       );
//       const exchangeRate = offerWithRate?.exchangeRate || 1;
//       return total + (amount * exchangeRate);
//     }, 0);

//     return {
//       amount: totalInRiyal,
//       currency: 'ريال'
//     };
//   };

//   // دالة لحساب المعادل بالريال لكل صنف (تستخدم فقط إذا كان هناك سعر صرف)
//   const getEquivalentInRiyalForItem = (lineNumber: number) => {
//     const item = poItems.find(item => item.lineNumber === lineNumber);
//     if (!item || !item.estimatedCost) {
//       return 0;
//     }

//     const { amount, currency } = item.estimatedCost;
//     if (currency === 'ريال') {
//       // return amount * item.quantity;  // هذا السطر يحسب المعادل بالريال لاجمالي الكمية الخاصة بالسطر 
//       // يعدل السطر السابق لحساب سعر الوحدة الوادة فقط كما يلي 
//       // =============================
//       // فقط سعر الوحدة، بدون الكمية
//       return amount ?? 0;
//       // =================================
//     }

//     // البحث عن سعر الصرف
//     const offerWithRate = priceOffers.find(offer =>
//       offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
//     );

//     if (offerWithRate && offerWithRate.exchangeRate) {
//       // return (amount * item.quantity) * offerWithRate.exchangeRate;  // هذا السطر يحسب المعادل بالريال لاجمالي الكمية الخاصة بالسطر
//       // يعدل السطر السابق لحساب سعر الوحدة الوادة فقط كما يلي 
//       // ======================================
//       // سعر الوحدة × سعر الصرف
//       return (amount ?? 0) * offerWithRate.exchangeRate;
//       // ====================================
//     }

//     return 0; // لا يوجد سعر صرف، نرجع 0
//   };

//   // دالة لحساب أقل سعر معادل بالريال لكل صنف
//   const getMinPriceInRiyal = (lineNumber: number) => {
//     const validPrices = priceOffers
//       .map(offer => {
//         const lineItem = offer.lineItems?.find(li =>
//           li.lineNumber === lineNumber || li.name === poItems.find(item => item.lineNumber === lineNumber)?.name
//         );
//         const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
//         const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
//         return unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : null;
//       })
//       .filter(price => price !== null) as number[];
//     return validPrices.length > 0 ? Math.min(...validPrices) : 0;
//   };

//   // دالة للحصول على مواصفات المورد لصنف معين
//   // const getVendorSpecification = (vendor: string, lineNumber: number) => {
//   //   const offer = priceOffers.find(o => o.vendor === vendor);
//   //   if (!offer || !offer.lineItems) return '';
//   //   const lineItem = offer.lineItems.find(li =>
//   //     li.lineNumber === lineNumber || li.name === poItems.find(item => item.lineNumber === lineNumber)?.name
//   //   );

//   //   // تحسين عرض المواصفات - التأكد من عرض جميع المواصفات المقدمة
//   //   if (lineItem?.vendorSpecifications) {
//   //     const specs = lineItem.vendorSpecifications;
//   //     if (typeof specs === 'object' && specs !== null) {
//   //       return Object.entries(specs)
//   //         .filter(([key, value]) => value !== null && value !== undefined && String(value).trim() !== '')
//   //         .map(([key, value]) => `• ${key}: ${value}`)
//   //         .join('<br />');
//   //     } else if (typeof specs === 'string' && specs.trim() !== '') {
//   //       return specs;
//   //     }
//   //   }

//   //   // إذا لم يتم العثور على مواصفات، عرض أي معلومات متاحة من الصنف
//   //   if (lineItem && Object.keys(lineItem).length > 0) {
//   //     const otherInfo = [];
//   //     // التحقق من وجود الخصائص قبل الوصول إليها
//   //     if ('description' in lineItem && lineItem.description) otherInfo.push(`الوصف: ${lineItem.description}`);
//   //     if ('brand' in lineItem && lineItem.brand) otherInfo.push(`الماركة: ${lineItem.brand}`);
//   //     if ('model' in lineItem && lineItem.model) otherInfo.push(`الموديل: ${lineItem.model}`);
//   //     if ('origin' in lineItem && lineItem.origin) otherInfo.push(`بلد المنشأ: ${lineItem.origin}`);
//   //     // إضافة خصائص إضافية قد تكون موجودة
//   //     if ('warranty' in lineItem && lineItem.warranty) otherInfo.push(`الضمان: ${lineItem.warranty}`);
//   //     if ('color' in lineItem && lineItem.color) otherInfo.push(`اللون: ${lineItem.color}`);
//   //     if ('size' in lineItem && lineItem.size) otherInfo.push(`الحجم: ${lineItem.size}`);
//   //     if ('material' in lineItem && lineItem.material) otherInfo.push(`المادة: ${lineItem.material}`);
//   //     if ('dimensions' in lineItem && lineItem.dimensions) otherInfo.push(`الأبعاد: ${lineItem.dimensions}`);
//   //     if ('weight' in lineItem && lineItem.weight) otherInfo.push(`الوزن: ${lineItem.weight}`);

//   //     if (otherInfo.length > 0) {
//   //       return otherInfo.map(info => `• ${info}`).join('<br />');
//   //     }
//   //   }

//   //   // إذا لم يتم العثور على أي معلومات، إرجاع رسالة مناسبة
//   //   return 'لا توجد مواصفات متاحة';
//   // };

//   // تعديل دالة عرض المواصفات في صفحة المقارنة
//   // دالة للحصول على مواصفات المورد لصنف معين
//   const getVendorSpecification = (vendor: string, lineNumber: number) => {
//     const offer = priceOffers.find(o => o.vendor === vendor);
//     if (!offer) return '';

//     const lineItem = offer.lineItems?.find(li => li.lineNumber === lineNumber);
//     if (!lineItem) return '';

//     // تحسين عرض المواصفات - التأكد من عرض جميع المواصفات المقدمة
//     if (lineItem.vendorSpecifications) {
//       const specs = lineItem.vendorSpecifications;

//       // التأكد من أن المواصفات كائن وليست فارغة
//       if (typeof specs === 'object' && specs !== null && Object.keys(specs).length > 0) {
//         return Object.entries(specs)
//           .filter(([key, value]) => {
//             // التأكد من أن القيمة ليست null أو undefined أو فارغة
//             return value !== null && value !== undefined && String(value).trim() !== '';
//           })
//           .map(([key, value]) => `• ${key}: ${value}`)
//           .join('<br />');
//       }
//     }

//     // إضافة محاولة بديلة للبحث عن المواصفات إذا لم يتم العثور عليها بالطريقة العادية
//     // هذا يضمن عرض المواصفات حتى لو تم حفظها بتنسيق مختلف
//     if (lineItem && typeof lineItem === 'object') {
//       // البحث عن أي خصائص قد تحتوي على مواصفات
//       for (const key in lineItem) {
//         if (key.includes('spec') || key.includes('Specification')) {
//           const specValue = (lineItem as any)[key];
//           if (specValue && typeof specValue === 'object' && Object.keys(specValue).length > 0) {
//             return Object.entries(specValue)
//               .filter(([_, value]) => value !== null && value !== undefined && String(value).trim() !== '')
//               .map(([key, value]) => `• ${key}: ${value}`)
//               .join('<br />');
//           }
//         }
//       }
//     }

//     // إذا لم يتم العثور على مواصفات، عرض أي معلومات متاحة من الصنف
//     if (lineItem && Object.keys(lineItem).length > 0) {
//       const otherInfo = [];

//       // التحقق من وجود الخصائص قبل الوصول إليها
//       if ('description' in lineItem && lineItem.description) otherInfo.push(`الوصف: ${lineItem.description}`);
//       if ('brand' in lineItem && lineItem.brand) otherInfo.push(`الماركة: ${lineItem.brand}`);
//       if ('model' in lineItem && lineItem.model) otherInfo.push(`الموديل: ${lineItem.model}`);
//       if ('origin' in lineItem && lineItem.origin) otherInfo.push(`بلد المنشأ: ${lineItem.origin}`);
//       if ('warranty' in lineItem && lineItem.warranty) otherInfo.push(`الضمان: ${lineItem.warranty}`);
//       if ('color' in lineItem && lineItem.color) otherInfo.push(`اللون: ${lineItem.color}`);
//       if ('size' in lineItem && lineItem.size) otherInfo.push(`الحجم: ${lineItem.size}`);
//       if ('material' in lineItem && lineItem.material) otherInfo.push(`المادة: ${lineItem.material}`);
//       if ('dimensions' in lineItem && lineItem.dimensions) otherInfo.push(`الأبعاد: ${lineItem.dimensions}`);
//       if ('weight' in lineItem && lineItem.weight) otherInfo.push(`الوزن: ${lineItem.weight}`);

//       if (otherInfo.length > 0) {
//         return otherInfo.map(info => `• ${info}`).join('<br />');
//       }
//     }

//     // إذا لم يتم العثور على أي معلومات، إرجاع رسالة مناسبة
//     return 'لا توجد مواصفات متاحة';
//   };

//   // دالة للحصول على المواصفات المطلوبة لصنف معين
//   const getRequiredSpecifications = (lineNumber: number) => {
//     const item = poItems.find(item => item.lineNumber === lineNumber);
//     if (!item?.specifications) return '';
//     return Object.entries(item.specifications)
//       .filter(([key, value]) => value && typeof value === 'string' && value.trim() !== '')
//       .map(([key, value]) => `• ${key}: ${value}`)
//       .join('<br />');
//   };

//   // دالة لتحويل المبلغ إلى الريال اليمني
//   const convertToYemeniRiyal = (amount: number, currency: string) => {
//     if (currency === 'ريال يمني' || currency === 'ريال') return amount;

//     // البحث عن سعر الصرف من عروض الأسعار
//     const offerWithRate = priceOffers.find(offer =>
//       offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
//     );

//     if (offerWithRate && offerWithRate.exchangeRate) {
//       return amount * offerWithRate.exchangeRate;
//     }

//     return amount; // إذا لم يتم العثور على سعر صرف
//   };

//   // دالة لحساب إجمالي عرض المورد بالعملة الأصلية
//   const getVendorTotalOffer = (vendor: string) => {
//     const offer = priceOffers.find(o => o.vendor === vendor);
//     if (!offer) return 0;   // تعديل: إرجاع 0 إذا لم يتم العثور على العرض

//     // استخدام totalAfterTax إذا كان موجودًا، وإلا حسابه من lineItems
//     if (offer.totalAfterTax) {
//       return offer.totalAfterTax;
//     }

//     // استخدام total إذا كان موجودًا
//     if (offer.total) {
//       return offer.total;
//     }

//     // إذا لم يوجد أي من الحقول السابقة، نحسب من lineItems
//     if (offer.lineItems) {
//       return offer.lineItems.reduce((total, lineItem) => {
//         const poItem = poItems.find(item =>
//           item.lineNumber === lineItem.lineNumber || item.name === lineItem.name
//         );
//         if (!poItem) return total;
//         const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
//         return total + (unitPriceAfterTax * (lineItem.offeredQty || poItem.quantity));
//       }, 0);
//     }

//     // إذا لم يكن هناك أي شيء، نرجع المبلغ الأصلي
//     return offer.amount || 0;
//   };

//   // دالة لحساب إجمالي عرض المورد بالريال اليمني
//   const getVendorTotalOfferInRiyal = (vendor: string) => {
//     const offer = priceOffers.find(o => o.vendor === vendor);
//     if (!offer) return 0;    // تعديل: إرجاع 0 إذا لم يتم العثور على العرض

//     // استخدام totalInYR إذا كان موجودًا
//     if (offer.totalInYR) {
//       return offer.totalInYR;
//     }

//     // حسابه من البيانات المتاحة
//     const total = getVendorTotalOffer(vendor);
//     const currency = getVendorCurrency(vendor);

//     if (currency === 'ريال') {
//       return total;
//     }

//     const exchangeRate = offer.exchangeRate || 1;
//     return total * exchangeRate;
//   };

//   // دالة للحصول على عملة المورد
//   const getVendorCurrency = (vendor: string) => {
//     const offer = priceOffers.find(o => o.vendor === vendor);
//     return offer?.currency || 'ريال';
//   };

//   // دالة للحصول على ملاحظات الاختلافات بين المواصفات المطلوبة والمقدمة
//   const getSpecificationDifferences = (vendor: string) => {
//     const offer = priceOffers.find(o => o.vendor === vendor);
//     if (!offer) return '';
//     let differences = '';

//     poItems.forEach(item => {
//       const requiredSpecs = getRequiredSpecifications(item.lineNumber);
//       const vendorSpecs = getVendorSpecification(vendor, item.lineNumber);

//       // الحصول على التكلفة التقديرية والسعر المقدم
//       const estimatedCostInfo = getEstimatedCostForItem(item.lineNumber);
//       const estimatedCost = estimatedCostInfo.amount;
//       const estimatedCurrency = estimatedCostInfo.currency;

//       const lineItem = offer.lineItems?.find(li =>
//         li.lineNumber === item.lineNumber || li.name === item.name
//       );
//       const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
//       const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
//       const unitPriceInRiyal = unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : 0;
//       const offeredTotal = unitPriceInRiyal * (lineItem?.offeredQty || item.quantity);
//       const estimatedTotal = estimatedCost * item.quantity;

//       // حساب نسبة الفرق
//       let priceDifference = '';
//       let priceStatus = '';
//       if (estimatedTotal > 0 && offeredTotal > 0) {
//         const percentageDiff = ((offeredTotal - estimatedTotal) / estimatedTotal) * 100;
//         if (Math.abs(percentageDiff) < 0.01) {
//           priceStatus = 'مطابق';
//         } else if (percentageDiff > 0) {
//           priceStatus = `أعلى بنسبة ${percentageDiff.toFixed(2)}%`;
//         } else {
//           priceStatus = `أقل بنسبة ${Math.abs(percentageDiff).toFixed(2)}%`;
//         }
//         priceDifference = `<p><strong>الفرق في السعر:</strong> ${priceStatus}</p>`;
//       }

//       // التحقق من المواصفات
//       if (!vendorSpecs || (typeof vendorSpecs === 'string' && vendorSpecs.trim() === '')) {
//         differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> لم يقدم المورد مواصفات</p>`;
//         differences += priceDifference;
//       } else if (!requiredSpecs || requiredSpecs.trim() === '') {
//         differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> لا توجد مواصفات مطلوبة للمقارنة</p>`;
//         differences += priceDifference;
//       } else if (requiredSpecs === vendorSpecs) {
//         differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> المواصفات مطابقة</p>`;
//         differences += priceDifference;
//       } else {
//         differences += `<p><strong>الصنف ${item.lineNumber} - ${item.name}:</strong> المواصفات غير مطابقة</p>`;
//         differences += `<div class="mr-4">`;
//         differences += `<p class="text-sm"><strong>المطلوب:</strong></p>`;
//         differences += `<p class="text-sm">${requiredSpecs}</p>`;
//         differences += `<p class="text-sm mt-2"><strong>المقدم:</strong></p>`;
//         differences += `<p class="text-sm">${vendorSpecs}</p>`;
//         differences += `</div>`;
//         differences += priceDifference;
//       }
//     });

//     // إضافة ملاحظة عن وجود خطأ في إجمالي مبلغ العرض إذا كانت موجودة
//     if (offer.notes && offer.notes.includes('يوجد اختلاف بين إجمالي مبلغ العرض وإجمالي أسعار الأصناف')) {
//       differences += `<p><strong>ملاحظة هامة:</strong> هناك خطأ في إجمالي مبلغ العرض</p>`;
//     }

//     return differences;
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-4 print:shadow-none print:p-2 border border-gray-200 print:landscape">
//       <h2 className="text-lg font-semibold mb-4 text-right">مقارنة عروض الموردين</h2>

//       {/* جدول مقارنة إجمالية للعروض */}
//       <div className="overflow-x-auto mb-8">
//         <table className="w-full border-collapse border border-gray-300 text-sm">
//           <thead>
//             {/* عنوان رئيسي للجدول */}
//             <tr className="bg-gray-100">
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10" colSpan={4}>
//                 <div className="text-sm font-semibold">بيانات طلب الشراء</div>
//               </th>
//               {priceOffers.map((offer, idx) => (
//                 <th
//                   key={`vendor-${offer.id}`}
//                   colSpan={3}
//                   className={`border-2 border-gray-400 p-2 text-center w-6/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
//                 >
//                   <div className="text-sm font-semibold">{offer.vendor || `العرض ${idx + 1}`}</div>
//                 </th>
//               ))}
//             </tr>
//             {/* عناوين الأعمدة */}
//             <tr className="bg-gray-100">
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">رقم الطلب</th>
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">إجمالي التكلفة التقديرية</th>
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">العملة</th>
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">المبلغ المعادل بالريال</th>
//               {priceOffers.map((offer, idx) => (
//                 <React.Fragment key={`total-h-${offer.id}`}>
//                   <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
//                     <div className="text-xs font-medium">إجمالي مبلغ العرض</div>
//                   </th>
//                   <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
//                     <div className="text-xs font-medium">العملة</div>
//                   </th>
//                   <th className={`border-2 border-gray-400 p-2 text-center w-2/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}>
//                     <div className="text-xs font-medium">المبلغ المعادل بالريال</div>
//                   </th>
//                 </React.Fragment>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               {/* تعديل: إظهار رقم طلب الشراء فقط بدون إضافة رقم 1 */}
//               <td className="border border-gray-300 p-2 text-center">{poNumber}</td>
//               <td className="border border-gray-300 p-2 text-center">
//                 {formatNumberWithCommas(getTotalEstimatedCost().amount)} {getTotalEstimatedCost().currency}
//               </td>
//               <td className="border border-gray-300 p-2 text-center">{getTotalEstimatedCost().currency}</td>
//               <td className="border border-gray-300 p-2 text-center">
//                 {formatNumberWithCommas(convertToYemeniRiyal(getTotalEstimatedCost().amount, getTotalEstimatedCost().currency))}
//               </td>
//               {priceOffers.map((offer, idx) => {
//                 const vendorTotal = getVendorTotalOffer(offer.vendor);
//                 const vendorTotalInRiyal = getVendorTotalOfferInRiyal(offer.vendor);
//                 const currency = getVendorCurrency(offer.vendor);
//                 return (
//                   <React.Fragment key={`total-r-${offer.id}`}>
//                     <td className="border border-gray-300 p-2 text-center">{formatNumberWithCommas(vendorTotal)}</td>
//                     <td className="border border-gray-300 p-2 text-center">{currency}</td>
//                     <td className="border border-gray-300 p-2 text-center">{formatNumberWithCommas(vendorTotalInRiyal)}</td>
//                   </React.Fragment>
//                 );
//               })}
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* جدول مقارنة الأسعار */}
//       <h2 className="text-lg font-semibold mb-4 text-right">مقارنة عروض الموردين تفصيلي</h2>
//       <div className="overflow-x-auto mb-8">
//         <table className="w-full border-collapse border border-gray-300 text-sm">
//           <thead>
//             {/* عنوان رئيسي للأصناف والكميات المطلوبة */}
//             <tr className="bg-gray-100">
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-1/10" colSpan={5}>
//                 <div className="text-sm font-semibold">الأصناف والكميات المطلوبة</div>
//               </th>
//               {priceOffers.map((offer, idx) => (
//                 <th
//                   key={`vh-${offer.id}`}
//                   colSpan={3}
//                   className={`border-2 border-gray-400 p-2 text-center w-3/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
//                 >
//                   <div className="text-xs font-medium">{offer.vendor || `العرض ${idx + 1}`}</div>
//                 </th>
//               ))}
//             </tr>
//             {/* عناوين الأعمدة */}
//             <tr className="bg-gray-50">
//               <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-1/10">السطر</th>
//               <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-5/10">الصنف</th>
//               <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">الكمية</th>
//               <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">التكلفة التقديرية</th>
//               <th className="border border-gray-300 p-1 text-center text-xs bg-gray-200 w-2/10">المعادل بالريال</th>
//               {priceOffers.map((offer, idx) => (
//                 <React.Fragment key={`cols-${offer.id}`}>
//                   <th className={`border border-gray-300 p-1 text-center text-xs w-2/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
//                     الكمية المقدمة
//                   </th>
//                   <th className={`border border-gray-300 p-1 text-center text-xs w-3/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
//                     سعر الوحدة ({offer.currency || ''})
//                   </th>
//                   <th className={`border border-gray-300 p-1 text-center text-xs w-3/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}>
//                     سعر الوحدة (ريال)
//                   </th>
//                 </React.Fragment>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {poItems.map((item) => {
//               const estimatedCost = getEstimatedCostForItem(item.lineNumber);
//               const equivalentInRiyal = getEquivalentInRiyalForItem(item.lineNumber);
//               const minPriceInRiyal = getMinPriceInRiyal(item.lineNumber);

//               return (
//                 <tr key={`cmp-${item.lineNumber}`} className="hover:bg-gray-50">
//                   {/* معلومات الصنف الأساسية */}
//                   <td className="border border-gray-300 p-2 text-center w-1/10">{item.lineNumber}</td>
//                   <td className="border border-gray-300 p-2 w-5/10">{item.name}</td>
//                   <td className="border border-gray-300 p-2 text-center w-2/10">{item.quantity}</td>
//                   <td className="border border-gray-300 p-2 text-center w-2/10">
//                     {formatNumberWithCommas(estimatedCost.amount)} {estimatedCost.currency}
//                   </td>
//                   <td className="border border-gray-300 p-2 text-center w-2/10">
//                     {equivalentInRiyal > 0 ? formatNumberWithCommas(equivalentInRiyal) : '-'}
//                   </td>

//                   {/* عروض الموردين للصنف الحالي */}
//                   {priceOffers.map((offer, idx) => {
//                     const lineItem = offer.lineItems?.find(li =>
//                       li.lineNumber === item.lineNumber || li.name === item.name
//                     );
//                     const qty = lineItem?.offeredQty || '';
//                     const unitPriceAfterTax = (lineItem?.unitPriceAfterTax ?? lineItem?.unitPrice) || 0;
//                     const exchangeRate = offer.currency === 'ريال' ? 1 : (offer.exchangeRate || 0);
//                     const unitPriceInRiyal = unitPriceAfterTax && exchangeRate ? unitPriceAfterTax * exchangeRate : 0;

//                     // تحديد إذا كان هذا هو أقل سعر
//                     const isMinPrice = unitPriceInRiyal === minPriceInRiyal && unitPriceInRiyal > 0;

//                     return (
//                       <React.Fragment key={`row-${offer.id}-${item.lineNumber}`}>
//                         <td className="border border-gray-300 p-2 text-center w-2/10">{qty}</td>
//                         <td className="border border-gray-300 p-2 text-center w-3/10">
//                           {unitPriceAfterTax ? formatNumberWithCommas(unitPriceAfterTax) : ''}
//                         </td>
//                         <td className={`border border-gray-300 p-2 text-center w-3/10 ${isMinPrice ? 'bg-green-100 font-semibold' : ''}`}>
//                           {unitPriceInRiyal ? formatNumberWithCommas(unitPriceInRiyal) : ''}
//                         </td>
//                       </React.Fragment>
//                     );
//                   })}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* جدول مقارنة المواصفات */}
//       <h2 className="text-lg font-semibold mb-4 text-right mt-8">مقارنة المواصفات</h2>
//       <div className="overflow-x-auto mb-6">
//         <table className="w-full border-collapse border border-gray-300 text-sm">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-2/10">السطر</th>
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-3/10">الصنف</th>
//               <th className="border-2 border-gray-400 p-2 bg-gray-200 w-3/10">المواصفات المطلوبة</th>
//               {priceOffers.map((offer, idx) => (
//                 <th
//                   key={`spec-vh-${offer.id}`}
//                   className={`border-2 border-gray-400 p-2 text-center w-4/10 ${idx % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100'}`}
//                 >
//                   <div className="text-xs font-medium">{offer.vendor || `العرض ${idx + 1}`}</div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {poItems.map((item) => (
//               <tr key={`spec-${item.lineNumber}`} className="hover:bg-gray-50">
//                 <td className="border border-gray-300 p-2 text-center w-2/10">{item.lineNumber}</td>
//                 <td className="border border-gray-300 p-2 w-3/10">{item.name}</td>
//                 {/* <td className="border border-gray-300 p-2 w-3/10"> */}
//                   {/* عرض المواصفات المطلوبة من جدول الأصناف */}
//                   {/* <div
//                     className="text-sm p-2 bg-gray-50 rounded"
//                     dangerouslySetInnerHTML={{ __html: getRequiredSpecifications(item.lineNumber) || 'لا توجد مواصفات محددة' }}
//                   />
//                 </td> */}
//                 {/* تعديل كيفية عرض المواصفات في الجدول */}
//                  {/* في جدول مقارنة المواصفات، استخدم هذا الكود بدلاً من الكود الحالي */}
//                 <td className="border border-gray-300 p-2 w-3/10">
//                   <div
//                     className="text-sm p-2 bg-gray-50 rounded"
//                     dangerouslySetInnerHTML={{ 
//                       __html: getRequiredSpecifications(item.lineNumber) || 
//                             '<span class="text-gray-400">لا توجد مواصفات محددة</span>' 
//                     }}
//                   />
//                 </td>
//                 {/* عرض مواصفات الموردين */}
//                 {priceOffers.map((offer, idx) => (
//                   <td
//                     key={`spec-row-${offer.id}-${item.lineNumber}`}
//                     className={`border border-gray-300 p-2 w-4/10 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'}`}
//                   >
//                     {/* عرض مواصفات المورد */}
//                     <div
//                       className="text-sm"
//                       dangerouslySetInnerHTML={{
//                         __html: getVendorSpecification(offer.vendor, item.lineNumber) || 'لم يقدم مواصفات'
//                       }}
//                     />
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ملاحظات الاختلافات بين المواصفات لكل مورد */}
//       <div className="mt-6">
//         <h3 className="font-medium mb-2">ملاحظات الاختلافات في المواصفات:</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {priceOffers.map((offer, idx) => (
//             <div key={`notes-${offer.id}`} className="border border-gray-300 rounded p-3">
//               <h4 className="font-medium mb-2">{offer.vendor || `العرض ${idx + 1}`}</h4>
//               <div
//                 className="text-sm"
//                 dangerouslySetInnerHTML={{
//                   __html: getSpecificationDifferences(offer.vendor) || 'لا توجد اختلافات في المواصفات'
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* إضافة ملاحظات عامة تحت الجداول */}
//       <div className="mt-6">
//         <p className="font-medium">ملاحظات:</p>
//         <div className="border-b border-gray-300 border-dashed pb-1 mb-2"></div>
//       </div>
//     </div>
//   );
// };




// // ثانيا :في صفحة المقارنة


// //  في صفحه المقارنه يجب عمل الاتي
// // 1-
// // يجب ان تظهر المواصفات في صفحة المقارنة في جدول "مقارنة المواصفات" وفي "مقارنة المواصفات"
// // مباشرة بمجرد ادخالها في جدول عروض الأسعار

// // (بنفس الطريقة التي يتم اظهار عملة العروض)
// // 2-
// // ويجب ان تظل المواصفات محفوظة وظاهرة في جدول عروض الأسعار عند الضغط على زر المواصفات

// // 3-  يجب اصلاح الخطا الظاهر في الصفحه

// //  Property 'trim' does not exist on type 'never'.
// // ===============================================

// // // ما تم عمله

// // أولاً: تعديلات صفحة المقارنة
// // إظهار قيمة حقل "إجمالي مبلغ العرض (بعد الضرائب)":
// // سنعدل دالة getVendorTotalOffer لاستخدام totalAfterTax إذا كان موجودًا.
// // إظهار المواصفات مباشرة في صفحة المقارنة:
// // سنعدل دالة getVendorSpecification لعرض المواصفات فور إدخالها.
// // إصلاح الخطأ "Property 'trim' does not exist on type 'never'":
// // سنضيف تحققًا من النوع قبل استخدام trim.
// // إصلاح الخطأ "Property 'totalAfterTaxInRiyal' does not exist on type 'PriceOffer'":
// // سنستخدم totalInYR بدلاً من totalAfterTaxInRiyal.

// // ---------------------------------
// // ما تم عمله سابقا
// // في صفحة المقارنة:
// // تم تعديل عرض رقم طلب الشراء ليظهر بدون رقم 1.
// // تم إظهار إجمالي التكلفة التقديرية بالعملة المدخلة.
// // تم إظهار التكلفة التقديرية على مستوى الأصناف في جدول مقارنة عروض الموردين.
// // تم إظهار قيمة حقل "إجمالي مبلغ العرض" حتى لو لم يتم إدخال تفاصيل أسعار الأصناف.
// // تم التأكد من حفظ جميع مبالغ العروض حتى لو كانت العروض أكثر من ثلاثة.
// // تم إصلاح الكود لضمان ظهور المواصفات المقدمة من الموردين في صفحة المقارنة.
// // تم إظهار المواصفات في جدول مقارنة المواصفات وفي ملاحظات الاختلافات.
// // تمت إضافة ملاحظات توضح الفرق بين التكلفة التقديرية والمبلغ المقدم ونسبة الزيادة أو النقصان.