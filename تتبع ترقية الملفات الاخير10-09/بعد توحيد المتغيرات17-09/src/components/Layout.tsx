// purchases_alamin7\src\components\Layout.tsx


import { FileSpreadsheet, FileText, Trash2, BarChart3 } from 'lucide-react'; // 🟢 إضافة Trash2 و BarChart3
import { Mail } from 'lucide-react'; // إضافة أيقونة الرسائل
import React, { ReactNode, useEffect, useState } from 'react'; // 🟢 إضافة useEffect
import { usePurchaseOrder } from '../context/PurchaseOrderContext'; // 🟢 استيراد usePurchaseOrder
import { ReportsModal } from './ReportsModal';
import { SummaryReport } from './SummaryReport'; // إضافة تقرير الخلاصة
import { SearchScreen } from './SearchScreen'; // إضافة شاشة البحث
import { VendorMessagesModal } from './VendorMessagesModal'; // إضافة نافذة الرسائل

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showReports, setShowReports] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false); // حالة تقرير الخلاصة
  const [showSearchScreen, setShowSearchScreen] = useState(false); // حالة شاشة البحث
  const [showVendorMessages, setShowVendorMessages] = useState(false); // حالة نافذة الرسائل
  // 🟢 حالات زر الحذف ومودال التأكيد
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteButton, setShowDeleteButton] = useState(false); // للتحكم في ظهور الزر

  const { poNumber, deletePurchaseOrderData, clearAllFields, setPoNumber, handlePoNumberChange, isPreliminaryPrint } = usePurchaseOrder(); // 🟢 استخدام السياق

  // 🟢 التحقق من وجود بيانات محفوظة لإظهار زر الحذف
  useEffect(() => {
    const checkExistingData = async () => {
      // فقط أظهر زر الحذف إذا كان هناك رقم طلب شراء محدد
      setShowDeleteButton(!!poNumber && poNumber.trim() !== '');
    };
    checkExistingData();
  }, [poNumber]); // يعتمد على تغير poNumber

  // 🟢 دالة حذف طلب الشراء الفعلية
  const handleDelete = async () => {
    // 🟢 كلمة المرور للحذف
    const ADMIN_PASSWORD = '777716116'; // يمكنك وضعها في متغير بيئة لاحقاً

    if (deletePassword !== ADMIN_PASSWORD) {
      alert('كلمة المرور غير صحيحة');
      return;
    }

    try {
      const success = await deletePurchaseOrderData(poNumber); // استخدام الدالة من السياق
      if (success) {
        alert('تم حذف طلب الشراء بنجاح');
        clearAllFields(); // مسح جميع الحقول بعد الحذف
        setPoNumber(''); // مسح رقم طلب الشراء
        setShowDeleteModal(false);
        setDeletePassword('');
      } else {
        alert('فشل في حذف طلب الشراء');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  /**
   * دالة معالجة اختيار طلب شراء من شاشة البحث
   */
  const handleSelectFromSearch = async (selectedPoNumber: string) => {
    await handlePoNumberChange(selectedPoNumber);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white py-3 px-4 shadow-md print:hidden"> {/* 🟢 print:hidden إخفاء الهيدر في الطباعة */}
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center">
            <FileText className="ml-2" size={20} />
            تفريغ عروض الأسعار وتحليلها نسخة5
          </h1>
          <div className="flex items-center gap-2"> {/* 🟢 حاوية للأزرار */}
            <button
              onClick={() => setShowSearchScreen(true)}
              className="flex items-center px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              <FileSpreadsheet size={18} className="ml-1" />
              استعلام
            </button>
            <button
              onClick={() => setShowVendorMessages(true)}
              className="flex items-center px-3 py-1 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Mail size={18} className="ml-1" />
              الرسائل
            </button>
            {showDeleteButton && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} className="ml-1" />
                حذف
              </button>
            )}
            <button
              onClick={() => setShowSummaryReport(true)}
              className="flex items-center px-3 py-1 bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              <BarChart3 size={18} className="ml-1" />
              خلاصة
            </button>
            <button
              onClick={() => setShowReports(true)}
              className="flex items-center px-3 py-1 bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
            >
              <FileSpreadsheet size={18} className="ml-1" />
              التقارير
            </button>
          </div>
        </div>
      </header>

      {/* شارة الطباعة الأولية */}
      {/* {isPreliminaryPrint && (
        <div className="hidden print:block preliminary-badge">طباعة أولية</div>
      )} */}

      <main className="flex-grow container mx-auto py-4 px-3">
        {children}
      </main>

      <ReportsModal isOpen={showReports} onClose={() => setShowReports(false)} />
      <SummaryReport isOpen={showSummaryReport} onClose={() => setShowSummaryReport(false)} />
      <SearchScreen 
        isOpen={showSearchScreen} 
        onClose={() => setShowSearchScreen(false)}
        onSelectPO={handleSelectFromSearch}
      />
      <VendorMessagesModal 
        isOpen={showVendorMessages} 
        onClose={() => setShowVendorMessages(false)} 
      />

      {/* 🟢 نافذة حذف طلب الشراء (مودال) - تم نقلها هنا */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-red-600">تأكيد الحذف</h3>
            <p className="mb-4">
              هل أنت متأكد من حذف طلب الشراء رقم: <strong>{poNumber}</strong>؟
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">كلمة المرور:</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};