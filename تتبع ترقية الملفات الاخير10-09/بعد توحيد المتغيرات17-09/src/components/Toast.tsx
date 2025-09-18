// نظام الإشعارات المحسن
// src/components/Toast.tsx

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

/**
 * مكون الإشعارات - يعرض رسائل النجاح والخطأ والتحذير
 * @param type - نوع الإشعار (نجاح، خطأ، تحذير، معلومات)
 * @param message - نص الرسالة
 * @param duration - مدة العرض بالميلي ثانية
 * @param onClose - دالة الإغلاق
 */
export const Toast: React.FC<ToastProps> = ({ type, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // إغلاق تلقائي بعد المدة المحددة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // انتظار انتهاء الانتقال
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // تحديد الألوان والأيقونات حسب النوع
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const config = getToastConfig();

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${config.bgColor} ${config.textColor} border rounded-lg p-4 shadow-lg max-w-md`}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};