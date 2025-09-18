// purchases_alamin4_manus  مسخرة\src\components\ReportsModal.tsx

// مكون تقرير الخلاصة - عرض المعاملات المنجزة حسب التاريخ
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Calendar, FileText, Printer } from 'lucide-react';
import { db } from '../utils/db';

interface CompletedTransaction {
  poNumber: string;  // رقم طلب الشراء 
  transactionNumber: string;  // 
  requesting: string;
  beneficiary: string;
  purchaseMethod: string; // طريقة الشراء
  date: string;
  totalAmount?: number;
  currency?: string;
}

interface SummaryReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'requesting' | 'beneficiary' | 'purchaseMethod'>('all'); // نوع التصفية

  const [filterValue, setFilterValue] = useState(''); // قيمة التصفية
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{ [date: string]: CompletedTransaction[] }>({});
  const [showReport, setShowReport] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // تواريخ منسّقة للطباعة العربية
  const formattedStart = useMemo(() => startDate ? new Date(startDate).toLocaleDateString('en-US') : '', [startDate]);
  const formattedEnd = useMemo(() => endDate ? new Date(endDate).toLocaleDateString('en-US') : '', [endDate]);
  
  // مراجع لترتيب التنقل بالـ Enter
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const filterTypeRef = useRef<HTMLSelectElement>(null);
  const filterValueRef = useRef<HTMLInputElement>(null);
  const generateBtnRef = useRef<HTMLButtonElement>(null);

  // حماية بكلمة مرور للخلاصة
  const PASSWORD = '6364';
  const [authorized, setAuthorized] = useState(false);

  // جلب البيانات وتجميعها حسب التاريخ
  const handleGenerateReport = async () => {
    // السماح بفتح الخلاصة بدون كلمة مرور
    if (!startDate || !endDate) {
      alert('الرجاء تحديد تاريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    try {
      // جلب جميع طلبات الشراء في النطاق الزمني المحدد
      const purchaseOrders = await db.getPurchaseOrdersByDateRange(startDate, endDate);
      
      // تصفية المعاملات المنجزة فقط (التي تحتوي على توصية فيها عروض مختارة)
      const completedTransactions = purchaseOrders.filter(po => 
        po.recommendation && Array.isArray(po.recommendation.selectedOffers) && po.recommendation.selectedOffers.length > 0
      );

      // تطبيق التصفية الإضافية حسب النوع المحدد
      let filteredTransactions = completedTransactions;
      if (filterType !== 'all' && filterValue.trim()) {
        filteredTransactions = completedTransactions.filter(po => {
          if (filterType === 'requesting') {
            return po.requesting?.toLowerCase().includes(filterValue.toLowerCase());
          } else if (filterType === 'beneficiary') {
            return po.beneficiary?.toLowerCase().includes(filterValue.toLowerCase());
          } else if (filterType === 'purchaseMethod') {
            return po.purchaseMethod?.toLowerCase().includes(filterValue.toLowerCase());
          }

          return true;
        });
      }

      // تجميع المعاملات حسب التاريخ (استخدم date_only لضمان اتساق إنجليزي YYYY-MM-DD)
      const groupedByDate: { [date: string]: CompletedTransaction[] } = {};
      
      filteredTransactions.forEach(po => {
        const dateKey = (po as any).date_only || new Date(po.date).toISOString().slice(0, 10);
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        
        groupedByDate[dateKey].push({
          poNumber: po.po_number,
          transactionNumber: po.transaction_number,
          requesting: po.requesting,
          beneficiary: po.beneficiary,
          purchaseMethod: po.purchaseMethod,
          date: dateKey,
          totalAmount: (po as any).awarded_total_yer ?? po.recommendation?.totalAwardedInYR,
          currency: 'YER'
        });
      });

      setReportData(groupedByDate);
      setShowReport(true);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  // طباعة التقرير - محمية بكلمة مرور فقط
  const handlePrint = () => {
    if (!authorized) {
      const input = prompt('أدخل كلمة المرور للطباعة');
      if (input !== PASSWORD) {
        alert('كلمة المرور غير صحيحة');
        return;
      }
      setAuthorized(true);
    }
    window.print();
  };

  // إغلاق التقرير مع إعادة الضبط الكامل للقيم
  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setFilterType('all');
    setFilterValue('');
    setReportData({});
    setShowReport(false);
    setAuthorized(false);
    setLoading(false);
    onClose();
  };

  // حساب إجمالي المعاملات
  const getTotalTransactions = () => {
    return Object.values(reportData).reduce((total, transactions) => total + transactions.length, 0);
  };

  // اعتراض اختصار الطباعة (Ctrl/Cmd+P) لطلب كلمة المرور إن لم يكن مفوضاً
  useEffect(() => {
    if (!isOpen) return; // نضيف المستمع فقط أثناء فتح المودال
    const handler = (e: KeyboardEvent) => {
      const isCmdP = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p');
      if (isCmdP) {
        e.preventDefault();
        if (!authorized) {
          const input = prompt('أدخل كلمة المرور للطباعة');
          if (input === PASSWORD) {
            setAuthorized(true);
            // لا نطبع تلقائياً
          } else {
            alert('كلمة المرور غير صحيحة');
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, authorized]);

  // قفل الطباعة عبر إضافة/إزالة صنف على body عندما تكون الخلاصة مفتوحة وغير مفوضة
  useEffect(() => {
    if (!isOpen) return;
    const body = document.body;
    if (!authorized) {
      body.classList.add('summary-print-locked');
    } else {
      body.classList.remove('summary-print-locked');
    }
    return () => {
      body.classList.remove('summary-print-locked');
    };
  }, [isOpen, authorized]);

  if (!isOpen) return null;

  // ملاحظة: نضيف ظل للشريط عند التمرير
  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    setIsScrolled(el.scrollTop > 0);
  };



  // تفعيل Enter للتنقل بين الحقول
  const handleEnterNav: React.KeyboardEventHandler<HTMLElement> = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const sequence: (HTMLElement | null)[] = [
      startDateRef.current,
      endDateRef.current,
      filterTypeRef.current,
      filterValueRef.current,
      generateBtnRef.current
    ];
    const idx = sequence.findIndex(el => el === target);
    const next = sequence[idx + 1];
    if (next) (next as HTMLElement).focus();
  };

  return (
    <div className="summary-print-scope fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:relative print:bg-white print:inset-auto" dir="rtl">
      {/* نحصر الطباعة في محتوى التقرير فقط */}
      <div
        className={`summary-print-root bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible print-no-gaps`}
        onScroll={onScroll}
      >
        {/* رأس التقرير */}
        <div className={`p-4 md:p-6 border-b border-gray-200 print:border-b-2 print:border-black sticky top-0 z-20 bg-white print:static ${isScrolled ? 'shadow-md' : ''}`}>
          <div className="flex items-center justify-between print:block">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center print:text-center print:text-xl">
              <FileText className="ml-2 print:hidden" size={24} />
              تقرير خلاصة المعاملات المنجزة
            </h2>
            <div className="flex items-center gap-2 md:gap-3 print:hidden ml-6">
              {showReport && (
                <>
                  <button
                    onClick={() => setShowReport(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    تعديل الفترة
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    title={!authorized ? 'مطلوب كلمة مرور للطباعة' : 'طباعة التقرير'}
                  >
                    <Printer className="ml-2" size={16} />
                    طباعة التقرير
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                title="إغلاق"
                aria-label="إغلاق"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>

        {/* إعدادات التقرير */}
        {!showReport && (
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ البداية:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                  inputMode="numeric"
                  ref={startDateRef}
                  onKeyDown={handleEnterNav}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ النهاية:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                  inputMode="numeric"
                  ref={endDateRef}
                  onKeyDown={handleEnterNav}
                />
              </div>
            </div>
            
            {/* خيارات التصفية الإضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع التصفية:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'requesting' | 'beneficiary' | 'purchaseMethod')}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                  ref={filterTypeRef}
                  onKeyDown={handleEnterNav}
                >
                  <option value="all">جميع المعاملات</option>
                  <option value="requesting">حسب الجهة الطالبة</option>
                  <option value="beneficiary">حسب الجهة المستفيدة</option>
                  <option value="purchaseMethod">حسب طريقة الشراء</option>
                </select>
              </div>
              {filterType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filterType === 'requesting' ? 'اسم الجهة الطالبة:' : 'اسم الجهة المستفيدة:'}
                  </label>
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={filterType === 'requesting' ? 'أدخل اسم الجهة الطالبة' : 'أدخل اسم الجهة المستفيدة'}
                    dir="rtl"
                    ref={filterValueRef}
                    onKeyDown={handleEnterNav}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  ref={generateBtnRef}
                >
                  <Calendar className="ml-2" size={18} />
                  {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* محتوى التقرير */}
        {showReport && (
          <div className="p-6">
            {/* معلومات التقرير */}
            <div className="mb-6 print:mb-4">
              <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">فترة التقرير</p>
                    <p className="font-semibold print:text-base">{formattedStart || startDate} إلى {formattedEnd || endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المعاملات</p>
                    <p className="font-semibold text-blue-600">{getTotalTransactions()} معاملة</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">عدد الأيام</p>
                    <p className="font-semibold">{Object.keys(reportData).length} يوم</p>
                  </div>
                </div>
              </div>
            </div>

            {/* تفاصيل المعاملات حسب التاريخ */}
            {Object.keys(reportData).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات منجزة في الفترة المحددة
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(reportData)
                  .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                  .map(([date, transactions]) => (
                  <div key={date} className="border border-gray-200 rounded-lg print:break-inside-avoid">
                    {/* رأس التاريخ */}
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 print:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {date}
                        </h3>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                          {transactions.length} معاملة
                        </span>
                      </div>
                    </div>

                    {/* جدول المعاملات */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 print:bg-gray-100">
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200"  style={{ width: '12%' }}>
                              رقم طلب الشراء
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200"  style={{ width: '23%' }}>
                              رقم المعاملة
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200" style={{ width: '45%' }}>
                              الجهة المستفيدة
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200" style={{ width: '20%' }}>
                              المبلغ الإجمالي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => (
                            <tr key={index} className="hover:bg-gray-50 print:hover:bg-transparent">
                              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-center">
                                {transaction.poNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-center">
                                {transaction.transactionNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-center">
                                {transaction.beneficiary}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-center">
                                {transaction.purchaseMethod}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-center">
                                {transaction.totalAmount ? 
                                  `${transaction.totalAmount.toLocaleString()} ${transaction.currency ?? ''}` : 
                                  '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* أزرار التحكم - تم نقلها لأعلى */}
            <div className="mt-6 flex justify-end gap-3 print:hidden"></div>
          </div>
        )}
      </div>
    </div>
  );
};

