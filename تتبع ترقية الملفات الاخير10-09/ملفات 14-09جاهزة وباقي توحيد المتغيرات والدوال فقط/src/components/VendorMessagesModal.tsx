// مكون إدارة رسائل الموردين والشؤون المالية
// src/components/VendorMessagesModal.tsx

import React, { useState } from 'react';
import { Mail, Copy, Send, FileText, X, CheckCircle } from 'lucide-react';
import { usePurchaseOrder } from '../context/PurchaseOrderContext';

interface VendorMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VendorMessagesModal: React.FC<VendorMessagesModalProps> = ({ isOpen, onClose }) => {
  const { generateVendorMessages } = usePurchaseOrder();
  const [activeTab, setActiveTab] = useState<'awarded' | 'excluded' | 'financial'>('awarded');
  const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const messages = generateVendorMessages();

  /**
   * دالة نسخ الرسالة إلى الحافظة مع تأكيد بصري
   */
  const copyToClipboard = async (message: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessages(prev => new Set([...prev, messageId]));
      
      // إزالة التأكيد بعد 3 ثوان
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      // طريقة بديلة للنسخ
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedMessages(prev => new Set([...prev, messageId]));
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* رأس النافذة */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <Mail className="ml-2" size={24} />
            إدارة رسائل الموردين والشؤون المالية
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* شريط التبويب */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('awarded')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'awarded'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              الموردين المرسى عليهم ({messages.awarded.length})
            </button>
            <button
              onClick={() => setActiveTab('excluded')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'excluded'
                  ? 'bg-red-50 text-red-700 border-b-2 border-red-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              الموردين المستبعدين ({messages.excluded.length})
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'financial'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              الشؤون المالية
            </button>
          </div>
        </div>

        {/* محتوى الرسائل */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* رسائل الموردين المرسى عليهم */}
          {activeTab === 'awarded' && (
            <div className="space-y-4">
              {messages.awarded.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد موردين مرسى عليهم</p>
                </div>
              ) : (
                messages.awarded.map((msg, index) => (
                  <div key={`awarded-${index}`} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <CheckCircle className="ml-2" size={18} />
                        رسالة ترسية إلى: {msg.vendor}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(msg.message, `awarded-${msg.vendor}`)}
                        className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                          copiedMessages.has(`awarded-${msg.vendor}`)
                            ? 'bg-green-600 text-white'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {copiedMessages.has(`awarded-${msg.vendor}`) ? (
                          <>
                            <CheckCircle size={14} />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            نسخ الرسالة
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={msg.message}
                      readOnly
                      className="w-full h-48 border border-green-300 rounded p-3 text-sm bg-white resize-none"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* رسائل الموردين المستبعدين */}
          {activeTab === 'excluded' && (
            <div className="space-y-4">
              {messages.excluded.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد موردين مستبعدين</p>
                </div>
              ) : (
                messages.excluded.map((msg, index) => (
                  <div key={`excluded-${index}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-red-800 flex items-center">
                        <X className="ml-2" size={18} />
                        رسالة اعتذار إلى: {msg.vendor}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(msg.message, `excluded-${msg.vendor}`)}
                        className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                          copiedMessages.has(`excluded-${msg.vendor}`)
                            ? 'bg-red-600 text-white'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {copiedMessages.has(`excluded-${msg.vendor}`) ? (
                          <>
                            <CheckCircle size={14} />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            نسخ الرسالة
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={msg.message}
                      readOnly
                      className="w-full h-48 border border-red-300 rounded p-3 text-sm bg-white resize-none"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* رسالة الشؤون المالية */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-800 flex items-center">
                    <FileText className="ml-2" size={18} />
                    رسالة إلى: إدارة الشؤون المالية
                  </h3>
                  <button
                    onClick={() => copyToClipboard(messages.financial, 'financial')}
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                      copiedMessages.has('financial')
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copiedMessages.has('financial') ? (
                      <>
                        <CheckCircle size={14} />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        نسخ الرسالة
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={messages.financial}
                  readOnly
                  className="w-full h-64 border border-blue-300 rounded p-3 text-sm bg-white resize-none"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 يمكنك نسخ الرسائل واستخدامها في البريد الإلكتروني أو الواتساب
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};