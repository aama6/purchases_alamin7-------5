// مكون مؤشر التحميل المحسن
// src/components/LoadingSpinner.tsx

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
}

/**
 * مكون مؤشر التحميل - يعرض رسالة تحميل مع رسوم متحركة
 * @param size - حجم المؤشر (صغير، متوسط، كبير)
 * @param message - رسالة التحميل المخصصة
 * @param overlay - هل يعرض كطبقة علوية على الشاشة
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'جاري التحميل...', 
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      <p className="text-gray-600 text-sm font-medium">{message}</p>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};