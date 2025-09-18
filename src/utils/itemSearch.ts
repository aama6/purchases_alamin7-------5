// ملف جديد لبحث الأصناف في ملف JSON

/**
 * دالة لقراءة ملف JSON والبحث عن اسم الصنف بناءً على رقم الصنف
 * @param code - رقم الصنف للبحث عنه
 * @param exactMatch - إذا كان true، سيتم البحث عن تطابق كامل، وإلا سيتم البحث جزئياً
 * @returns Promise<string|null> - اسم الصنف إذا تم العثور عليه، أو null إذا لم يتم العثور عليه
 */
 export const getItemNameByCode = async (code: string, exactMatch: boolean = true): Promise<string | null> => {
  try {
    // مسار ملف JSON
    const filePath = '/PurchaseOrders/items.json';

    // تحاول أولاً استخدام fetch API للملفات المحلية
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`فشل في جلب الملف: ${response.statusText}`);
      }

      const items = await response.json();
      
      // البحث عن الصنف المطابق لرقم الصنف
      let foundItem;
      if (exactMatch) {
        foundItem = items.find((item: any) => item["رقم الصنف"] === code);
      } else {
        // البحث الجزئي - البحث عن أرقام الأصناف التي تحتوي على النص المدخل
        foundItem = items.find((item: any) => 
          item["رقم الصنف"] && item["رقم الصنف"].includes(code)
        );
      }
      
      if (foundItem) {
        return foundItem["اسم الصنف"];
      }

      // إذا لم يتم العثور على الصنف، أرجع null
      return null;
    } catch (fetchError) {
      console.warn('فشل fetch API، محاولة استخدام FileReader:', fetchError);

      // كبديل، استخدم XMLHttpRequest للملفات المحلية
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'text';

        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const items = JSON.parse(xhr.responseText);
              
              // البحث عن الصنف المطابق لرقم الصنف
              let foundItem;
              if (exactMatch) {
                foundItem = items.find((item: any) => item["رقم الصنف"] === code);
              } else {
                // البحث الجزئي - البحث عن أرقام الأصناف التي تحتوي على النص المدخل
                foundItem = items.find((item: any) => 
                  item["رقم الصنف"] && item["رقم الصنف"].includes(code)
                );
              }
              
              resolve(foundItem ? foundItem["اسم الصنف"] : null);
            } catch (parseError) {
              console.error('خطأ في تحليل JSON:', parseError);
              resolve(null);
            }
          } else {
            console.error('فشل في جلب الملف باستخدام XMLHttpRequest:', xhr.statusText);
            resolve(null);
          }
        };

        xhr.onerror = function() {
          console.error('خطأ في الاتصال بالملف:', xhr.statusText);
          resolve(null);
        };

        xhr.send();
      });
    }
  } catch (error) {
    console.error('خطأ في البحث عن اسم الصنف:', error);
    return null;
  }
};

/**
 * دالة للبحث عن أصناف متعددة بناءً على رقم الصنف (للبحث الجزئي)
 * @param code - جزء من رقم الصنف للبحث عنه
 * @returns Promise<any[]> - مصفوفة تحتوي على الأصناف المطابقة
 */
export const searchItemsByCode = async (code: string): Promise<any[]> => {
  try {
    // مسار ملف JSON
    const filePath = '/PurchaseOrders/items.json';
    
    // تحاول أولاً استخدام fetch API للملفات المحلية
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`فشل في جلب الملف: ${response.statusText}`);
      }
      
      const items = await response.json();
      
      // البحث الجزئي - البحث عن أرقام الأصناف التي تحتوي على النص المدخل
      const foundItems = items.filter((item: any) => 
        item["رقم الصنف"] && item["رقم الصنف"].includes(code)
      );
      
      return foundItems;
    } catch (fetchError) {
      console.warn('فشل fetch API، محاولة استخدام FileReader:', fetchError);
      
      // كبديل، استخدم XMLHttpRequest للملفات المحلية
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'text';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const items = JSON.parse(xhr.responseText);
              
              // البحث الجزئي - البحث عن أرقام الأصناف التي تحتوي على النص المدخل
              const foundItems = items.filter((item: any) => 
                item["رقم الصنف"] && item["رقم الصنف"].includes(code)
              );
              
              resolve(foundItems);
            } catch (parseError) {
              console.error('خطأ في تحليل JSON:', parseError);
              resolve([]);
            }
          } else {
            console.error('فشل في جلب الملف باستخدام XMLHttpRequest:', xhr.statusText);
            resolve([]);
          }
        };
        
        xhr.onerror = function() {
          console.error('خطأ في الاتصال بالملف:', xhr.statusText);
          resolve([]);
        };
        
        xhr.send();
      });
    }
  } catch (error) {
    console.error('خطأ في البحث عن الأصناف:', error);
    return [];
  }
};

/**
 * دالة لتحميل جميع الأصناف من ملف JSON
 * @returns Promise<any[]> - مصفوفة تحتوي على جميع الأصناف
 */
export const getAllItems = async (): Promise<any[]> => {
  try {
    // مسار ملف JSON
    const filePath = '/PurchaseOrders/items.json';

    // تحاول أولاً استخدام fetch API للملفات المحلية
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`فشل في جلب الملف: ${response.statusText}`);
      }

      return await response.json();
    } catch (fetchError) {
      console.warn('فشل fetch API، محاولة استخدام FileReader:', fetchError);

      // كبديل، استخدم XMLHttpRequest للملفات المحلية
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'text';

        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const items = JSON.parse(xhr.responseText);
              resolve(items);
            } catch (parseError) {
              console.error('خطأ في تحليل JSON:', parseError);
              resolve([]);
            }
          } else {
            console.error('فشل في جلب الملف باستخدام XMLHttpRequest:', xhr.statusText);
            resolve([]);
          }
        };

        xhr.onerror = function() {
          console.error('خطأ في الاتصال بالملف:', xhr.statusText);
          resolve([]);
        };

        xhr.send();
      });
    }
  } catch (error) {
    console.error('خطأ في جلب الأصناف:', error);
    return [];
  }
};









// تم تحسين الكود بنجاح! الآن لدى نظام البحث عن الأصناف الميزات التالية:

// البحث الجزئي: يمكن للمستخدم إدخال جزء من رقم الصنف وعرض النتائج المتطابقة
// واجهة مستخدم محسنة: تظهر نتائج البحث بشكل منسدل تحت حقل الإدخال
// تحسين الأداء: تم استخدام دالة البحث المحسنة التي تدعم كلاً من البحث الكامل والجزئي
// تحسين تجربة المستخدم: يمكن للمستخدم اختيار صنف من نتائج البحث أو إكمال الإدخال يدوياً
// لقد قمت بالتغييرات التالية:

// إنشاء ملف جديد itemSearchImproved.ts يحتوي على دوال بحث محسنة
// تحديث الملف الرئيسي لاستخدام الدوال المحسنة
// إضافة حالات جديدة لإدارة نتائج البحث
// إضافة دوال للبحث الجزئي واختيار النتائج
// تحسين واجهة المستخدم لعرض نتائج البحث بشكل تفاعلي
// هذه التحسينات ستسمح للمستخدمين بالبحث عن الأصناف بسهولة أكبر من خلال إدخال جزء من رقم الصنف، واختيار النتيجة المناسبة من القائمة المنسدلة التي تظهر أثناء الكتابة.

