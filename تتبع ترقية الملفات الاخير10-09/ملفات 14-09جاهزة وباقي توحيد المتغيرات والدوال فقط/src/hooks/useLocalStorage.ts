// خطاف مخصص للتخزين المحلي
// src/hooks/useLocalStorage.ts

import { useState, useEffect } from 'react';

/**
 * خطاف مخصص للتخزين المحلي مع مزامنة الحالة
 * @param key - مفتاح التخزين
 * @param initialValue - القيمة الافتراضية
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // قراءة القيمة من التخزين المحلي عند التحميل
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`خطأ في قراءة ${key} من التخزين المحلي:`, error);
      return initialValue;
    }
  });

  // دالة تحديث القيمة
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // السماح بالقيم أو الدوال
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // حفظ في التخزين المحلي
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`خطأ في حفظ ${key} في التخزين المحلي:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export { useState };
