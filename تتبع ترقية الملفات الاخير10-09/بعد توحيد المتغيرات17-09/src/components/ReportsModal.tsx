// purchases_alamin7\src\components\ReportsModal.tsx

import React, { useState } from 'react';
import Modal from 'react-modal';
import { FileSpreadsheet, X } from 'lucide-react';
import { db } from '../utils/db';
import { utils, writeFile } from 'xlsx';

Modal.setAppElement('#root');

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startPO, setStartPO] = useState('');
  const [endPO, setEndPO] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * تصدير التقارير إلى ملف Excel
   */
  const handleExport = async () => {
    // 1) حماية بكلمة مرور
    const PASSWORD = '6364';
    const input = prompt('أدخل كلمة المرور للتصدير');
    if (input !== PASSWORD) {
      alert('كلمة المرور غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      let purchaseOrders;

      // تحديد نوع البحث بناءً على المدخلات
      if (startDate && endDate) {
        purchaseOrders = await db.getPurchaseOrdersByDateRange(startDate, endDate);
      } else if (startPO && endPO) {
        purchaseOrders = await db.getPurchaseOrdersByRange(startPO, endPO);
      } else {
        // إن لم يُحدّد نطاق، نسمح بتصدير الكل
        purchaseOrders = await db.listAllPurchaseOrders();
      }

      if (!purchaseOrders.length) {
        alert('لا توجد نتائج للبحث');
        return;
      }

      // 2) تحويل البيانات إلى صفوف للتقرير مع الأعمدة الجديدة وفصل التاريخ/الوقت
      const reportRows = purchaseOrders.map(po => ({
        'رقم طلب الشراء': po.po_number,
        'رقم المعاملة': po.transaction_number,
        'الجهة الطالبة': po.requesting,
        'الجهة المستفيدة': po.beneficiary,
        'طريقة الشراء': po.purchaseMethod,
        'تاريخ (YYYY-MM-DD)': (po as any).date_only || (po.date ? new Date(po.date).toISOString().slice(0, 10) : ''),
        'وقت (HH:mm:ss)': (po as any).time_only || (po.date ? new Date(po.date).toISOString().slice(11, 19) : ''),
        'عدد العروض': po.offer_count || po.price_offers?.length || 0,
        'إجمالي مرساة بالريال (رقماً)': (po as any).awarded_total_yer ?? po.recommendation?.totalAwardedInYR ?? '',
        'إجمالي مرساة بالريال (كتابة)': (po as any).awarded_total_yer_words ?? po.recommendation?.totalAwardedInYRWords ?? '',
      }));

      // 3) تحضير ورقة لعروض الأسعار الأساسية (تشمل رقم العرض)
      const offersRows = purchaseOrders.flatMap(po => {
        return (po.price_offers || []).map(offer => ({
          'رقم طلب الشراء': po.po_number,
          'مقدم العرض': offer.vendor,
          'رقم العرض': offer.offerNumber || '',
          'العملة': offer.currency || '',
          'سعر الصرف': offer.exchangeRate || '',
          'الضرائب': offer.taxIncluded === true ? 'شامل' : offer.taxIncluded === false ? 'غير شامل' : 'اختر',
          'المبلغ قبل الضريبة/الأساس': offer.amount || 0,
          'الإجمالي بعد الضريبة': offer.total || 0,
          'المعادل بالريال (بعد الضريبة)': offer.totalInYR || 0,
          'الحالة/النتيجة': offer.result || ''
        }));
      });

      // 4) تحضير ورقة بأسعار الأصناف لكل مورد (lineItems) إن وجدت
      const lineItemsRows = purchaseOrders.flatMap(po => {
        const awardedVendors = new Set((po.recommendation?.selectedOffers || []).map((x: any) => x.vendor));
        return (po.price_offers || []).flatMap(offer => {
          const items = offer.lineItems || [];
          return items.map((li: any) => {
            const awardedQtyNum = Number(li.awardedQty || 0);
            const isAwarded = !!(li.awarded || awardedQtyNum > 0 || awardedVendors.has(offer.vendor));
            return {
              'رقم طلب الشراء': po.po_number,
              'مقدم العرض': offer.vendor,
              'رقم العرض': offer.offerNumber || '',
              'رقم السطر': li.lineNumber || '',
              'بيان الصنف': li.name || '',
              'الوحدة': li.unit || '',
              'الكمية المطلوبة': li.requestedQty ?? '',
              'الكمية المقدمة': li.offeredQty ?? '',
              'سعر الوحدة (بعد الضريبة)': li.unitPrice ?? '',
              'سعر الوحدة قبل الضريبة': li.unitPriceBeforeTax ?? '',
              'سعر الوحدة بعد الضريبة': li.unitPriceAfterTax ?? '',
              'إجمالي السطر (بعد الضريبة)': li.lineTotal ?? '',
              'إجمالي السطر قبل الضريبة': li.lineTotalBeforeTax ?? '',
              'إجمالي السطر بعد الضريبة': li.lineTotalAfterTax ?? '',
              'مرسى على هذا السطر؟': isAwarded ? 'نعم' : 'لا',
              'الكمية المرسى عليها': li.awardedQty ?? ''
            };
          });
        });
      });

      // 5) إنشاء ملف Excel بعدة أوراق
      const workbook = utils.book_new();

      const wsMain = utils.json_to_sheet(reportRows);
      const wsOffers = utils.json_to_sheet(offersRows);
      const wsLineItems = utils.json_to_sheet(lineItemsRows);

      // 5.a) بناء ورقة شاملة تجمع جميع الأعمدة من الثلاث الأوراق مع حقول إضافية وترتيب محسّن
      const allRows = purchaseOrders.flatMap(po => {
        const excluded = (po as any).excluded_offers || [];
        const rec = (po as any).recommendation || { selectedOffers: [] };
        const recVendors = (rec.selectedOffers || []).map((o: any) => o.vendor).filter(Boolean).join(', ');
        const recAmounts = (rec.selectedOffers || []).map((o: any) => `${o.vendor}: ${o.amount} ${o.currency || ''}`).join(' | ');
        const recLines = (rec.selectedOffers || []).flatMap((o: any) => o.awardedLineNumbers || []).join(', ');
        const excludedSummary = excluded.map((e: any) => `${e.vendor}: ${e.reason || ''}`).join(' | ');

        const base = {
          'رقم طلب الشراء': po.po_number,
          'رقم المعاملة': po.transaction_number,
          'الجهة الطالبة': po.requesting,
          'الجهة المستفيدة': po.beneficiary,
          'طريقة الشراء': po.purchaseMethod,
          'تاريخ (YYYY-MM-DD)': (po as any).date_only || (po.date ? new Date(po.date).toISOString().slice(0, 10) : ''),
          'وقت (HH:mm:ss)': (po as any).time_only || (po.date ? new Date(po.date).toISOString().slice(11, 19) : ''),
          'اسم المستخدم': (po as any).user_name || '',
          'حالة الاعتماد النهائي': (po as any).final_approval_status || '',
          'ملاحظات عامة على الطلب': (po as any).order_notes || '',
          'عدد العروض': po.offer_count || po.price_offers?.length || 0,
          'عدد العروض المستبعدة': excluded.length || 0,
          'العروض المستبعدة (ملخص)': excludedSummary,
          'التوصية - الموردون': recVendors,
          'التوصية - المبالغ (عملة)': recAmounts,
          'التوصية - أرقام الأسطر المرسى عليها': recLines,
          'إجمالي مرساة بالريال (رقماً)': (po as any).awarded_total_yer ?? po.recommendation?.totalAwardedInYR ?? '',
          'إجمالي مرساة بالريال (كتابة)': (po as any).awarded_total_yer_words ?? (po as any).totalAwardedInYRWords ?? '',
        } as any;

        const awardedVendors = new Set((po.recommendation?.selectedOffers || []).map((x: any) => x.vendor));

        if (po.price_offers && po.price_offers.length > 0) {
          return po.price_offers.flatMap(offer => {
            const offerBase = {
              ...base,
              'مقدم العرض': offer.vendor || '',
              'رقم العرض': offer.offerNumber || '',
              'العملة': offer.currency || '',
              'سعر الصرف': offer.exchangeRate || '',
              'الضرائب': offer.taxIncluded === true ? 'شامل' : offer.taxIncluded === false ? 'غير شامل' : 'اختر',
              'المبلغ قبل الضريبة/الأساس': offer.amount || 0,
              'الإجمالي بعد الضريبة': offer.total || 0,
              'المعادل بالريال (بعد الضريبة)': offer.totalInYR || 0,
              'الحالة/النتيجة': offer.result || '',
              'ملاحظات العرض': (offer as any).notes || ''
            } as any;

            const items = offer.lineItems || [];
            if (items.length > 0) {
              return items.map((li: any) => {
                const isAwarded = !!(li.awarded || (li.awardedQty ?? 0) > 0 || awardedVendors.has(offer.vendor));
                return {
                  ...offerBase,
                  'رقم السطر': li.lineNumber || '',
                  'بيان الصنف': li.name || '',
                  'الوحدة': li.unit || '',
                  'الكمية المطلوبة': li.requestedQty ?? '',
                  'الكمية المقدمة': li.offeredQty ?? '',
                  'سعر الوحدة (بعد الضريبة)': li.unitPrice ?? '',
                  'سعر الوحدة قبل الضريبة': li.unitPriceBeforeTax ?? '',
                  'سعر الوحدة بعد الضريبة': li.unitPriceAfterTax ?? '',
                  'إجمالي السطر (بعد الضريبة)': li.lineTotal ?? '',
                  'إجمالي السطر قبل الضريبة': li.lineTotalBeforeTax ?? '',
                  'إجمالي السطر بعد الضريبة': li.lineTotalAfterTax ?? '',
                  'مرسى على هذا السطر؟': isAwarded ? 'نعم' : 'لا',
                  'الكمية المرسى عليها': li.awardedQty ?? '',
                  'ملاحظات السطر': (li as any).notes || ''
                };
              });
            }
            // لا توجد lineItems → صف على مستوى العرض فقط
            return [offerBase];
          });
        }
        // لا توجد عروض → صف على مستوى الطلب فقط
        return [base];
      });

      // 5.b) إعادة ترتيب أعمدة "الشاملة" حسب ترتيب إدخال البيانات مع الإبقاء على كل الأعمدة
      const preferredOrder = [
        'رقم طلب الشراء',
        'رقم المعاملة',
        // رأس الطلب
        'الجهة الطالبة',
        'الجهة المستفيدة',
        'تاريخ (YYYY-MM-DD)',
        'وقت (HH:mm:ss)',
        'عدد العروض',
        // جدول الأصناف المطلوبة (بيانات رأسية عامة)
        'اسم المستخدم',
        'حالة الاعتماد النهائي',
        'ملاحظات عامة على الطلب',
        // جدول عروض الأسعار
        'مقدم العرض',
        'رقم العرض',
        'العملة',
        'سعر الصرف',
        'الضرائب',
        'ملاحظات العرض',
        // مبالغ العرض على المستوى الكلي
        'المبلغ قبل الضريبة/الأساس',
        'الإجمالي بعد الضريبة',
        'المعادل بالريال (بعد الضريبة)',
        'الحالة/النتيجة',
        // تفاصيل الأصناف على مستوى السطر
        'رقم السطر',
        'بيان الصنف',
        'الوحدة',
        'الكمية المطلوبة',
        'الكمية المقدمة',
        'سعر الوحدة قبل الضريبة',
        'سعر الوحدة بعد الضريبة',
        'سعر الوحدة (بعد الضريبة)',
        'إجمالي السطر قبل الضريبة',
        'إجمالي السطر بعد الضريبة',
        'إجمالي السطر (بعد الضريبة)',
        'مرسى على هذا السطر؟',
        'الكمية المرسى عليها',
        'ملاحظات السطر',
        // جدول العروض المستبعدة (تلخيص)
        'عدد العروض المستبعدة',
        'العروض المستبعدة (ملخص)',
        // جدول التوصية
        'التوصية - الموردون',
        'التوصية - المبالغ (عملة)',
        'التوصية - أرقام الأسطر المرسى عليها',
        // ملخص الترسية على مستوى الطلب
        'إجمالي مرساة بالريال (رقماً)',
        'إجمالي مرساة بالريال (كتابة)'
      ];

      // أعِد تشكيل الصفوف وفق الترتيب مع الحفاظ على أي أعمدة إضافية غير مذكورة في النهاية
      const normalizedAllRows = allRows.map((row: any) => {
        const ordered: any = {};
        preferredOrder.forEach((k) => { if (k in row) ordered[k] = row[k]; });
        // أضف أي مفاتيح أخرى غير مذكورة في preferredOrder
        Object.keys(row).forEach((k) => { if (!(k in ordered)) ordered[k] = row[k]; });
        return ordered;
      });

      const wsAll = utils.json_to_sheet(normalizedAllRows);

      wsMain['!cols'] = [
        { wch: 16 }, // رقم طلب الشراء
        { wch: 16 }, // رقم المعاملة
        { wch: 22 }, // الجهة الطالبة
        { wch: 22 }, // الجهة المستفيدة
        { wch: 14 }, // تاريخ
        { wch: 12 }, // وقت
        { wch: 12 }, // عدد العروض
        { wch: 20 }, // إجمالي رقم
        { wch: 45 }  // إجمالي كتابة
      ];

      wsOffers['!cols'] = [
        { wch: 16 }, // po
        { wch: 22 }, // vendor
        { wch: 16 }, // رقم العرض
        { wch: 10 }, // العملة
        { wch: 12 }, // سعر الصرف
        { wch: 18 }, // المبلغ الأساس
        { wch: 18 }, // الإجمالي بعد الضريبة
        { wch: 22 }, // المعادل بالريال
        { wch: 14 }  // النتيجة
      ];

      wsLineItems['!cols'] = [
        { wch: 16 }, // po
        { wch: 22 }, // vendor
        { wch: 16 }, // رقم العرض
        { wch: 10 }, // رقم السطر
        { wch: 35 }, // بيان الصنف
        { wch: 10 }, // الوحدة
        { wch: 16 }, // الكمية المطلوبة
        { wch: 16 }, // الكمية المقدمة
        { wch: 22 }, // سعر الوحدة بعد الضريبة
        { wch: 22 }, // سعر الوحدة قبل الضريبة
        { wch: 22 }, // سعر الوحدة بعد الضريبة (مكرر لوجود كلاهما عند الوضع غير الشامل)
        { wch: 24 }, // إجمالي السطر بعد الضريبة
        { wch: 24 }, // إجمالي السطر قبل الضريبة
        { wch: 24 }, // إجمالي السطر بعد الضريبة (مكرر)
        { wch: 16 }, // مرسى؟
        { wch: 16 }, // الكمية المرسى عليها
      ];

      // عرض أعمدة الورقة الشاملة
      wsAll['!cols'] = [
        { wch: 16 }, // رقم طلب الشراء
        { wch: 16 }, // رقم المعاملة
        { wch: 22 }, // الجهة الطالبة
        { wch: 22 }, // الجهة المستفيدة
        { wch: 14 }, // تاريخ
        { wch: 12 }, // وقت
        { wch: 12 }, // عدد العروض
        { wch: 20 }, // إجمالي رقم
        { wch: 45 }, // إجمالي كتابة
        { wch: 22 }, // مقدم العرض
        { wch: 16 }, // رقم العرض
        { wch: 10 }, // العملة
        { wch: 12 }, // سعر الصرف
        { wch: 18 }, // المبلغ الأساس
        { wch: 18 }, // الإجمالي بعد الضريبة
        { wch: 22 }, // المعادل بالريال
        { wch: 14 }, // النتيجة
        { wch: 10 }, // رقم السطر
        { wch: 35 }, // بيان الصنف
        { wch: 10 }, // الوحدة
        { wch: 16 }, // الكمية المطلوبة
        { wch: 16 }, // الكمية المقدمة
        { wch: 22 }, // سعر الوحدة بعد الضريبة
        { wch: 22 }, // سعر الوحدة قبل الضريبة
        { wch: 22 }, // سعر الوحدة بعد الضريبة (مكرر)
        { wch: 24 }, // إجمالي السطر بعد الضريبة
        { wch: 24 }, // إجمالي السطر قبل الضريبة
        { wch: 24 }, // إجمالي السطر بعد الضريبة (مكرر)
        { wch: 16 }, // مرسى؟
        { wch: 16 }, // الكمية المرسى عليها
      ];

      utils.book_append_sheet(workbook, wsMain, 'ملخص الطلبات');
      utils.book_append_sheet(workbook, wsOffers, 'عروض الأسعار');
      utils.book_append_sheet(workbook, wsLineItems, 'تفاصيل أصناف العروض');
      utils.book_append_sheet(workbook, wsAll, 'الشاملة');

      // 6) تصدير الملف (xlsx لا يدعم كلمة مرور حقيقية في المتصفح؛ استخدمنا Prompt أعلاه)
      const fileName = `تقرير_طلبات_الشراء_${new Date().toISOString().split('T')[0]}.xlsx`;
      writeFile(workbook, fileName);

    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white rounded-lg p-6 max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FileSpreadsheet className="ml-2" size={24} />
          تقارير طلبات الشراء
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium mb-3">البحث حسب التاريخ</h3>
          <div className="grid grid-cols-2 gap-4" dir="rtl">
            <div className="order-2 md:order-1">
              <label className="block text-sm text-gray-600 mb-1">من تاريخ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-right"
                dir="rtl"
              />
            </div>
            <div className="order-1 md:order-2">
              <label className="block text-sm text-gray-600 mb-1">إلى تاريخ:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-right"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-medium mb-3">البحث حسب رقم طلب الشراء</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">من رقم:</label>
              <input
                type="text"
                value={startPO}
                onChange={(e) => setStartPO(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">إلى رقم:</label>
              <input
                type="text"
                value={endPO}
                onChange={(e) => setEndPO(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={loading}
            className={`flex items-center py-2 px-4 rounded-md transition-colors ${loading
                ? 'bg-gray-300 text-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <FileSpreadsheet size={18} className="ml-1" />
            {loading ? 'جاري التصدير...' : 'تصدير إلى Excel'}
          </button>
        </div>
      </div>
    </Modal>
  );
};