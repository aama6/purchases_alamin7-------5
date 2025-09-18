// مكون حوار التأكيد المحسن
// src/components/ConfirmDialog.tsx

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * مكون حوار التأكيد - يعرض رسالة تأكيد مع خيارات الموافقة والإلغاء
 * @param isOpen - هل الحوار مفتوح
 * @param title - عنوان الحوار
 * @param message - نص الرسالة
 * @param confirmText - نص زر التأكيد
 * @param cancelText - نص زر الإلغاء
 * @param type - نوع الحوار (تحذير، خطر، معلومات)
 * @param onConfirm - دالة التأكيد
 * @param onCancel - دالة الإلغاء
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // تحديد الألوان حسب النوع
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* رأس الحوار */}
        <div className={`flex items-center justify-between p-4 border-b ${config.borderColor}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى الحوار */}
        <div className="p-4">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* أزرار الحوار */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${config.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};