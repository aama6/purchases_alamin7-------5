// مكون حوار عدم تطابق المبالغ مع خيارات الحل
// src/components/AmountMismatchDialog.tsx

import React from 'react';
import { AlertTriangle, Calculator, FileText, X } from 'lucide-react';
import { formatNumberWithCommas } from '../utils/numberToWords';

interface AmountMismatchDialogProps {
  isOpen: boolean;
  offerTotal: number;
  lineItemsTotal: number;
  difference: number;
  currency: string;
  onUpdateOffer: () => void;
  onSaveWithNote: () => void;
  onCancel: () => void;
}

/**
 
 * مكون حوار عدم تطابق المبالغ
 * يظهر عندما لا يتطابق إجمالي مبلغ العرض مع إجمالي أسعار الأصناف
 * ويقدم خيارات للحل
 */
export const AmountMismatchDialog: React.FC<AmountMismatchDialogProps> = ({
  isOpen,
  offerTotal,
  lineItemsTotal,
  difference,
  currency,
  onUpdateOffer,
  onSaveWithNote,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* رأس الحوار */}
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">عدم تطابق في المبالغ</h3>
              <p className="text-sm text-red-600">يوجد اختلاف بين إجمالي مبلغ العرض وإجمالي أسعار الأصناف</p>
            </div>
          </div>
        </div>

        {/* تفاصيل المبالغ */}
        <div className="p-6">
          <div className="mb-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">إجمالي مبلغ العرض</span>
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    {formatNumberWithCommas(offerTotal)} {currency}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">إجمالي أسعار الأصناف</span>
                  </div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatNumberWithCommas(lineItemsTotal)} {currency}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">الفارق</span>
                </div>
                <div className="text-xl font-bold text-red-700">
                  {formatNumberWithCommas(difference)} {currency}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  نسبة الاختلاف: {((difference / offerTotal) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* خيارات الحل */}
          <div className="space-y-3">
            <p className="text-gray-700 font-medium text-center mb-4">
              اختر إحدى الخيارات التالية لحل المشكلة:
            </p>
            
            {/* الخيار الأول: تعديل إجمالي مبلغ العرض */}
            <button
              onClick={onUpdateOffer}
              className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-right group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  أ
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-800 mb-1">تعديل إجمالي مبلغ العرض</div>
                  <div className="text-sm text-blue-600">
                    سيتم تحديث إجمالي مبلغ العرض ليصبح {formatNumberWithCommas(lineItemsTotal)} {currency}
                    ليطابق إجمالي أسعار الأصناف
                  </div>
                  <div className="text-xs text-blue-500 mt-2 group-hover:text-blue-700">
                    ✓ يحافظ على دقة البيانات ويضمن التطابق الكامل
                  </div>
                </div>
              </div>
            </button>
            
            {/* الخيار الثاني: الحفظ مع ملاحظة */}
            <button
              onClick={onSaveWithNote}
              className="w-full p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-right group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  ب
                </div>
                <div className="flex-1">
                  <div className="font-medium text-yellow-800 mb-1">الحفظ مع إضافة ملاحظة</div>
                  <div className="text-sm text-yellow-600">
                    سيتم الحفظ مع إضافة ملاحظة تشير إلى وجود اختلاف في المبالغ
                    والاحتفاظ بالمبلغ الأصلي للعرض
                  </div>
                  <div className="text-xs text-yellow-500 mt-2 group-hover:text-yellow-700">
                    ⚠️ سيتم توثيق الاختلاف في ملاحظات العرض للمراجعة لاحقاً
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">💡 معلومات مهمة:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• يحدث عدم التطابق عادة عند إدخال المبلغ الإجمالي أولاً ثم تفصيل أسعار الأصناف</li>
              <li>• الخيار الأول (أ) يضمن دقة البيانات ويُنصح به في معظم الحالات</li>
              <li>• الخيار الثاني (ب) يحافظ على المبلغ الأصلي مع توثيق الاختلاف</li>
              <li>• يمكن مراجعة وتعديل البيانات لاحقاً من خلال تعديل العرض</li>
            </ul>
          </div>
        </div>

        {/* تذييل الحوار */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              إلغاء وعدم الحفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};