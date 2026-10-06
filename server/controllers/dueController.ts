import { Response } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.ts';
import { Purchase } from '../models/Purchase.ts';
import { Customer } from '../models/Customer.ts';
import { Supplier } from '../models/Supplier.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getDueSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // 1. Receivables (Customer Dues from Sales)
    const receivableSales = await Sale.find({
      userId,
      amountDue: { $gt: 0 },
    }).sort({ saleDate: -1 });

    const totalReceivable = receivableSales.reduce((acc, s) => acc + (s.amountDue || 0), 0);

    // Group receivables by customer
    const customerMap: Record<string, {
      customerId?: string;
      customerName: string;
      customerPhone?: string;
      totalDue: number;
      pendingInvoices: number;
      lastDate: Date;
    }> = {};

    receivableSales.forEach((s) => {
      const key = s.customerId ? s.customerId.toString() : s.customerName.toLowerCase();
      if (!customerMap[key]) {
        customerMap[key] = {
          customerId: s.customerId ? s.customerId.toString() : undefined,
          customerName: s.customerName || 'Walk-in Customer',
          customerPhone: s.customerPhone,
          totalDue: 0,
          pendingInvoices: 0,
          lastDate: s.saleDate,
        };
      }
      customerMap[key].totalDue += s.amountDue;
      customerMap[key].pendingInvoices += 1;
      if (new Date(s.saleDate) > new Date(customerMap[key].lastDate)) {
        customerMap[key].lastDate = s.saleDate;
      }
    });

    const customerDues = Object.values(customerMap).sort((a, b) => b.totalDue - a.totalDue);

    // 2. Payables (Supplier Dues from Purchases)
    const payablePurchases = await Purchase.find({
      userId,
      amountDue: { $gt: 0 },
    }).sort({ purchaseDate: -1 });

    const totalPayable = payablePurchases.reduce((acc, p) => acc + (p.amountDue || 0), 0);

    // Group payables by supplier
    const supplierMap: Record<string, {
      supplierId?: string;
      supplierName: string;
      supplierPhone?: string;
      totalDue: number;
      pendingBills: number;
      lastDate: Date;
    }> = {};

    payablePurchases.forEach((p) => {
      const key = p.supplierId ? p.supplierId.toString() : p.supplier.toLowerCase();
      if (!supplierMap[key]) {
        supplierMap[key] = {
          supplierId: p.supplierId ? p.supplierId.toString() : undefined,
          supplierName: p.supplier || 'General Supplier',
          supplierPhone: p.supplierPhone,
          totalDue: 0,
          pendingBills: 0,
          lastDate: p.purchaseDate,
        };
      }
      supplierMap[key].totalDue += p.amountDue;
      supplierMap[key].pendingBills += 1;
      if (new Date(p.purchaseDate) > new Date(supplierMap[key].lastDate)) {
        supplierMap[key].lastDate = p.purchaseDate;
      }
    });

    const supplierDues = Object.values(supplierMap).sort((a, b) => b.totalDue - a.totalDue);

    res.json({
      summary: {
        totalReceivable,
        totalPayable,
        netDueBalance: totalReceivable - totalPayable,
        receivableInvoicesCount: receivableSales.length,
        payableBillsCount: payablePurchases.length,
      },
      customerDues,
      supplierDues,
      receivableSales,
      payablePurchases,
    });
  } catch (error: any) {
    console.error('getDueSummary error:', error);
    res.status(500).json({ error: 'Unable to retrieve dues overview.' });
  }
}

export async function settleSaleDue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amountPaid, paymentMethod, notes } = req.body;

    const payment = Number(amountPaid);
    if (isNaN(payment) || payment <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0.' });
      return;
    }

    const sale = await Sale.findOne({ _id: id, userId });
    if (!sale) {
      res.status(404).json({ error: 'Sale record not found.' });
      return;
    }

    if (sale.amountDue <= 0) {
      res.status(400).json({ error: 'This sale has already been fully paid.' });
      return;
    }

    const newAmountPaid = (sale.amountPaid || 0) + payment;
    const newAmountDue = Math.max(0, sale.totalAmount - newAmountPaid);
    const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partially Paid';

    sale.amountPaid = newAmountPaid;
    sale.amountDue = newAmountDue;
    sale.paymentStatus = newStatus;
    if (paymentMethod) sale.paymentMethod = paymentMethod;
    if (notes) sale.notes = `${sale.notes ? sale.notes + ' | ' : ''}Payment of रु ${payment} received via ${paymentMethod || 'Cash'}`;

    await sale.save();

    // Update customer due if linked
    if (sale.customerId) {
      const customer = await Customer.findOne({ _id: sale.customerId, userId });
      if (customer) {
        customer.totalDue = Math.max(0, (customer.totalDue || 0) - payment);
        await customer.save();
      }
    }

    res.json({
      message: `Due payment of रु ${payment} recorded successfully.`,
      sale,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record due settlement.' });
  }
}

export async function settlePurchaseDue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amountPaid, paymentMethod, notes } = req.body;

    const payment = Number(amountPaid);
    if (isNaN(payment) || payment <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0.' });
      return;
    }

    const purchase = await Purchase.findOne({ _id: id, userId });
    if (!purchase) {
      res.status(404).json({ error: 'Purchase record not found.' });
      return;
    }

    if (purchase.amountDue <= 0) {
      res.status(400).json({ error: 'This purchase has already been fully paid.' });
      return;
    }

    const newAmountPaid = (purchase.amountPaid || 0) + payment;
    const newAmountDue = Math.max(0, purchase.totalPurchaseCost - newAmountPaid);
    const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partially Paid';

    purchase.amountPaid = newAmountPaid;
    purchase.amountDue = newAmountDue;
    purchase.paymentStatus = newStatus;
    if (paymentMethod) purchase.paymentMethod = paymentMethod;
    if (notes) purchase.notes = `${purchase.notes ? purchase.notes + ' | ' : ''}Payment of रु ${payment} sent via ${paymentMethod || 'Bank Transfer'}`;

    await purchase.save();

    // Update supplier due if linked
    if (purchase.supplierId) {
      const supplier = await Supplier.findOne({ _id: purchase.supplierId, userId });
      if (supplier) {
        supplier.totalDue = Math.max(0, (supplier.totalDue || 0) - payment);
        await supplier.save();
      }
    }

    res.json({
      message: `Supplier payment of रु ${payment} recorded successfully.`,
      purchase,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record purchase due settlement.' });
  }
}
