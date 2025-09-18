
// purchases_alamin7\src\components\PurchaseOrderItems.tsx
// مكون جدول الأصناف المطلوبة مع تحسينات شاملة للبحث والمواصفات والتكلفة التقديرية
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Save, X, Package, Calculator, FileText } from 'lucide-react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';
import { PurchaseOrderItem } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { searchItemsByCodePart, searchItemsByNamePart, getItemNameByCodeExact, toDisplayItem } from '../utils/itemCatalog';

export const PurchaseOrderItems: React.FC = () => {
  const {
    poItems,
    setPoItems,
    savePurchaseOrder,
    priceOffers,
    hasUnsavedChanges
  } = usePurchaseOrder();

  // حالات إدارة الأصناف
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // حالات التكلفة التقديرية والمواصفات المؤقتة لكل صنف منفصل
  const [tempItemData, setTempItemData] = useState<{
    [key: string]: {
      estimatedCost: { amount: number; currency: string; equivalentInYR: number };
      specifications: { [key: string]: string | undefined };
    };
  }>({});

  // مراجع للحقول
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 🟢 تعريف قائمة وحدة القياس
  const unitOptions = [
    'Each', 'Meter', 'Liter', 'Set', 'Kilogram', 'CAN', 'Galons', 'CRT',
    'Kilometer', 'Dabba', 'Packet', 'Kit', 'TON', 'لفة', 'بدلة', 'طب'
  ];

  // استخدام useDebounce لتأخير البحث التلقائي
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * تهيئة البيانات المؤقتة عند تحميل المكون أو تغيير الأصناف
   * يتم إنشاء بيانات منفصلة لكل صنف لتجنب التداخل
   */
  useEffect(() => {
    const initTempData = () => {
      const newTempData: {
        [key: string]: {
          estimatedCost: { amount: number, currency: string, equivalentInYR: number },
          specifications: { [key: string]: string | undefined }
        }
      } = {};
      
      poItems.forEach(item => {
        // تهيئة التكلفة التقديرية لكل صنف منفصل
        if (item.estimatedCost) {
          newTempData[item.id] = {
            estimatedCost: {
              amount: item.estimatedCost.amount,
              currency: item.estimatedCost.currency,
              equivalentInYR: item.estimatedCost.equivalentInYR || 0
            },
            specifications: item.specifications ? { ...item.specifications } : {}
          };
        } else {
          newTempData[item.id] = {
            estimatedCost: { amount: 0, currency: 'ريال', equivalentInYR: 0 },
            specifications: {}
          };
        }
      });
      
      setTempItemData(newTempData);
    };
    
    initTempData();
  }, [poItems]);

  /**
   * حفظ تلقائي محسن - يحفظ بعد ثانيتين من التوقف عن التعديل
   */
  useEffect(() => {
    const autoSaveTimer = setTimeout(async () => {
      if (poItems.length > 0 && hasUnsavedChanges) {
        try {
          await savePurchaseOrder();
          console.log('✅ تم الحفظ التلقائي بنجاح');
        } catch (error) {
          console.error('❌ فشل الحفظ التلقائي:', error);
        }
      }
    }, 2000);
    
    return () => clearTimeout(autoSaveTimer);
  }, [poItems, hasUnsavedChanges, savePurchaseOrder]);

  /**
   * دالة البحث التلقائي المحسنة - تبحث برقم الصنف أو اسم الصنف
   * تعمل عند تغيير نص البحث مع تأخير لتحسين الأداء
   */
  useEffect(() => {
    const performAutoSearch = async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        let results: any[] = [];
        
        // البحث برقم الصنف أولاً (إذا كان النص يحتوي على أرقام)
        if (/\d/.test(debouncedSearchQuery)) {
          results = await searchItemsByCodePart(debouncedSearchQuery);
        }
        
        // إذا لم نجد نتائج أو النص لا يحتوي على أرقام، ابحث باسم الصنف
        if (results.length === 0) {
          results = await searchItemsByNamePart(debouncedSearchQuery);
        }
        
        // تحويل النتائج للعرض مع تحديد أفضل 15 نتيجة
        const displayResults = results.slice(0, 15).map(toDisplayItem);
        setSearchResults(displayResults);
        setShowSearchResults(displayResults.length > 0);
      } catch (error) {
        console.error('خطأ في البحث التلقائي:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    };
    
    performAutoSearch();
  }, [debouncedSearchQuery]);

  /**
   * دالة إضافة صنف جديد مع تهيئة البيانات الافتراضية
   */
  const handleAddItem = () => {
    // تعديل ترقيم السطر تلقائياً - يبدأ من 1 ويزداد مع كل إضافة
    const newLineNumber = poItems.length > 0
      ? Math.max(...poItems.map(item => item.lineNumber)) + 1
      : 1;
      
    const newItem: PurchaseOrderItem = {
      id: `item-${Date.now()}`,
      code: '',
      name: '',
      quantity: 0, // تعديل: جعل الكمية فارغة (0) بدلاً من 1
      unit: '', // تعديل: جعل الوحدة فارغة
      selected: true,
      lineNumber: newLineNumber,
      estimatedCost: {
        amount: 0,
        currency: 'ريال',
        equivalentInYR: 0
      },
      specifications: {},
      poNumber: 0
    };
    
    setPoItems([...poItems, newItem]);
    setEditingItem(newItem.id);
    
    // تهيئة البيانات المؤقتة للصنف الجديد
    setTempItemData(prev => ({
      ...prev,
      [newItem.id]: {
        estimatedCost: { amount: 0, currency: 'ريال', equivalentInYR: 0 },
        specifications: {}
      }
    }));
  };

  /**
   * دالة تحديث صنف مع حفظ فوري للتغييرات البسيطة
   */
  const handleUpdateItem = (id: string, updates: Partial<PurchaseOrderItem>) => {
    setPoItems(poItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  /**
   * دالة حذف صنف مع تنظيف البيانات المرتبطة
   */
  const handleRemoveItem = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      setPoItems(poItems.filter(item => item.id !== id));
      
      // إزالة البيانات المؤقتة المرتبطة بالصنف المحذوف
      const newTempData = { ...tempItemData };
      delete newTempData[id];
      setTempItemData(newTempData);
    }
  };

  /**
   * دالة حفظ التعديلات مع التحقق من صحة البيانات
   * تحفظ التكلفة التقديرية والمواصفات بشكل منفصل لكل صنف
   */
  const handleSaveItem = async (id: string) => {
    const item = poItems.find(item => item.id === id);
    if (!item) return;
    
    // التحقق من صحة البيانات الأساسية
    if (!item.name.trim()) {
      alert('⚠️ اسم الصنف مطلوب');
      return;
    }
    
    // تعديل: التحقق من إدخال الكمية والوحدة
    if (!item.quantity || item.quantity <= 0) {
      alert('⚠️ الكمية مطلوبة ويجب أن تكون أكبر من صفر');
      return;
    }
    
    if (!item.unit || item.unit.trim() === '') {
      alert('⚠️ الوحدة مطلوبة');
      return;
    }
    
    // تحديث التكلفة التقديرية مع حساب المعادل بالريال
    const costData = tempItemData[id]?.estimatedCost;
    if (costData) {
      const equivalentInYR = calculateEquivalentInYR(costData.amount, costData.currency);
      handleUpdateItem(id, {
        estimatedCost: {
          amount: costData.amount,
          currency: costData.currency,
          equivalentInYR
        }
      });
    }
    
    // تحديث المواصفات
    const specsData = tempItemData[id]?.specifications;
    if (specsData) {
      handleUpdateItem(id, {
        specifications: { ...specsData }
      });
    }
    
    setEditingItem(null);
    await savePurchaseOrder();
  };

  /**
   * دالة حساب المعادل بالريال اليمني باستخدام أسعار الصرف من جدول العروض
   * تربط التكلفة التقديرية تلقائياً بأسعار الصرف المدخلة لاحقاً
   */
  const calculateEquivalentInYR = (amount: number, currency: string): number => {
    if (currency === 'ريال') return amount;
    
    // البحث عن سعر الصرف من عروض الأسعار المدخلة
    const offerWithRate = priceOffers.find(offer =>
      offer.currency === currency && offer.exchangeRate && offer.exchangeRate > 0
    );
    
    if (offerWithRate && offerWithRate.exchangeRate) {
      return amount * offerWithRate.exchangeRate;
    }
    
    // إذا لم نجد سعر صرف، نعيد المبلغ كما هو مع تحذير
    console.warn(`⚠️ لم يتم العثور على سعر صرف للعملة ${currency}`);
    return amount;
  };

  /**
   * دالة البحث اليدوي المحسنة عند تغيير اسم الصنف
   * تدعم البحث برقم الصنف أو اسم الصنف مع تحديث تلقائي
   */
  const handleItemNameChange = async (id: string, value: string) => {
    handleUpdateItem(id, { name: value });
    
    // إذا كان النص يحتوي على أرقام، ابحث برقم الصنف أولاً
    if (/\d/.test(value) && value.length >= 3) {
      try {
        const foundName = await getItemNameByCodeExact(value);
        if (foundName) {
          handleUpdateItem(id, {
            code: value,
            name: foundName
          });
          return; // توقف هنا إذا وجدت تطابق كامل
        }
      } catch (error) {
        console.error('❌ خطأ في البحث برقم الصنف:', error);
      }
    }
    
    // تحديث نص البحث لتفعيل البحث التلقائي
    setSearchQuery(value);
  };

  /**
   * دالة اختيار صنف من نتائج البحث مع تحديث تلقائي للبيانات
   */
  const handleSelectSearchResult = async (result: any) => {
    if (editingItem) {
      const itemName = result.name || '';
      const itemCode = result.code || '';
      
      handleUpdateItem(editingItem, {
        code: itemCode,
        name: itemName
      });
    }
    
    // إخفاء نتائج البحث بعد الاختيار
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  /**
   * دالة إضافة مواصفة جديدة لصنف محدد
   */
  const handleAddSpecification = (itemId: string, key: string, value: string) => {
    setTempItemData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        specifications: {
          ...prev[itemId]?.specifications,
          [key]: value
        }
      }
    }));
  };

  /**
   * دالة حذف مواصفة من صنف محدد
   */
  const handleRemoveSpecification = (itemId: string, key: string) => {
    setTempItemData(prev => {
      const newSpecs = { ...prev[itemId]?.specifications };
      delete newSpecs[key];
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          specifications: newSpecs
        }
      };
    });
  };

  /**
   * دالة تحديث التكلفة التقديرية مع إعادة حساب المعادل وحفظ فوري
   */
  const handleUpdateEstimatedCost = (itemId: string, field: 'amount' | 'currency', value: any) => {
    setTempItemData(prev => {
      const currentCost = prev[itemId]?.estimatedCost || { amount: 0, currency: 'ريال', equivalentInYR: 0 };
      const updatedCost = { ...currentCost, [field]: value };
      
      // إعادة حساب المعادل بالريال عند تغيير المبلغ أو العملة
      if (field === 'amount' || field === 'currency') {
        updatedCost.equivalentInYR = calculateEquivalentInYR(
          field === 'amount' ? value : updatedCost.amount,
          field === 'currency' ? value : updatedCost.currency
        );
      }
      
      // تحديث التكلفة التقديرية في العنصر الرئيسي بشكل فوري
      const item = poItems.find(item => item.id === itemId);
      if (item) {
        handleUpdateItem(itemId, {
          estimatedCost: updatedCost
        });
      }
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          estimatedCost: updatedCost
        }
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200 print:mb-0 print-container">
      {/* رأس القسم مع إحصائيات */}
      <div className="flex items-center justify-between mb-4 print:mb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            <Package className="ml-2 icon" size={20} />
            الأصناف المطلوبة
          </h2>
          
          {/* عرض إحصائيات سريعة */}
          <div className="flex items-center gap-4 text-sm text-gray-600 print:hidden">
            <span>العدد: {poItems.length}</span>
            <span>المكتملة: {poItems.filter(item => item.name && item.quantity > 0).length}</span>
          </div>
        </div>
        
        <button
          onClick={handleAddItem}
          className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center shadow-sm print:hidden"
        >
          <Plus size={18} className="ml-1" />
          إضافة صنف
        </button>
      </div>
      
      {/* جدول الأصناف المحسن مع تقسيم الأعمدة الجديد */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="py-3 px-2 text-center font-semibold border border-gray-300" style={{ width: '5%' }}>
                السطر
              </th>
              
              {/* رقم الصنف مخفي عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300 print:hidden" style={{ width: '5%' }}>
                رقم الصنف
              </th>
              
              {/* تعديل: زيادة عرض عمود بيان الصنف عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300 print:py-1 print:border-2" style={{ width: '45%' }}>
                بيان الصنف
              </th>
              
              {/* تعديل: زيادة عرض عمود الكمية عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300" style={{ width: '10%' }}>
                الكمية
              </th>
              
              {/* تعديل: زيادة عرض عمود الوحدة عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300" style={{ width: '10%' }}>
                الوحدة
              </th>
              
              {/* تعديل: إخفاء عمود التكلفة التقديرية عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300 print:hidden" style={{ width: '12%' }}>
                التكلفة التقديرية
              </th>
              
              {/* تعديل: زيادة عرض عمود المواصفات عند الطباعة */}
              <th className="py-3 px-2 text-center font-semibold border border-gray-300" style={{ width: '30%' }}>
                المواصفات
              </th>
              
              <th className="py-3 px-2 text-center font-semibold border border-gray-300 print:hidden" style={{ width: '8%' }}>
                الإجراءات
              </th>
            </tr>
          </thead>
          
          <tbody>
            {poItems.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                {/* رقم السطر */}
                <td className="py-3 px-2 border border-gray-300 text-center print:py-1">
                  {/* حقل رقم السطر للعرض فقط ويتم تحديده تلقائياً */}
                  <span className="font-medium">{item.lineNumber}</span>
                </td>
                
                {/* رقم الصنف - مخفي عند الطباعة */}
                <td className="py-3 px-2 border border-gray-300 print:py-1 print:hidden">
                  {editingItem === item.id ? (
                    <input
                      type="text"
                      value={item.code || ''}
                      onChange={(e) => {
                        handleUpdateItem(item.id, { code: e.target.value });
                        // تفعيل البحث التلقائي عند إدخال رقم الصنف
                        setSearchQuery(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="رقم الصنف"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'Arial, sans-serif' }}>{item.code || '-'}</span>
                  )}
                </td>
                
                {/* بيان الصنف مع البحث المحسن ومساحة أكبر */}
                <td className="py-3 px-2 border border-gray-300 print:py-1 print:border-2 relative">
                  {editingItem === item.id ? (
                    <div className="relative" style={{ minWidth: '300px' }}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="ابحث برقم الصنف أو اسم الصنف..."
                        style={{ minWidth: '450px' }} // زيادة العرض الافتراضي
                      />
                      
                      {/* نتائج البحث التلقائي المحسنة مع مساحة أكبر */}
                      {showSearchResults && searchResults.length > 0 && (
                        // <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto min-w-[300px]">
                        // لزيادة مساحة البحث عدلت السطر السابق الى 
                        <div className="mt-1 max-h-60 overflow-auto border border-gray-400 rounded-md bg-white shadow-sm text-sm p-2">
                          {isSearching && (
                            <div className="p-3 text-center text-gray-500">
                              <Search className="w-4 h-4 animate-spin mx-auto mb-1" />
                              جاري البحث...
                            </div>
                          )}
                          
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              onClick={() => handleSelectSearchResult(result)}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm text-gray-800">
                                {result.name}
                              </div>
                              
                              {result.code && (
                                <div className="text-xs text-gray-500 mt-1">
                                  رقم الصنف: {result.code}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="break-words">{item.name}</span>
                  )}
                </td>
                
                {/* الكمية */}
                <td className="py-3 px-2 border border-gray-300 text-center print:py-1">
                  {editingItem === item.id ? (
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center border border-gray-300 rounded px-2 py-1 text-sm required"
                      min="1"
                      step="1"
                      required
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      placeholder="أدخل الكمية"
                    />
                  ) : (
                    <span style={{ fontFamily: 'Arial, sans-serif' }}>{item.quantity || '-'}</span>
                  )}
                </td>
                
                {/* وحدة القياس */}
                <td className="py-3 px-2 border border-gray-300 text-center print:py-1">
                  {editingItem === item.id ? (
                    <select
                      value={item.unit || ''}
                      onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm required"
                      required
                    >
                      <option value="">اختر الوحدة</option>
                      {/* قائمة منسدلة */}
                      {unitOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{item.unit || '-'}</span>
                  )}
                </td>
                
                {/* التكلفة التقديرية المحسنة - تظهر دائماً على الشاشة وتخفى عند الطباعة */}
                <td className="py-3 px-2 border border-gray-300 print:py-1 print:hidden">
                  {editingItem === item.id ? (
                    <div className="space-y-2">
                      {/* إدخال المبلغ والعملة */}
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={tempItemData[item.id]?.estimatedCost?.amount || 0}
                          onChange={(e) => handleUpdateEstimatedCost(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="flex-1 border border-gray-300 rounded px-1 py-1 text-xs"
                          placeholder="المبلغ"
                          min="0"
                          step="0.01"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        />
                        
                        <select
                          value={tempItemData[item.id]?.estimatedCost?.currency || 'ريال'}
                          onChange={(e) => handleUpdateEstimatedCost(item.id, 'currency', e.target.value)}
                          className="border border-gray-300 rounded px-1 py-1 text-xs"
                        >
                          <option value="ريال">ريال</option>
                          <option value="دولار">دولار</option>
                          <option value="ريال سعودي">ريال سعودي</option>
                          <option value="يورو">يورو</option>
                        </select>
                      </div>
                      
                      {/* عرض المعادل بالريال إذا كانت العملة أجنبية */}
                      {tempItemData[item.id]?.estimatedCost?.currency !== 'ريال' && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                          المعادل: {tempItemData[item.id]?.estimatedCost?.equivalentInYR?.toLocaleString() || 0} ريال
                          
                          {!priceOffers.some(offer => offer.currency === tempItemData[item.id]?.estimatedCost?.currency && offer.exchangeRate) && (
                            <div className="text-orange-600 mt-1">
                              ⚠️ لم يتم إدخال سعر صرف لهذه العملة في جدول العروض
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm">
                      {item.estimatedCost && item.estimatedCost.amount > 0 ? (
                        <>
                          <div style={{ fontFamily: 'Arial, sans-serif' }}>
                            {item.estimatedCost.amount.toLocaleString()} {item.estimatedCost.currency}
                          </div>
                          
                          {item.estimatedCost.currency !== 'ريال' && item.estimatedCost.equivalentInYR && (
                            <div className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                              ({item.estimatedCost.equivalentInYR.toLocaleString()} ريال)
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">غير محدد</span>
                      )}
                    </div>
                  )}
                </td>
                
                {/* المواصفات */}
                <td className="py-3 px-2 border border-gray-300 text-center print:py-1">
                  {editingItem === item.id ? (
                    <div className="space-y-1">
                      <div className="text-xs font-medium mb-1">المواصفات:</div>
                      
                      {Object.entries(tempItemData[item.id]?.specifications || {}).map(([key, value]) => (
                        <div key={key} className="text-xs bg-gray-50 p-1 rounded">
                          {key}: {value}
                        </div>
                      ))}
                      
                      <button
                        onClick={() => {
                          const newKey = prompt('اسم المواصفة الجديدة:');
                          if (newKey) {
                            handleAddSpecification(item.id, newKey, '');
                          }
                        }}
                        className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        إضافة مواصفة
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs">
                      {item.specifications && Object.keys(item.specifications).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(item.specifications).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-1 rounded">
                              {key}: {value}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">لا توجد</span>
                      )}
                    </div>
                  )}
                </td>
                
                {/* الإجراءات */}
                <td className="py-3 px-2 border border-gray-300 text-center print:hidden">
                  <div className="flex gap-1 justify-center">
                    {editingItem === item.id ? (
                      <>
                        <button
                          onClick={() => handleSaveItem(item.id)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="حفظ التعديلات"
                        >
                          <Save size={16} />
                        </button>
                        
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                          title="إلغاء التعديل"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="تعديل الصنف"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="حذف الصنف"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* زر عائم لإضافة الأصناف */}
      <button
        onClick={handleAddItem}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center print:hidden"
        title="إضافة صنف جديد"
      >
        <Plus size={24} />
      </button>
      
      {/* قسم تعديل المواصفات المفصل (يظهر عند التعديل) */}
      {editingItem && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 print:hidden">
          <h3 className="font-semibold mb-3 flex items-center">
            <FileText className="ml-2" size={18} />
            تفاصيل مواصفات الصنف
          </h3>
          
          {/* عرض وتعديل المواصفات الحالية */}
          <div className="space-y-3 mb-4">
            {Object.entries(tempItemData[editingItem]?.specifications || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center bg-white p-2 rounded border">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const specs = { ...tempItemData[editingItem]?.specifications };
                    delete specs[key];
                    specs[newKey] = value;
                    
                    setTempItemData(prev => ({
                      ...prev,
                      [editingItem]: {
                        ...prev[editingItem],
                        specifications: specs
                      }
                    }));
                  }}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                  placeholder="اسم المواصفة"
                />
                
                <span className="text-gray-500">:</span>
                
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleAddSpecification(editingItem, key, e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="القيمة المطلوبة"
                />
                
                <button
                  onClick={() => handleRemoveSpecification(editingItem, key)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  title="حذف المواصفة"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* إضافة مواصفة جديدة */}
          <button
            onClick={() => {
              const newKey = prompt('اسم المواصفة الجديدة (مثل: اللون، النوع، المادة):');
              if (newKey && newKey.trim()) {
                handleAddSpecification(editingItem, newKey.trim(), '');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            إضافة مواصفة جديدة
          </button>
        </div>
      )}
      
      {/* رسالة عدم وجود أصناف */}
      {poItems.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">لا توجد أصناف مطلوبة</p>
          <p className="text-sm mt-1">اضغط على "إضافة صنف" لبدء إضافة الأصناف المطلوبة</p>
        </div>
      )}
      
      {/* نصائح للاستخدام */}
      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
        <h4 className="font-medium text-blue-800 mb-2">💡 نصائح للاستخدام:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يمكنك البحث عن الأصناف برقم الصنف أو جزء من اسم الصنف</li>
          <li>• التكلفة التقديرية تحسب تلقائياً بالريال حسب أسعار الصرف المدخلة في جدول العروض</li>
          <li>• يمكن إضافة مواصفات متعددة لكل صنف (اللون، النوع، المادة، إلخ)</li>
          <li>• جميع التعديلات تحفظ تلقائياً في قاعدة البيانات</li>
        </ul>
      </div>
    </div>
  );
};


// في جدول الاصناف المطلوبة

//  أولا في جدول الاصناف المطلوبة
//  يتم جعل الكمية الافتراضية فارغة والزامي للادخال وكذلك حقل الوحدة ولا يتم الحفظ الا بعد ادخالهما  اما التكلفة التقديريه والمواصفات اختياريه
// يجب اخفاء عمود التكلفة التقديرية عند الطباعة
// يجب تحسين حدود خلايا عمود بيان الصنف عند الطباعة حيث انها  تظهر بحدود  اصغر من الحقول الاخرى خاصة الأصناف التي يتم أضافتها

// يجب زيادة حجم الاعمدة عند الطباعة لتكون وفق النسب التالية 
// السطر5%
// بيان الصنف45%
// الكمية10%
// الوحدة 10%
// المواصفات30%

// ==============================================


// ما تم عمله
// في صفحة الأصناف المطلوبة:
// تم جعل الكمية الافتراضية فارغة وإلزامية للإدخال.
// تم جعل حقل الوحدة فارغًا وإلزاميًا للإدخال.
// تم إخفاء عمود التكلفة التقديرية عند الطباعة.
// تم تحسين حدود خلايا عمود بيان الصنف عند الطباعة.
// تم زيادة حجم الأعمدة عند الطباعة وفق النسب المطلوبة.


