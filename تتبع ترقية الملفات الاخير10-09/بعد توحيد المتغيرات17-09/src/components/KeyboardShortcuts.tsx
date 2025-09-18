// مكون اختصارات لوحة المفاتيح
// src/components/KeyboardShortcuts.tsx

import React, { useEffect } from 'react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';

interface KeyboardShortcutsProps {
  onSave?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
  onClear?: () => void;
}

/**
 * مكون اختصارات لوحة المفاتيح - يوفر اختصارات سريعة للعمليات الشائعة
 * @param onSave - دالة الحفظ (Ctrl+S)
 * @param onPrint - دالة الطباعة (Ctrl+P)
 * @param onSearch - دالة البحث (Ctrl+F)
 * @param onClear - دالة المسح (Ctrl+Delete)
 */
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onSave,
  onPrint,
  onSearch,
  onClear
}) => {
  const { savePurchaseOrder } = usePurchaseOrder();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // التحقق من الضغط على Ctrl (أو Cmd في Mac)
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      if (!isCtrlPressed) return;

      switch (event.key.toLowerCase()) {
        case 's':
          // Ctrl+S للحفظ
          event.preventDefault();
          if (onSave) {
            onSave();
          } else {
            savePurchaseOrder();
          }
          break;
          
        case 'p':
          // Ctrl+P للطباعة
          event.preventDefault();
          if (onPrint) {
            onPrint();
          }
          break;
          
        case 'f':
          // Ctrl+F للبحث
          event.preventDefault();
          if (onSearch) {
            onSearch();
          }
          break;
          
        case 'delete':
          // Ctrl+Delete للمسح
          event.preventDefault();
          if (onClear) {
            onClear();
          }
          break;
      }
    };

    // إضافة مستمع الأحداث
    document.addEventListener('keydown', handleKeyDown);

    // تنظيف المستمع عند إلغاء المكون
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave, onPrint, onSearch, onClear, savePurchaseOrder]);

  // هذا المكون لا يعرض أي واجهة مستخدم
  return null;
};

/**
 * مكون عرض اختصارات لوحة المفاتيح
 */
export const KeyboardShortcutsHelp: React.FC = () => {
  const shortcuts = [
    { key: 'Ctrl + S', description: 'حفظ البيانات' },
    { key: 'Ctrl + P', description: 'طباعة' },
    { key: 'Ctrl + F', description: 'البحث' },
    { key: 'Tab', description: 'الانتقال للحقل التالي' },
    { key: 'Enter', description: 'تأكيد الإدخال' },
    { key: 'Esc', description: 'إلغاء/إغلاق' }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        ⌨️ اختصارات لوحة المفاتيح
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-600">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};