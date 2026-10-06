import { Response } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.ts';
import { Purchase } from '../models/Purchase.ts';
import { Expense } from '../models/Expense.ts';
import { Product } from '../models/Product.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { type, search, paymentMethod, dateRange, startDate, endDate, sortBy, sortOrder } = req.query;

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
    } else if (dateRange === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      dateFilter.$gte = start;
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    let items: Array<{
      id: string;
      originalId: string;
      type: 'Sale' | 'Purchase' | 'Business Expense' | 'Personal Expense';
      rawType: string;
      name: string;
      category: string;
      amount: number;
      date: Date;
      paymentMethod: string;
      status: string;
      isCredit: boolean;
      notes?: string;
      details?: any;
    }> = [];

    // Query Sales
    if (!type || type === 'All' || type === 'Sale') {
      const saleFilter: any = { userId };
      if (hasDateFilter) saleFilter.saleDate = dateFilter;
      if (paymentMethod && paymentMethod !== 'All') saleFilter.paymentMethod = paymentMethod;

      const sales = await Sale.find(saleFilter);
      sales.forEach((s) => {
        items.push({
          id: `sale_${s._id}`,
          originalId: s._id.toString(),
          type: 'Sale',
          rawType: 'sale',
          name: s.productName,
          category: 'Product Sale',
          amount: s.totalAmount,
          date: s.saleDate,
          paymentMethod: s.paymentMethod,
          status: 'Completed',
          isCredit: true,
          notes: s.notes,
          details: { quantity: s.quantity, price: s.sellingPrice, customer: s.customerName },
        });
      });
    }

    // Query Purchases
    if (!type || type === 'All' || type === 'Purchase') {
      const purchaseFilter: any = { userId };
      if (hasDateFilter) purchaseFilter.purchaseDate = dateFilter;
      if (paymentMethod && paymentMethod !== 'All') purchaseFilter.paymentMethod = paymentMethod;

      const purchases = await Purchase.find(purchaseFilter);
      purchases.forEach((p) => {
        items.push({
          id: `purchase_${p._id}`,
          originalId: p._id.toString(),
          type: 'Purchase',
          rawType: 'purchase',
          name: p.productName,
          category: 'Stock/Purchase',
          amount: p.totalPurchaseCost,
          date: p.purchaseDate,
          paymentMethod: p.paymentMethod || 'Bank',
          status: p.paymentStatus || 'Paid',
          isCredit: false,
          notes: p.notes,
          details: { quantity: p.quantity, price: p.purchasePrice, supplier: p.supplier },
        });
      });
    }

    // Query Expenses
    if (!type || type === 'All' || type === 'Business Expense' || type === 'Personal Expense') {
      const expenseFilter: any = { userId };
      if (hasDateFilter) expenseFilter.date = dateFilter;
      if (paymentMethod && paymentMethod !== 'All') expenseFilter.paymentMethod = paymentMethod;

      if (type === 'Business Expense') expenseFilter.isPersonal = false;
      if (type === 'Personal Expense') expenseFilter.isPersonal = true;

      const expenses = await Expense.find(expenseFilter);
      expenses.forEach((e) => {
        items.push({
          id: `expense_${e._id}`,
          originalId: e._id.toString(),
          type: e.isPersonal ? 'Personal Expense' : 'Business Expense',
          rawType: 'expense',
          name: e.name,
          category: e.category,
          amount: e.amount,
          date: e.date,
          paymentMethod: e.paymentMethod,
          status: 'Completed',
          isCredit: false,
          notes: e.notes,
        });
      });
    }

    // Search filter across items
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    // Sort items
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'amount') {
      items.sort((a, b) => (a.amount - b.amount) * order);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name) * order);
    } else {
      // Default: date
      items.sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * order);
    }

    res.json({ transactions: items, totalCount: items.length });
  } catch (error: any) {
    console.error('getTransactions error:', error);
    res.status(500).json({ error: 'Unable to retrieve transaction history.' });
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Parse prefix (e.g. sale_123, purchase_456, expense_789)
    const [rawType, originalId] = id.split('_');

    if (!originalId || !mongoose.Types.ObjectId.isValid(originalId)) {
      res.status(400).json({ error: 'Invalid transaction identifier.' });
      return;
    }

    if (rawType === 'sale') {
      const sale = await Sale.findOne({ _id: originalId, userId });
      if (sale && sale.productId) {
        const product = await Product.findOne({ _id: sale.productId, userId });
        if (product) {
          product.quantitySold = Math.max(0, (product.quantitySold || 0) - sale.quantity);
          product.currentStock = (product.currentStock || 0) + sale.quantity;
          await product.save();
        }
      }
      await Sale.deleteOne({ _id: originalId, userId });
      res.json({ message: 'Sale transaction deleted and stock restored.' });
      return;
    }

    if (rawType === 'purchase') {
      const purchase = await Purchase.findOne({ _id: originalId, userId });
      if (purchase && purchase.productId) {
        const product = await Product.findOne({ _id: purchase.productId, userId });
        if (product) {
          product.quantityPurchased = Math.max(0, (product.quantityPurchased || 0) - purchase.quantity);
          product.currentStock = Math.max(0, (product.currentStock || 0) - purchase.quantity);
          await product.save();
        }
      }
      await Purchase.deleteOne({ _id: originalId, userId });
      res.json({ message: 'Purchase transaction deleted and inventory adjusted.' });
      return;
    }

    if (rawType === 'expense') {
      await Expense.deleteOne({ _id: originalId, userId });
      res.json({ message: 'Expense transaction removed.' });
      return;
    }

    res.status(400).json({ error: 'Unknown transaction type.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete transaction.' });
  }
}
