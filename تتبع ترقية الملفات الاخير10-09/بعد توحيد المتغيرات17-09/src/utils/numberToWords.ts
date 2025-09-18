// purchases_alamin7\src\utils\numberToWords.ts

// الأرقام العربية من 1 إلى 19
const arabicOnes = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 
  'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];

// العشرات من 20 إلى 90
const arabicTens = [
  '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 
  'ستون', 'سبعون', 'ثمانون', 'تسعون'
];

// المئات من 100 إلى 900
const arabicHundreds = [
  '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 
  'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
];

// مجموعات الأرقام (آلاف، ملايين، إلخ)
const arabicGroups = [
  '', 'ألف', 'مليون', 'مليار', 'تريليون'
];

// أسماء العملات الفرعية
const subCurrencyNames = {
  'ريال': 'فلس',
  'دولار': 'سنت',
  'ريال سعودي': 'هلله',
  'يورو': 'سنت'
};

/**
 * تنسيق الأرقام مع فواصل الآلاف
 * @param number الرقم المراد تنسيقه
 * @returns الرقم مع فواصل الآلاف
 */
export function formatNumberWithCommas(number: number): string {
  if (number === null || number === undefined || isNaN(number as any)) return '';
  const rounded = Math.round((Number(number) + Number.EPSILON) * 100) / 100; // تقريب إلى منزلتين
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// تنسيق رقم خام إلى منزلتين عشريتين بدون فواصل (للاستخدام في حقول الإدخال)
export function toFixed2Raw(value: string | number): string {
  const num = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  if (isNaN(num)) return '';
  return (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
}

/**
 * تحويل الأرقام إلى كلمات عربية
 * @param number الرقم المراد تحويله
 * @param currency العملة (ريال، دولار، ريال سعودي، يورو)
 * @returns النص العربي للرقم
 */
export function convertNumberToArabicWords(number: number, currency: string = 'ريال'): string {
  if (number === 0) return `صفر ${currency}`;
  
  // تنسيق الرقم ليحتوي على منزلتين عشريتين بالضبط
  const formattedNum = number.toFixed(2);
  const [integerPart, decimalPart] = formattedNum.split('.');
  
  let result = '';
  let groupCount = 0;
  const groups = [];
  
  // معالجة مجموعات من 3 أرقام من اليمين إلى اليسار
  for (let i = integerPart.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    const groupValue = parseInt(integerPart.substring(start, i));
    
    if (groupValue > 0) {
      const groupName = arabicGroups[groupCount];
      groups.push(`${convertGroupToArabicWords(groupValue)} ${groupName}`.trim());
    }
    
    groupCount++;
  }
  
  // ربط المجموعات بحرف "و"
  if (groups.length > 1) {
    result = groups.reverse().join(' و ');
  } else if (groups.length === 1) {
    result = groups[0];
  }
  
  // إضافة العملة
  result = result.trim() + ` ${currency}`;
  
  // إضافة الجزء العشري إذا لم يكن صفراً
  if (parseInt(decimalPart) > 0) {
    const subCurrency = subCurrencyNames[currency as keyof typeof subCurrencyNames] || 'فلس';
    result += ` و ${convertGroupToArabicWords(parseInt(decimalPart))} ${subCurrency}`;
  }
  
  return result.trim();
}

/**
 * تحويل مجموعة من الأرقام (أقل من 1000) إلى كلمات عربية
 * @param number الرقم (أقل من 1000)
 * @returns النص العربي للرقم
 */
function convertGroupToArabicWords(number: number): string {
  if (number === 0) return '';
  if (number < 20) return arabicOnes[number];
  
  if (number < 100) {
    const ones = number % 10;
    const tens = Math.floor(number / 10);
    
    if (ones === 0) {
      return arabicTens[tens];
    } else {
      return `${arabicOnes[ones]} و ${arabicTens[tens]}`;
    }
  }
  
  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  
  if (remainder === 0) {
    return arabicHundreds[hundreds];
  } else {
    return `${arabicHundreds[hundreds]} و ${convertGroupToArabicWords(remainder)}`;
  }
}