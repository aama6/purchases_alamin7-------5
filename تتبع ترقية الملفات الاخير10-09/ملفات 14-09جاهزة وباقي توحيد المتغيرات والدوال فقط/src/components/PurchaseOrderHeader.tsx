// src\components\PurchaseOrderHeader.tsx

import { Search, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { db } from '../utils/db';
import { excelUtils } from '../utils/excel';
import moment from 'moment';
import 'moment/dist/locale/ar-sa';

moment.locale('ar-sa');

export const PurchaseOrderHeader: React.FC = () => {
  // 🟢 استيراد جميع البيانات والوظائف اللازمة من السياق
  const {
    poNumber,
    setPoNumber,
    transactionNumber,
    setTransactionNumber,
    requesting,
    setRequesting,
    beneficiary,
    setBeneficiary,
    purchaseMethod,
    setPurchaseMethod,
    setPriceOffers,
    loadPurchaseOrder,
    savePurchaseOrder,
    isPreliminaryPrint,  // لتحقق هل الطباعة اولية او نهائية
    clearAllFields,
    hasUnsavedChanges,
    isDataSaved,
    purchaseOrder,
    priceOffers,
    getSalutationForPrint,
    shouldShowPreliminarySignature,
    calculateMaxOfferAmountInYR,
  } = usePurchaseOrder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // خيار مسار الاستيراد: افتراضي أو آخر
  const [routeOption, setRouteOption] = useState<'افتراضي' | 'آخر'>('افتراضي');

  const validateTransactionNumber = (value: string) => {
    return /^[0-9-]*$/.test(value);
  };

  const handleTransactionNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateTransactionNumber(value)) {
      setTransactionNumber(value);
    }
  };

  const handleTransactionQuery = async () => {
    if (!transactionNumber.trim()) {
      setError('الرجاء إدخال رقم المعاملة');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const existingPO = await db.getPurchaseOrderByTransaction(transactionNumber);

      if (existingPO) {
        await loadPurchaseOrder(existingPO);
        setError('');
        setSuccess(`تم استرجاع بيانات طلب الشراء رقم: ${existingPO.po_number}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('رقم المعاملة غير موجود في قاعدة البيانات');
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث عن رقم المعاملة');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoNumber = e.target.value;
    setPoNumber(newPoNumber);

    if (newPoNumber !== poNumber) {
      if (hasUnsavedChanges && !isDataSaved) {
        console.warn('يوجد بيانات غير محفوظة، هل تريد المتابعة وفقدان التغييرات؟');
      }
      clearAllFields();
    }
  };

  // دالة استيراد بيانات طلب الشراء من ملف Excel
  const handleQueryImport = async () => {
    if (!poNumber.trim()) {
      setError('الرجاء إدخال رقم طلب الشراء');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // البحث في قاعدة البيانات
      const existingPO = await db.getPurchaseOrder(poNumber);

      if (existingPO) {
        // تم العثور على طلب الشراء
        await loadPurchaseOrder(existingPO);
        setError('');
        setSuccess(`تم استرجاع بيانات طلب الشراء رقم: ${existingPO.po_number}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // طلب الشراء غير موجود
        if (confirm('طلب الشراء غير موجود، هل تريد استيراده من ملف Excel؟')) {
          // تحديد مصدر الاستيراد بناءً على اختيار "المسار"
          try {
            if (routeOption === 'افتراضي') {
              const FIXED_PATH = 'G:\\طلبات الشراء\\طلبات الشراءالرقم2 المسلسل من 11200 إلى 11347.xlsx';
              const jsonData = await excelUtils.readExcelFromPath(FIXED_PATH);
              const poData = excelUtils.extractPurchaseOrder(jsonData, poNumber);
              if (poData) {
                await loadPurchaseOrder(poData);
                setSuccess(`تم استيراد بيانات طلب الشراء رقم: ${poData.po_number}`);
                setTimeout(() => setSuccess(''), 3000);
              }
            } else {
              // فتح متصفح الملفات كما هو حالياً
              fileInputRef.current?.click();
            }
          } catch (e: any) {
            // في حال عدم دعم القراءة المباشرة من المسار (بيئة غير Electron)
            console.warn('فشل الاستيراد من المسار الافتراضي، سيتم فتح اختيار ملف يدوياً:', e?.message || e);
            fileInputRef.current?.click();
          }
        }
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث عن طلب الشراء');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // التعامل مع مفتاح Enter في حقل رقم طلب الشراء
  const handlePoNumberKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQueryImport();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const excelData = await excelUtils.readExcelFile(file);
      const poData = excelUtils.extractPurchaseOrder(excelData, poNumber);

      if (poData) {
        await loadPurchaseOrder(poData);
        setError('');
        setSuccess(`تم استيراد بيانات طلب الشراء رقم: ${poData.po_number}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قراءة الملف');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = async () => {
    if (hasUnsavedChanges && !isDataSaved) {
      console.warn('لم يتم حفظ البيانات، هل تريد المسح؟');
    }

    setPoNumber('');
    clearAllFields();
    setError('');
    setSuccess('');
  };

  // دالة التاريخ
  const displayDate = new Date().toLocaleString('ar', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  // دالة التحقق من إمكانية الطباعة النهائية
  const canFinalPrint = () => {
    return !isPreliminaryPrint && purchaseMethod !== '';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 print:shadow-none print:p-0 print:m-0 border border-gray-200 print-container">
      {/* المستطيل الخاص بالحقول */}
      <div className="border border-gray-300 rounded-lg p-4 print:border-0 print:p-0 print:m-0 print:w-full bg-gray-50 print:bg-white">

        {/* شبكة من ثلاثة أعمدة: يمين (ثابت) - وسط (تلقائي للمسار) - يسار (ثابت) */}
        <div className="grid grid-cols-[1.5fr_auto_1.2fr] gap-24 items-start justify-between">

          {/* الجانب الأيمن - 3 حقول */}
          <div className="space-y-3 print:space-y-0">

            {/* حقل طلب الشراء */}
            <div className="flex items-center gap-1">
              <label className="w-22 text-sm text-gray-700 font-medium">رقم طلب الشراء:</label>
              <div className="flex-1 flex items-center gap-1 flex-nowrap">
                <input
                  type="text"
                  value={poNumber}
                  onChange={handlePoNumberChange}
                  onKeyPress={handlePoNumberKeyPress}
                  className="w-32 h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors print:h-6 print:border"
                  placeholder="أدخل الرقم"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
                <button
                  onClick={handleQueryImport}
                  disabled={loading}
                  className="h-9 px-4 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span>جاري...</span>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>استعلام/استيراد</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* حقل الجهة الطالبة */}
            <div className="flex items-center gap-1">
              <label className="w-22 text-sm text-gray-700 font-medium">الجهة الطالبة:</label>
              <div className="w-38 h-9 border border-gray-300 rounded-md flex items-center print:h-6">
                <input
                  type="text"
                  value={requesting}
                  onChange={(e) => setRequesting(e.target.value)}
                  className="w-full h-full rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="الجهة الطالبة"
                  // ✅ إضافة معالج لحفظ التغييرات
                  onBlur={() => {
                    console.log('🟢 تم تحديث الجهة الطالبة:', requesting);
                  }}
                />
              </div>
            </div>

            {/* حقل الجهة المستفيدة */}
            <div className="flex items-center gap-1">
              <label className="w-22 text-sm text-gray-700 font-medium">الجهة المستفيدة:</label>
              <div className="w-48 h-9 border border-gray-300 rounded-md flex items-center print:h-6">
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full h-full rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="الجهة المستفيدة"
                />
              </div>
            </div>
          </div>

          {/* العمود الأوسط - حقل المسار فقط */}
          <div className="print:hidden flex items-center justify-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">المسار:</label>
              <select
                value={routeOption}
                onChange={(e) => setRouteOption(e.target.value as 'افتراضي' | 'آخر')}
                className="h-8 text-sm border border-gray-300 rounded px-2"
              >
                <option value="افتراضي">افتراضي</option>
                <option value="آخر">آخر</option>
              </select>
            </div>
          </div>

          {/* الجانب الأيسر - حقول */}
          <div className="flex flex-col items-end space-y-3 print:space-y-0 print:items-end">

            {/* حقل التاريخ */}
            <div className="flex items-center gap-1 print:self-end">
              <label className="w-20 text-sm text-gray-700 font-medium text-left">التاريخ:</label>
              <div className="w-32 h-9 border border-gray-300 rounded-md px-3 text-sm bg-gray-100 flex items-center print:h-6 text-left">
                <span style={{ fontFamily: 'Arial, sans-serif' }}>
                  {displayDate}
                </span>
              </div>
            </div>

            {/* حقل رقم المعاملة */}
            <div className="flex items-center gap-1 print:self-end">
              <label className="w-20 text-sm text-gray-700 font-medium text-left">رقم المعاملة:</label>
              <div className="w-32 h-9 border border-gray-300 rounded-md mb-1 flex items-center print:h-6">
                <input
                  type="text"
                  value={transactionNumber}
                  onChange={handleTransactionNumberChange}
                  className="w-32 h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors print:h-6  print:border text-center"
                  placeholder="رقم المعاملة"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
              </div>
            </div>

            {/* حقل طريقة الشراء */}
            <div className="flex items-center gap-1">
              <label className="w-20 text-sm text-gray-700 font-medium text-left">طريقة الشراء:</label>
              <div className="w-32 h-9 border border-gray-300 rounded-md mb-1 flex items-center print:h-6 print:border-0">
                {/* الإدخال أثناء العرض */}
                <select
                  value={purchaseMethod}
                  onChange={async (e) => {
                    setPurchaseMethod(e.target.value);
                    // حفظ فوري لضمان التخزين في القاعدة واسترجاعه لاحقًا
                    await savePurchaseOrder();
                  }}
                  className="w-full h-full rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors print:hidden"
                  disabled={isPreliminaryPrint}
                >
                  <option value="">اختر</option>
                  <option value="موردين">موردين</option>
                  <option value="مندوبين">مندوبين</option>
                </select>
                {/* العرض أثناء الطباعة */}
                <div className="hidden print:block w-full text-sm px-1 text-left">
                  {purchaseMethod || '—'}
                </div>
              </div>
            </div>
            {/* رسالة خطأ إذا لم يتم تحديد طريقة الشراء في الطباعة النهائية */}
            {!purchaseMethod && !isPreliminaryPrint && (
              <div className="text-red-500 text-xs mt-1 print:hidden">يجب تحديد طريقة الشراء للطباعة النهائية</div>
            )}

            {/* الأزرار في سطر واحد تحت الحقل */}
            <div className="flex gap-1">
              <button
                onClick={handleTransactionQuery}
                disabled={loading}
                className="flex-1 px-2 h-8 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Search size={14} />
                <span>بحث</span>
              </button>

              <button
                onClick={handleClear}
                className="flex-1 px-2 h-8 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Trash2 size={14} />
                <span>مسح</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* النص الثابت للطباعة النهائية - في مستطيل منفصل */}
        {/* النص الثابت للطباعة النهائية */}
        {!isPreliminaryPrint && canFinalPrint() && (
          <div className="hidden print:block border border-gray-300 rounded-lg p-4 mt-2 print:mt-0">
            <p className="font-medium flex justify-between">
              <span>{getSalutationForPrint()}</span>
              <span>المحترم</span>
            </p>
            <p>تحية طيبة وبعد</p>
            <p>بناء على البيانات الموضحه اعلاه فقد تم القيام بالاجراءات التالية</p>
          </div>
        )}

        {/* رسائل النجاح والخطأ */}
        {success && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-600 font-medium">{success}</div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600 font-medium">{error}</div>
          </div>
        )}

        {/* رسالة تحذيرية عند محاولة الطباعة النهائية بدون تحديد طريقة الشراء */}
        {!isPreliminaryPrint && !canFinalPrint() && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-600 font-medium">يجب تحديد طريقة الشراء للطباعة النهائية</div>
          </div>
        )}

         {/* إدخال ملف اكسل */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* علامة الطباعة الأولية */}
      </div>
    </div>
  );
};



// انشئ حقل صغير تحت رقم المعاملة باسم طريقة الشراء يتكون من خيارين "موردين" أو "مندوبين"
// وقيمته الافتراضي قارغاً ويكون الزامي ولا يتم الطباعة النهائية الا بعد ادخاله
// اما الطباعة الاولية ممكن يكون فارغاً ويحفظ الى قاعدة البيانات لاستخدامه لاحقا


// التعديلات الرئيسية التي قمت بها:

// أضفت متغيرات purchaseMethod و setPurchaseMethod من السياق.
// أضفت حقل "طريقة الشراء" كقائمة منسدلة تحت حقل "رقم المعاملة".
// أضفت دالة canFinalPrint() للتحقق من إمكانية الطباعة النهائية (تتطلب تحديد طريقة الشراء).
// عدلت شرط عرض النص الثابت للطباعة النهائية ليتضمن التحقق من تحديد طريقة الشراء.
// أضفت رسالة تحذيرية تظهر عندما يحاول المستخدم الطباعة النهائية دون تحديد طريقة الشراء.
// لاحظ أن هذه التعديلات تفترض أنك ستقوم بتحديث ملف السياق (PurchaseOrderContext.tsx) ليشمل متغيرات purchaseMethod و setPurchaseMethod، وأنك ستقوم بتحديث منطق الحفظ في قاعدة البيانات ليشمل هذه القيمة الجديدة.

 
