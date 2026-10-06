# BizTrack – Business Expense & Profit Manager

**BizTrack** is an enterprise-grade, full-stack business finance, inventory, and net profit management system designed for small and medium business owners, retailers, and entrepreneurs. It eliminates manual spreadsheet bookkeeping by unifying daily sales, vendor purchases, commercial operating expenses, personal expenses, and product inventory into one real-time automated financial dashboard.

---

## Key Features

1. **Complete Authentication & User Isolation**
   - User Registration and Login secured with bcrypt password hashing and JSON Web Tokens (JWT).
   - Strict multi-tenant data isolation: users only see their own expenses, products, purchases, sales, and analytics.
   - Built-in one-click **Interactive Demo Account** with realistic business inventory and financial transactions.

2. **Executive Financial Dashboard**
   - Real-time financial summary cards:
     - **Total Income (Sales Revenue)**
     - **Total Business Expenses**
     - **Total Personal Expenses (Isolated)**
     - **Total Product / Stock Purchase Cost**
     - **Net Profit & Net Loss Indicator** (with live margin %)
     - **Current Balance**
   - Quick date filters: Today, This Week, This Month, Last Month, This Year, and Custom Date Ranges.
   - Interactive Recharts: 6-month Revenue vs Expense comparison and Category Donut chart.
   - Instant quick-add modals for Sales, Expenses, Purchases, and Products.

3. **Expense Management & Accounting Separation**
   - Track expenses with name, amount, date, category, payment method, and description notes.
   - Categories: Product/Stock, Transport, Salary, Rent, Marketing, Electricity, Food, Personal, Office, Other.
   - Payment Methods: Cash, Bank, UPI, Card, Other.
   - **Personal vs Business Distinction**: Personal expenses are isolated so business COGS and profit margins remain mathematically pure.
   - Filter by type, category, date, and payment method; sort by date and amount.
   - Export expenses ledger directly to CSV.

4. **Product Inventory & Stock Tracking**
   - Complete inventory management: SKU, Buying Price, Selling Price, Total Purchased, Total Sold, Current Stock, Supplier, and Notes.
   - Live automated calculations:
     - $\text{Total Investment} = \text{Buying Price} \times \text{Quantity Purchased}$
     - $\text{Revenue} = \text{Selling Price} \times \text{Quantity Sold}$
     - $\text{Profit Per Unit} = \text{Selling Price} - \text{Buying Price}$
     - $\text{Potential Profit} = \text{Profit Per Unit} \times \text{Quantity Sold}$
     - $\text{Current Stock} = \text{Quantity Purchased} - \text{Quantity Sold}$
   - Configurable low-stock alert warnings and out-of-stock badges.
   - Quick "Sell" and "Restock" actions directly on inventory rows.

5. **Sales & Income Tracking**
   - Record customer sales with automated stock decrements and revenue updates.
   - Validates that sale quantities do not exceed available on-hand stock.
   - Captures optional customer name, payment method, and invoice notes.
   - Reverting/deleting a sale restores inventory stock automatically.
   - Export sales to CSV.

6. **Purchase / Procurement Management**
   - Record supplier stock purchases with automated stock increments and cost outlays.
   - Tracks payment status (Paid, Pending, Partial) and supplier vendor details.
   - Deleting a purchase adjusts stock downwards automatically.
   - Export purchases to CSV.

7. **Unified Transactions Journal**
   - Consolidated chronological audit trail across Sales, Stock Purchases, Business Expenses, and Personal Drawls.
   - Global search, multi-factor filtering, and CSV export.

8. **Reports, Analytics & PDF Export**
   - Monthly revenue, expenses, and net profit charts.
   - Best-selling product, highest-profit product, and lowest-profit product highlights.
   - One-click **Comprehensive PDF Financial Report** generation using `jspdf` and `jspdf-autotable`.

9. **Customizable Settings**
   - Configure Business / Store Trade Name.
   - Base Currency selection: INR (₹), USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$), AED.
   - Custom low-stock threshold.
   - Password update with old-password verification.
   - Demo data seeder trigger.

---

## Tech Stack

### Frontend
- **React.js 19**
- **Vite 8**
- **Tailwind CSS 4**
- **React Router 7**
- **Axios**
- **Recharts**
- **Lucide React** (Crisp vector icons)
- **jsPDF & jspdf-autotable** (Client-side PDF report compilation)

### Backend
- **Node.js** & **Express.js**
- **MongoDB** with **Mongoose ODM**
- **mongodb-memory-server** (Embedded zero-setup development engine with instant fallback)
- **JWT (jsonwebtoken)**
- **bcryptjs** (Password hashing)
- **dotenv** & **CORS**

---

## Folder Structure

