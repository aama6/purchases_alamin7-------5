// دوال تحسين الأداء
// src/utils/performance.ts

/**
 * دوال تحسين الأداء والذاكرة
 */

// تخزين مؤقت للبحث
const searchCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 دقائق

/**
 * دالة البحث مع التخزين المؤقت
 * @param query - استعلام البحث
 * @param searchFunction - دالة البحث الأصلية
 */
export const cachedSearch = async (query: string, searchFunction: (q: string) => Promise<any>) => {
  const cacheKey = `search_${query}`;
  const cached = searchCache.get(cacheKey);
  
  // التحقق من وجود نتيجة مخزنة وصالحة
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  
  // تنفيذ البحث وحفظ النتيجة
  const result = await searchFunction(query);
  searchCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
};

/**
 * تنظيف التخزين المؤقت المنتهي الصلاحية
 */
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      searchCache.delete(key);
    }
  }
};

/**
 * دالة التأخير (Debounce) للبحث
 * @param func - الدالة المراد تأخيرها
 * @param delay - مدة التأخير
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * دالة تحسين الصور للطباعة
 * @param imageUrl - رابط الصورة
 * @param quality - جودة الضغط (0-1)
 */
export const optimizeImageForPrint = (imageUrl: string, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const optimizedUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedUrl);
    };
    
    img.src = imageUrl;
  });
};

/**
 * مراقب الأداء للعمليات الطويلة
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private operations: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // بدء مراقبة عملية
  startOperation(name: string): void {
    this.operations.set(name, performance.now());
  }
  
  // انتهاء مراقبة عملية
  endOperation(name: string): number {
    const startTime = this.operations.get(name);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.operations.delete(name);
    
    // تسجيل العمليات البطيئة
    if (duration > 1000) {
      console.warn(`عملية بطيئة: ${name} استغرقت ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
}