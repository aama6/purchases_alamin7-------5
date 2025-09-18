// مكون معالجة الأخطاء
// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * مكون معالجة الأخطاء - يلتقط الأخطاء في التطبيق ويعرض واجهة بديلة
 * يمنع تعطل التطبيق بالكامل عند حدوث خطأ في مكون فرعي
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // التقاط الأخطاء وتحديث الحالة
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  // تسجيل تفاصيل الخطأ
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('خطأ في التطبيق:', error);
    console.error('معلومات الخطأ:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  // إعادة تعيين حالة الخطأ
  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              حدث خطأ غير متوقع
            </h1>
            
            <p className="text-gray-600 mb-6">
              نعتذر، حدث خطأ في التطبيق. يرجى المحاولة مرة أخرى.
            </p>
            
            {/* تفاصيل الخطأ للمطورين */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">تفاصيل الخطأ</summary>
                <pre className="mt-2 whitespace-pre-wrap text-red-600">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                المحاولة مرة أخرى
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}