```
├── server/
│   ├── controllers/
│   │   ├── authController.ts         # User auth, register, login, profile, demo
│   │   ├── dashboardController.ts    # Financial summaries, monthly charts, performance
│   │   ├── expenseController.ts      # Expense CRUD and filters
│   │   ├── productController.ts      # Inventory and stock math
│   │   ├── purchaseController.ts     # Vendor procurement and stock addition
│   │   ├── saleController.ts         # Sales recording and stock reduction
│   │   └── transactionController.ts  # Consolidated journal audit
│   ├── middleware/
│   │   └── auth.ts                   # JWT verification middleware
│   ├── models/
│   │   ├── Expense.ts                # Mongoose Expense schema
│   │   ├── Product.ts                # Mongoose Product schema
│   │   ├── Purchase.ts               # Mongoose Purchase schema
│   │   ├── Sale.ts                   # Mongoose Sale schema
│   │   └── User.ts                   # Mongoose User schema
│   ├── routes/
│   │   └── api.ts                    # Consolidated Express REST endpoints
│   ├── utils/
│   │   └── seedData.ts               # Demo data generator
│   └── db.ts                         # Mongoose database connector
├── src/
│   ├── components/
│   │   ├── DateRangeFilter.tsx       # Date range selector (Today, Month, Custom)
│   │   ├── ExpenseModal.tsx          # Record / edit expense dialog
│   │   ├── Modal.tsx                 # Base accessible modal wrapper
│   │   ├── Navbar.tsx                # Sticky topbar with quick actions
│   │   ├── ProductModal.tsx          # Product inventory dialog with live calculations
│   │   ├── PurchaseModal.tsx         # Supplier restock purchase dialog
│   │   ├── SaleModal.tsx             # Sale logging dialog with stock validation
│   │   ├── Sidebar.tsx               # Responsive sidebar & mobile drawer
│   │   └── StatCard.tsx              # Executive KPI metric card
│   ├── context/
│   │   └── AuthContext.tsx           # Authentication state & session manager
│   ├── pages/
│   │   ├── Auth.tsx                  # Login, Register & 1-Click Demo
│   │   ├── Dashboard.tsx             # Main executive financial dashboard
│   │   ├── Expenses.tsx              # Expense ledger & category breakdown
│   │   ├── PersonalExpenses.tsx      # Owner isolated personal spendings
│   │   ├── Products.tsx              # Inventory & warehouse catalog
│   │   ├── Purchases.tsx             # Stock procurement history
│   │   ├── Reports.tsx               # Analytics & PDF report exporter
│   │   ├── Sales.tsx                 # Sales records & income tracking
│   │   ├── Settings.tsx              # Business profile, currency, threshold
│   │   └── Transactions.tsx          # Unified general journal
│   ├── services/
│   │   └── api.ts                    # Axios client with JWT interceptor
│   ├── utils/
│   │   └── formatters.ts             # Currency, date, CSV, and PDF generators
│   ├── App.tsx                       # React application router
│   ├── index.css                     # Tailwind styling & typography
│   ├── main.tsx                      # Vite React entry point
│   └── types.ts                      # TypeScript interfaces
├── server.ts                         # Full-stack Express + Vite server entry
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Remote MongoDB connection string.
# If omitted, BizTrack automatically boots a zero-friction embedded MongoDB instance.
MONGO_URI=""

# JWT Secret for signing session tokens
JWT_SECRET="biztrack_jwt_super_secure_secret_key_change_in_production"

# Port (defaults to 3000)
PORT=3000
```

---

## Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the unified full-stack application (starts Express server with Vite middleware on port 3000):
```bash
npm run dev
```

### 3. Production Build
Build client assets:
```bash
npm run build
```

Run in production mode:
```bash
npm start
```

---

## REST API Overview

### Authentication
- `POST /api/auth/register` - Create account (with optional demo data seed)
- `POST /api/auth/login` - Authenticate with email and password
- `POST /api/auth/demo` - 1-Click interactive demo login
- `GET /api/auth/me` - Get current authenticated user profile
- `PUT /api/auth/profile` - Update business name, currency, low-stock threshold
- `PUT /api/auth/password` - Change account password
- `POST /api/auth/seed-demo` - Load demo inventory and transactions into current account

### Expenses
- `GET /api/expenses` - Retrieve expenses (supports search, category, dateRange, isPersonal, sort)
- `POST /api/expenses` - Create expense record
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Products
- `GET /api/products` - Retrieve products with stock level and realized profit calculations
- `POST /api/products` - Add product to inventory
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product details or stock
- `DELETE /api/products/:id` - Remove product from inventory

### Sales
- `GET /api/sales` - Retrieve sales records
- `POST /api/sales` - Record customer sale (decrements stock, increments income)
- `GET /api/sales/:id` - Get sale details
- `DELETE /api/sales/:id` - Delete sale (restores product stock)

### Purchases
- `GET /api/purchases` - Retrieve stock restock purchases
- `POST /api/purchases` - Record supplier purchase (increments stock, updates buying price)
- `GET /api/purchases/:id` - Get purchase details
- `DELETE /api/purchases/:id` - Delete purchase (adjusts stock downwards)

### Dashboard & Analytics
- `GET /api/dashboard/summary` - Aggregate metrics (Income, Expenses, Net Profit, Balance, Margin)
- `GET /api/dashboard/monthly` - 6-Month trajectory of income, expenses, and profit
- `GET /api/dashboard/categories` - Expense category distribution
- `GET /api/dashboard/products` - Top selling, highest profit, and lowest profit product analysis

### Transactions
- `GET /api/transactions` - Unified audit journal across all types
- `DELETE /api/transactions/:id` - Delete specific transaction with automatic side-effect reversal

---

## Screenshots Placeholder
| Dashboard | Inventory & Products |
|---|---|
| ![Dashboard Overview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80) | ![Inventory Tracking](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80) |

---

## Future Improvements
- Multi-currency conversion via real-time exchange rate API.
- Barcode / QR code scanner for mobile camera stock checking.
- Automated low-stock email alerts and vendor purchase order generation.
- Customer ledger and accounts receivable (invoicing & partial payments tracking).
