// خطاف مخصص للتأخير (Debouncing)
// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * خطاف مخصص للتأخير - يؤخر تحديث القيمة حتى توقف التغييرات
 * مفيد للبحث والتحقق من صحة البيانات
 * @param value - القيمة المراد تأخيرها
 * @param delay - مدة التأخير بالميلي ثانية
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // تعيين مؤقت لتحديث القيمة المؤخرة
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // تنظيف المؤقت عند تغيير القيمة أو إلغاء المكون
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}