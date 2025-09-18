// شاشة الاستعلام - البحث في قاعدة البيانات
// purchases_alamin7\src\components\SearchScreen.tsx

import React, { useState } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { db } from '../utils/db';

interface SearchResult {
  po_number: string;
  transaction_number: string;
  requesting: string;
  beneficiary: string;
  purchaseMethod: string;  // طريقة الشراء
  date: string;
  vendor?: string; // المورد المرسى عليه
  amount?: number; // المبلغ المرسى عليه
  currency?: string; // العملة
}

interface SearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPO: (poNumber: string) => void; // دالة لتحديد طلب شراء من نتائج البحث
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ isOpen, onClose, onSelectPO }) => {
  // حالات البحث والنتائج
  const [searchQuery, setSearchQuery] = useState(''); // نص البحث
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // نتائج البحث
  const [loading, setLoading] = useState(false); // حالة التحميل
  const [hasSearched, setHasSearched] = useState(false); // هل تم البحث من قبل

  /**
   * دالة البحث الرئيسية - تبحث في جميع الحقول المطلوبة
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('الرجاء إدخال نص البحث');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      // جلب جميع طلبات الشراء من قاعدة البيانات
      const allPurchaseOrders = await db.getAllPurchaseOrders();

      // تصفية النتائج بناءً على نص البحث
      const filteredResults: SearchResult[] = [];
      const searchTerm = searchQuery.toLowerCase().trim();

      allPurchaseOrders.forEach(po => {
        // التحقق من تطابق البحث مع الحقول المختلفة
        const matchesPONumber = po.po_number?.toLowerCase().includes(searchTerm);
        const matchesTransactionNumber = po.transaction_number?.toLowerCase().includes(searchTerm);
        const matchesRequesting = po.requesting?.toLowerCase().includes(searchTerm);
        const matchesBeneficiary = po.beneficiary?.toLowerCase().includes(searchTerm);
        const matchesPurchaseMethod = po.purchaseMethod?.toLowerCase().includes(searchTerm);
        
        // البحث في أسماء الموردين المرسى عليهم
        let matchesVendor = false;
        let vendorName = '';
        let vendorAmount = 0;
        let vendorCurrency = '';

        if (po.recommendation?.selectedOffers?.length > 0) {
          po.recommendation.selectedOffers.forEach(offer => {
            if (offer.vendor?.toLowerCase().includes(searchTerm)) {
              matchesVendor = true;
              vendorName = offer.vendor;
              vendorAmount = offer.isManualAmount ? offer.manualAmount || 0 : offer.amount || 0;
              vendorCurrency = offer.currency;
            }
          });
        }

        // إذا تطابق البحث مع أي من الحقول، أضف النتيجة
        if (matchesPONumber || matchesTransactionNumber || matchesRequesting || 
            matchesBeneficiary || matchesVendor) {
          
          // إذا لم يكن هناك مورد محدد، استخدم أول مورد مرسى عليه
          if (!vendorName && po.recommendation?.selectedOffers?.length > 0) {
            const firstOffer = po.recommendation.selectedOffers[0];
            vendorName = firstOffer.vendor;
            vendorAmount = firstOffer.isManualAmount ? firstOffer.manualAmount || 0 : firstOffer.amount || 0;
            vendorCurrency = firstOffer.currency;
          }

          filteredResults.push({
            po_number: po.po_number,
            transaction_number: po.transaction_number,
            requesting: po.requesting,
            beneficiary: po.beneficiary,
            purchaseMethod: po.purchaseMethod,
            date: new Date(po.date).toLocaleDateString('en-US'),
            vendor: vendorName || 'غير محدد',
            amount: vendorAmount,
            currency: vendorCurrency || ''
          });
        }
      });

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  /**
   * دالة مسح البحث وإعادة تعيين النتائج
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  /**
   * دالة اختيار طلب شراء من النتائج
   */
  const handleSelectResult = (poNumber: string) => {
    onSelectPO(poNumber);
    onClose();
  };

  // إذا لم تكن الشاشة مفتوحة، لا تعرض شيئاً
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* رأس الشاشة */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <Search className="ml-2" size={24} />
            شاشة الاستعلام والبحث
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* قسم البحث */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث في: رقم طلب الشراء، رقم المعاملة، الجهة الطالبة، الجهة المستفيدة، أو اسم المورد
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل نص البحث..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={18} />
                {loading ? 'جاري البحث...' : 'بحث'}
              </button>
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                مسح
              </button>
            </div>
          </div>
        </div>

        {/* قسم النتائج */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">جاري البحث...</p>
            </div>
          )}

          {!loading && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>لا توجد نتائج للبحث عن "{searchQuery}"</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                تم العثور على {searchResults.length} نتيجة للبحث عن "{searchQuery}"
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="border border-gray-300 p-3 text-center font-semibold">التاريخ</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">رقم طلب الشراء</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">رقم المعاملة</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">الجهة الطالبة</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">الجهة المستفيدة</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">المورد المرسى عليه</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">المبلغ</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-300 p-3 text-center">{result.date}</td>
                        <td className="border border-gray-300 p-3 text-center font-medium text-blue-600">
                          {result.po_number}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">{result.transaction_number}</td>
                        <td className="border border-gray-300 p-3 text-right">{result.requesting}</td>
                        <td className="border border-gray-300 p-3 text-right">{result.beneficiary}</td>
                        
                        <td className="border border-gray-300 p-3 text-center">{result.vendor}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          {result.amount && result.currency ? 
                            `${result.amount.toLocaleString()} ${result.currency}` : 
                            'غير محدد'
                          }
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <button
                            onClick={() => handleSelectResult(result.po_number)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 mx-auto"
                          >
                            <Eye size={16} />
                            عرض
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-12 text-gray-500">
              <Search size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">أدخل نص البحث واضغط على زر البحث للعثور على المعاملات</p>
              <p className="text-sm mt-2">يمكنك البحث برقم طلب الشراء، رقم المعاملة، الجهة الطالبة، الجهة المستفيدة، أو اسم المورد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};