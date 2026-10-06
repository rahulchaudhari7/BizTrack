import { Response } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.ts';
import { Expense } from '../models/Expense.ts';
import { Purchase } from '../models/Purchase.ts';
import { Product } from '../models/Product.ts';
import { Customer } from '../models/Customer.ts';
import { Supplier } from '../models/Supplier.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { getCurrentFiscalYear, getLastFiscalYear } from '../utils/nepalDates.ts';

export async function getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const user = req.user;
    const { dateRange, startDate, endDate } = req.query;

    const dateFilter: any = {};
    const now = new Date();

    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter.$gte = start;
    } else if (dateRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      dateFilter.$gte = firstDay;
    } else if (dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter.$gte = start;
    } else if (dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      dateFilter.$gte = start;
      dateFilter.$lte = end;
    } else if (dateRange === 'this_fiscal_year') {
      const fy = getCurrentFiscalYear();
      dateFilter.$gte = fy.start;
      dateFilter.$lte = fy.end;
    } else if (dateRange === 'last_fiscal_year') {
      const lastFy = getLastFiscalYear();
      dateFilter.$gte = lastFy.start;
      dateFilter.$lte = lastFy.end;
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Total Sales / Income
    const saleMatch: any = { userId };
    if (hasDateFilter) saleMatch.saleDate = dateFilter;

    const salesAgg = await Sale.aggregate([
      { $match: saleMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          subtotalSum: { $sum: '$subtotal' },
          vatCollected: { $sum: '$vatAmount' },
          totalUnitsSold: { $sum: '$quantity' },
          totalDiscount: { $sum: '$discount' },
          cogs: { $sum: { $multiply: ['$quantity', '$buyingPrice'] } },
          count: { $sum: 1 },
          totalReceived: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
    ]);

    const totalSales = salesAgg[0]?.totalSales || 0;
    const vatCollected = salesAgg[0]?.vatCollected || 0;
    const totalUnitsSold = salesAgg[0]?.totalUnitsSold || 0;
    const totalSalesCount = salesAgg[0]?.count || 0;
    const cogs = salesAgg[0]?.cogs || 0;

    // 2. Business Expenses & Personal Expenses
    const expenseMatch: any = { userId };
    if (hasDateFilter) expenseMatch.date = dateFilter;

    const expensesAgg = await Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: '$isPersonal',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let businessExpenses = 0;
    let personalExpenses = 0;
    expensesAgg.forEach((item) => {
      if (item._id === true) {
        personalExpenses = item.total;
      } else {
        businessExpenses = item.total;
      }
    });

    // 3. Purchase Costs
    const purchaseMatch: any = { userId };
    if (hasDateFilter) purchaseMatch.purchaseDate = dateFilter;

    const purchasesAgg = await Purchase.aggregate([
      { $match: purchaseMatch },
      {
        $group: {
          _id: null,
          totalPurchaseCost: { $sum: '$totalPurchaseCost' },
          vatPaid: { $sum: '$vatAmount' },
          totalUnitsPurchased: { $sum: '$quantity' },
          count: { $sum: 1 },
          totalPaid: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
    ]);
    const purchaseCosts = purchasesAgg[0]?.totalPurchaseCost || 0;
    const totalPurchasesCount = purchasesAgg[0]?.count || 0;

    // 4. Receivables (Customer Dues) & Payables (Supplier Dues)
    // Overall outstanding dues from all active sales & purchases
    const [receivablesAgg, payablesAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { userId, amountDue: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } },
      ]),
      Purchase.aggregate([
        { $match: { userId, amountDue: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } },
      ]),
    ]);

    const outstandingReceivables = receivablesAgg[0]?.total || 0;
    const outstandingPayables = payablesAgg[0]?.total || 0;

    // 5. Current Inventory Stock Value
    const products = await Product.find({ userId });
    let currentStockValue = 0;
    let totalSellingStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const defaultThreshold = user?.lowStockThreshold ?? 5;

    products.forEach((p) => {
      const stock = p.currentStock || 0;
      const minStock = p.minimumStock !== undefined ? p.minimumStock : defaultThreshold;
      currentStockValue += stock * (p.buyingPrice || 0);
      totalSellingStockValue += stock * (p.sellingPrice || 0);
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= minStock) {
        lowStockCount++;
      }
    });

    // 6. Professional Accrual Accounting Calculation:
    // Total Revenue = Completed Sales
    // COGS = Cost of goods sold (units sold * buying price)
    // Gross Profit = Total Sales - COGS
    // Net Profit = Gross Profit - Business Expenses
    // Personal expenses are isolated and NOT deducted from business profit
    const grossProfit = totalSales - cogs;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const netProfit = grossProfit - businessExpenses;
    const isProfit = netProfit >= 0;
    const netLoss = isProfit ? 0 : Math.abs(netProfit);
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Total Operating & Stock Costs for reference
    const totalBusinessCosts = businessExpenses + cogs;

    // Total Cash Expenses (all inclusive for cash tracking)
    const totalExpenses = businessExpenses + personalExpenses + purchaseCosts;

    // Current Cash Balance: Sales income minus actual cash outflows
    const currentBalance = totalSales - totalExpenses;

    // Recent 5 Transactions across all ledgers
    const [recentSales, recentPurchases, recentExpenses] = await Promise.all([
      Sale.find(saleMatch).sort({ saleDate: -1 }).limit(5),
      Purchase.find(purchaseMatch).sort({ purchaseDate: -1 }).limit(5),
      Expense.find(expenseMatch).sort({ date: -1 }).limit(5),
    ]);

    const combinedRecent = [
      ...recentSales.map((s) => ({
        id: s._id,
        invoiceNumber: s.invoiceNumber,
        type: 'Sale',
        name: `${s.productName} (${s.invoiceNumber})`,
        customer: s.customerName,
        category: 'Sale',
        amount: s.totalAmount,
        date: s.saleDate,
        paymentMethod: s.paymentMethod,
        status: s.paymentStatus,
        isCredit: true,
      })),
      ...recentPurchases.map((p) => ({
        id: p._id,
        billNumber: p.billNumber,
        type: 'Purchase',
        name: `${p.productName} (${p.supplier})`,
        category: 'Stock/Purchase',
        amount: p.totalPurchaseCost,
        date: p.purchaseDate,
        paymentMethod: p.paymentMethod || 'Cash',
        status: p.paymentStatus || 'Paid',
        isCredit: false,
      })),
      ...recentExpenses.map((e) => ({
        id: e._id,
        type: e.isPersonal ? 'Personal Expense' : 'Business Expense',
        name: e.name,
        category: e.category,
        amount: e.amount,
        date: e.date,
        paymentMethod: e.paymentMethod,
        status: 'Completed',
        isCredit: false,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    res.json({
      summary: {
        totalSales,
        cogs,
        grossProfit,
        grossMargin: Number(grossMargin.toFixed(2)),
        businessExpenses,
        personalExpenses,
        purchaseCosts,
        totalExpenses,
        totalBusinessCosts,
        netProfit,
        netLoss,
        isProfit,
        currentBalance,
        profitMargin: Number(profitMargin.toFixed(2)),
        outstandingReceivables,
        outstandingPayables,
        currentStockValue,
        totalSellingStockValue,
        vatCollected,
        vatEnabled: Boolean(user?.vatEnabled),
        totalUnitsSold,
        totalSalesCount,
        totalPurchasesCount,
        totalProductsCount: products.length,
        lowStockCount,
        outOfStockCount,
      },
      recentTransactions: combinedRecent,
    });
  } catch (error: any) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ error: 'Unable to calculate dashboard summary.' });
  }
}

