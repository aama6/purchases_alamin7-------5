// purchases_alamin7\src\components\PurchaseOrderSystem.tsx

import React, { useEffect, useState } from 'react';
import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { PurchaseOrderItems } from './PurchaseOrderItems';
import { PriceOffersSection } from './PriceOffersSection';
import { ExcludedOffersSection } from './ExcludedOffersSection';
import { RecommendationSection } from './RecommendationSection';
import { ComparisonPage } from './ComparisonPage';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

export const PurchaseOrderSystem: React.FC = () => {
  // صفحة النظام الرئيسية أو صفحة المقارنة
  const [activePage, setActivePage] = useState<'main' | 'comparison'>('main');

  // إشعارات
  const { toasts, showInfo, removeToast } = useToast();

  // Alt+M: تبديل سريع بين الصفحة الرئيسية وصفحة المقارنة مع إشعار
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // تجاهل حقول الإدخال حتى لا يتداخل مع الكتابة
      const target = e.target as HTMLElement | null;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInput) return;

      const alt = e.altKey || e.getModifierState?.('Alt');
      if (alt && (e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        setActivePage(p => {
          const next = p === 'main' ? 'comparison' : 'main';
          showInfo(next === 'comparison' ? 'تم فتح صفحة المقارنة (Alt+M)' : 'تم العودة للصفحة الرئيسية (Alt+M)', 2000);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showInfo]);

  return (
    <div className="space-y-4 print:space-y-0 print-single-page">
      {/* حاوية الإشعارات */}
      {toasts.map(t => (
        <Toast key={t.id} type={t.type} message={t.message} duration={t.duration}
          onClose={() => removeToast(t.id)} />
      ))}
      {/* شريط تنقل بسيط بدون استخدام Router */}
      <div className="flex items-center justify-between mb-2 print:hidden">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setActivePage('main')}
            className={`px-3 py-1 rounded ${activePage === 'main' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            الصفحة الرئيسية
          </button>
          <button
            onClick={() => setActivePage('comparison')}
            className={`px-3 py-1 rounded ${activePage === 'comparison' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            صفحة المقارنة
          </button>
          <span className="text-xs text-gray-500 ml-2">Alt+M تبديل سريع</span>
        </div>
        {activePage === 'comparison' && (
          <button onClick={() => window.print()} className="px-3 py-1 bg-green-600 text-white rounded">
            طباعة المقارنة
          </button>
        )}
      </div>

      {activePage === 'main' ? (
        // هام جداً لازالة المسافات بين الجداول عند الطباعة 
        <div className="space-y-6 print:space-y-1.5">
          <PurchaseOrderHeader />
          <PurchaseOrderItems />
          <PriceOffersSection />
          <ExcludedOffersSection />
          <RecommendationSection />
        </div>
      ) : (
        <ComparisonPage />
      )}
    </div>
  );
};