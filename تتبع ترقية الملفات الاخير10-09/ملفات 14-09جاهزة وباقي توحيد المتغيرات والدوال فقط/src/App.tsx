import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';
import { PurchaseOrderSystem } from './components/PurchaseOrderSystem';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-right" dir="rtl">
      <PurchaseOrderProvider>
        <Layout>
          <PurchaseOrderSystem />
        </Layout>
      </PurchaseOrderProvider>
    </div>
  );
}

export default App;