// خطاف مخصص لإدارة الإشعارات
// src/hooks/useToast.ts

import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * خطاف مخصص لإدارة الإشعارات
 * يوفر دوال لإضافة وإزالة الإشعارات
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // إضافة إشعار جديد
  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastItem = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  // إزالة إشعار محدد
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // دوال مختصرة لكل نوع إشعار
  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const showError = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};