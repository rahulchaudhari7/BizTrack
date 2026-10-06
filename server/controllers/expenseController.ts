import { Response } from 'express';
import { Expense } from '../models/Expense.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { getCurrentFiscalYear, getLastFiscalYear } from '../utils/nepalDates.ts';

export async function getExpenses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      category,
      paymentMethod,
      isPersonal,
      search,
      dateRange,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const filter: any = { userId };

    if (isPersonal !== undefined && isPersonal !== '') {
      filter.isPersonal = isPersonal === 'true';
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { vendor: { $regex: search.trim(), $options: 'i' } },
        { billNumber: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Date range filtering
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filter.date = { $gte: start };
    } else if (dateRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      filter.date = { $gte: firstDay };
    } else if (dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.date = { $gte: start };
    } else if (dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (dateRange === 'this_fiscal_year') {
      const fy = getCurrentFiscalYear();
      filter.date = { $gte: fy.start, $lte: fy.end };
    } else if (dateRange === 'last_fiscal_year') {
      const lastFy = getLastFiscalYear();
      filter.date = { $gte: lastFy.start, $lte: lastFy.end };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const sortField = (sortBy as string) || 'date';
    const order = sortOrder === 'asc' ? 1 : -1;

    const expenses = await Expense.find(filter).sort({ [sortField]: order });
    res.json({ expenses });
  } catch (error: any) {
    console.error('getExpenses error:', error);
    res.status(500).json({ error: 'Unable to retrieve expenses.' });
  }
}

export async function getExpenseById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    res.json({ expense });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch expense details.' });
  }
}

export async function createExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { name, amount, date, category, paymentMethod, isPersonal, vendor, billNumber, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Expense name is required.' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0.' });
      return;
    }

    const expense = await Expense.create({
      userId,
      name: name.trim(),
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      category: category || (isPersonal ? 'Personal' : 'Other'),
      paymentMethod: paymentMethod || 'Cash',
      isPersonal: Boolean(isPersonal),
      vendor: vendor?.trim() || '',
      billNumber: billNumber?.trim() || '',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      message: 'Expense recorded successfully.',
      expense,
    });
  } catch (error: any) {
    console.error('createExpense error:', error);
    res.status(500).json({ error: 'Unable to save expense.' });
  }
}

export async function updateExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, amount, date, category, paymentMethod, isPersonal, vendor, billNumber, notes } = req.body;

    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404).json({ error: 'Expense record not found.' });
      return;
    }

    if (name) expense.name = name.trim();
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0.' });
        return;
      }
      expense.amount = parsedAmount;
    }
    if (date) expense.date = new Date(date);
    if (category) expense.category = category;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (isPersonal !== undefined) expense.isPersonal = Boolean(isPersonal);
    if (vendor !== undefined) expense.vendor = vendor.trim();
    if (billNumber !== undefined) expense.billNumber = billNumber.trim();
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    res.json({
      message: 'Expense updated successfully.',
      expense,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to update expense.' });
  }
}

export async function deleteExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await Expense.findOneAndDelete({ _id: id, userId });
    if (!result) {
      res.status(404).json({ error: 'Expense record not found.' });
      return;
    }

    res.json({ message: 'Expense deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete expense.' });
  }
}
