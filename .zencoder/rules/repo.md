---
description: Repository Information Overview
alwaysApply: true
---

# Purchase Order System Information

## Summary
An advanced purchase order management system built with React, TypeScript, and Electron. The application provides a comprehensive interface for managing purchase orders, price offers, and vendor evaluations. It features a right-to-left (RTL) interface with Arabic language support.

## Structure
- **src/**: Main React application source code
  - **components/**: UI components for the purchase order system
  - **context/**: React context providers for state management
  - **hooks/**: Custom React hooks
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions and database operations
- **electron/**: Electron configuration for desktop application
- **PurchaseOrders/**: Data files for purchase orders
- **صفحات نسخة5/**: Additional pages for version 5 of the application

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.2.2
**Build System**: Vite 6.3.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.2.0
- React DOM 18.2.0
- Dexie 3.2.4 (IndexedDB wrapper)
- Electron Store 8.1.0
- XLSX 0.18.5 (Excel file handling)
- Moment 2.30.1 (Date handling)
- Lucide React 0.294.0 (Icons)

**Development Dependencies**:
- Vite 6.3.5
- TypeScript 5.2.2
- Electron 28.0.0
- Electron Builder 24.9.1
- TailwindCSS 3.3.5
- ESLint 8.53.0

## Build & Installation
```bash
# Development
npm run dev                # Run Vite development server
npm run electron:dev       # Run Electron app in development mode

# Production
npm run build              # Build React app
npm run electron:build     # Build Electron desktop application
```

## Electron Configuration
**Main File**: electron/main.js
**Build Configuration**: Configured in package.json under "build" section
**Output Directory**: dist_electron
**Target Platform**: Windows (NSIS installer)
**Features**:
- Custom installer options
- Desktop and Start Menu shortcuts
- Application icon support

## Data Storage
**Database**: IndexedDB (via Dexie.js)
**Schema Version**: 310
**Main Tables**:
- purchase_orders: Main purchase order data
- priceOffers: Vendor price offers
- excludedOffers: Rejected vendor offers
- items: Purchase order line items

## Application Features
- Purchase order creation and management
- Vendor price offer comparison
- Offer evaluation and recommendation generation
- Excel file import/export
- Arabic language support with RTL interface
- Offline data storage with IndexedDB