export async function getMonthlyAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const monthsBack = 6;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

    const [monthlySales, monthlyExpenses, monthlyPurchases] = await Promise.all([
      Sale.aggregate([
        { $match: { userId, saleDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$saleDate' },
              month: { $month: '$saleDate' },
            },
            income: { $sum: '$totalAmount' },
            cogs: { $sum: { $multiply: ['$quantity', '$buyingPrice'] } },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              isPersonal: '$isPersonal',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: { userId, purchaseDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$purchaseDate' },
              month: { $month: '$purchaseDate' },
            },
            purchaseCost: { $sum: '$totalPurchaseCost' },
          },
        },
      ]),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeline: Array<{
      monthKey: string;
      label: string;
      year: number;
      month: number;
      income: number;
      cogs: number;
      grossProfit: number;
      businessExpense: number;
      personalExpense: number;
      purchaseCost: number;
      totalExpense: number;
      netProfit: number;
    }> = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m.toString().padStart(2, '0')}`;
      const label = `${monthNames[m - 1]} ${y}`;

      const s = monthlySales.find((item) => item._id.year === y && item._id.month === m);
      const income = s ? s.income : 0;
      const mCogs = s ? s.cogs : 0;
      const grossProfit = income - mCogs;

      const p = monthlyPurchases.find((item) => item._id.year === y && item._id.month === m);
      const purchaseCost = p ? p.purchaseCost : 0;

      const bExp = monthlyExpenses.find(
        (item) => item._id.year === y && item._id.month === m && item._id.isPersonal === false
      );
      const businessExpense = bExp ? bExp.total : 0;

      const pExp = monthlyExpenses.find(
        (item) => item._id.year === y && item._id.month === m && item._id.isPersonal === true
      );
      const personalExpense = pExp ? pExp.total : 0;

      const totalExpense = businessExpense + personalExpense + purchaseCost;
      const netProfit = grossProfit - businessExpense;

      timeline.push({
        monthKey: key,
        label,
        year: y,
        month: m,
        income,
        cogs: mCogs,
        grossProfit,
        businessExpense,
        personalExpense,
        purchaseCost,
        totalExpense,
        netProfit,
      });
    }

    res.json({ monthlyData: timeline });
  } catch (error: any) {
    console.error('getMonthlyAnalytics error:', error);
    res.status(500).json({ error: 'Unable to retrieve monthly financial analytics.' });
  }
}

export async function getCategoryAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const expenseCategories = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const purchaseTotalAgg = await Purchase.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPurchaseCost' },
          count: { $sum: 1 },
        },
      },
    ]);
    const purchaseTotal = purchaseTotalAgg[0]?.total || 0;
    const purchaseCount = purchaseTotalAgg[0]?.count || 0;

    const categories = expenseCategories.map((c) => ({
      name: c._id || 'Other',
      value: c.total,
      count: c.count,
    }));

    if (purchaseTotal > 0) {
      const existingIdx = categories.findIndex((c) => c.name === 'Product / Stock');
      if (existingIdx >= 0) {
        categories[existingIdx].value += purchaseTotal;
        categories[existingIdx].count += purchaseCount;
      } else {
        categories.unshift({
          name: 'Product / Stock',
          value: purchaseTotal,
          count: purchaseCount,
        });
      }
    }

    res.json({ categories });
  } catch (error: any) {
    console.error('getCategoryAnalytics error:', error);
    res.status(500).json({ error: 'Unable to retrieve category analytics.' });
  }
}

export async function getPaymentMethodAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Sales by payment method
    const salesByPayment = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Expenses by payment method
    const expensesByPayment = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      salesPaymentMethods: salesByPayment.map((s) => ({ method: s._id || 'Cash', total: s.total, count: s.count })),
      expensePaymentMethods: expensesByPayment.map((e) => ({ method: e._id || 'Cash', total: e.total, count: e.count })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to retrieve payment method analytics.' });
  }
}

export async function getProductPerformance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const salesByProduct = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$productName',
          productId: { $first: '$productId' },
          totalUnitsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: { $multiply: ['$quantity', '$buyingPrice'] } },
        },
      },
      {
        $project: {
          productName: '$_id',
          productId: 1,
          totalUnitsSold: 1,
          totalRevenue: 1,
          totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
    ]);

    const allProducts = await Product.find({ userId });

    const enrichedPerformance = allProducts.map((p) => {
      const sales = salesByProduct.find((s) => s.productName.toLowerCase() === p.name.toLowerCase());
      const unitsSold = sales?.totalUnitsSold || p.quantitySold || 0;
      const revenue = sales?.totalRevenue || (unitsSold * p.sellingPrice);
      const profit = sales?.totalProfit || (unitsSold * (p.sellingPrice - p.buyingPrice));

      return {
        id: p._id,
        name: p.name,
        category: p.category,
        unit: p.unit || 'Piece',
        buyingPrice: p.buyingPrice,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        totalUnitsSold: unitsSold,
        totalRevenue: revenue,
        totalProfit: profit,
        profitMargin: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
      };
    });

    const bestSelling = [...enrichedPerformance].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)[0] || null;
    const highestProfit = [...enrichedPerformance].sort((a, b) => b.totalProfit - a.totalProfit)[0] || null;
    const lowestProfit = [...enrichedPerformance]
      .filter((p) => p.totalUnitsSold > 0)
      .sort((a, b) => a.totalProfit - b.totalProfit)[0] || null;

    res.json({
      performanceList: enrichedPerformance,
      highlights: {
        bestSelling,
        highestProfit,
        lowestProfit,
      },
    });
  } catch (error: any) {
    console.error('getProductPerformance error:', error);
    res.status(500).json({ error: 'Unable to retrieve product performance analysis.' });
  }
}
