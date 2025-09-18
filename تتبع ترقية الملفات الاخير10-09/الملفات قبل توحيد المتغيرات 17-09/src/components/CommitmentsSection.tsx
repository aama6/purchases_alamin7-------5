import React from 'react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';

export const CommitmentsSection: React.FC = () => {
  const {
    priceOffers,
    setPriceOffers,
    savePurchaseOrder,
    poItems
  } = usePurchaseOrder();

  // دالة لإضافة التزامات جديدة للمورد
  const addCommitments = (vendor: string, commitments: string[]) => {
    const updatedOffers = [...priceOffers];
    const offerIndex = updatedOffers.findIndex(offer => offer.vendor === vendor);
    
    if (offerIndex !== -1) {
      updatedOffers[offerIndex] = {
        ...updatedOffers[offerIndex],
        commitments: commitments
      };
      
      setPriceOffers(updatedOffers);
      savePurchaseOrder();
    }
  };

  // دالة لفتح نافذة إضافة التزامات
  const openCommitmentsModal = (vendor: string) => {
    const commitments = prompt('أدخل التزامات المورد (افصل بينها بفاصلة منقوصة):', 
      priceOffers.find(offer => offer.vendor === vendor)?.commitments?.join('، ') || '');
    
    if (commitments !== null) {
      const commitmentsList = commitments.split('،').map(c => c.trim()).filter(c => c !== '');
      addCommitments(vendor, commitmentsList);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 print:shadow-none print:p-2 border border-gray-200 print:landscape">
      <h2 className="text-lg font-semibold mb-4 text-right">التزامات الموردين</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-1/5">المورد</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-3/5">التزامات</th>
              <th className="border-2 border-gray-400 p-2 bg-gray-200 w-1/5">إضافة تعديل</th>
            </tr>
          </thead>
          <tbody>
            {priceOffers.map((offer, idx) => (
              <tr key={`commitments-${idx}`} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-center w-1/5">{offer.vendor || `العرض ${idx + 1}`}</td>
                <td className="border border-gray-300 p-2 w-3/5">
                  <ul className="list-disc pl-5 text-sm">
                    {(offer.commitments || []).map((commitment, cIdx) => (
                      <li key={cIdx}>{commitment}</li>
                    ))}
                    {(offer.commitments || []).length === 0 && (
                      <li className="text-gray-500">لا توجد التزامات مسجلة</li>
                    )}
                  </ul>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/5">
                  <button 
                    onClick={() => openCommitmentsModal(offer.vendor)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    إضافة/تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 text-right">
        <p>ملاحظة: سيتم عرض التزامات كل مورد في جدول التوصية تحت إجمالي المبلغ الخاص به</p>
      </div>
    </div>
  );
};