import { Response } from 'express';
import mongoose from 'mongoose';
import { Purchase } from '../models/Purchase.ts';
import { Product } from '../models/Product.ts';
import { Supplier } from '../models/Supplier.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { getCurrentFiscalYear, getLastFiscalYear } from '../utils/nepalDates.ts';

export async function getPurchases(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      productId,
      supplierId,
      paymentStatus,
      search,
      dateRange,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const filter: any = { userId };

    if (productId && productId !== 'All') {
      filter.productId = productId;
    }

    if (supplierId && supplierId !== 'All') {
      filter.supplierId = supplierId;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { productName: { $regex: search.trim(), $options: 'i' } },
        { supplier: { $regex: search.trim(), $options: 'i' } },
        { supplierPhone: { $regex: search.trim(), $options: 'i' } },
        { billNumber: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Date range filtering
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filter.purchaseDate = { $gte: start };
    } else if (dateRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      filter.purchaseDate = { $gte: firstDay };
    } else if (dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.purchaseDate = { $gte: start };
    } else if (dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      filter.purchaseDate = { $gte: start, $lte: end };
    } else if (dateRange === 'this_fiscal_year') {
      const fy = getCurrentFiscalYear();
      filter.purchaseDate = { $gte: fy.start, $lte: fy.end };
    } else if (dateRange === 'last_fiscal_year') {
      const lastFy = getLastFiscalYear();
      filter.purchaseDate = { $gte: lastFy.start, $lte: lastFy.end };
    } else if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }

    const sortField = (sortBy as string) || 'purchaseDate';
    const order = sortOrder === 'asc' ? 1 : -1;

    const purchases = await Purchase.find(filter).sort({ [sortField]: order });
    res.json({ purchases });
  } catch (error: any) {
    console.error('getPurchases error:', error);
    res.status(500).json({ error: 'Unable to retrieve purchase records.' });
  }
}

export async function getPurchaseById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOne({ _id: id, userId });
    if (!purchase) {
      res.status(404).json({ error: 'Purchase record not found.' });
      return;
    }

    res.json({ purchase });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch purchase details.' });
  }
}

export async function createPurchase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const user = req.user;
    const {
      billNumber,
      productId,
      productName,
      supplierId,
      supplier,
      supplierPhone,
      supplierPan,
      quantity,
      unit,
      purchasePrice,
      isVatApplicable,
      vatRate,
      purchaseDate,
      paymentStatus,
      paymentMethod,
      amountPaid,
      notes,
    } = req.body;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: 'Quantity must be greater than 0.' });
      return;
    }

    const price = Number(purchasePrice);
    if (isNaN(price) || price < 0) {
      res.status(400).json({ error: 'Purchase price cannot be negative.' });
      return;
    }

    let finalProductName = productName?.trim();
    let productDoc: any = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      productDoc = await Product.findOne({ _id: productId, userId });
      if (productDoc) {
        finalProductName = productDoc.name;
      }
    }

    if (!finalProductName) {
      res.status(400).json({ error: 'Product name or selection is required.' });
      return;
    }

    const subtotal = qty * price;
    const vatApply = user?.vatEnabled ? Boolean(isVatApplicable) : false;
    const rate = vatApply ? (Number(vatRate) || user?.vatRate || 13) : 0;
    const vatAmount = vatApply ? (subtotal * rate) / 100 : 0;
    const totalPurchaseCost = subtotal + vatAmount;

    // Supplier association
    let supplierDoc: any = null;
    let finalSupplierName = supplier?.trim() || 'General Supplier';
    let finalSupplierPhone = supplierPhone?.trim() || '';
    let finalSupplierPan = supplierPan?.trim() || '';

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      supplierDoc = await Supplier.findOne({ _id: supplierId, userId });
      if (supplierDoc) {
        finalSupplierName = supplierDoc.name;
        finalSupplierPhone = supplierDoc.phone || finalSupplierPhone;
        finalSupplierPan = supplierDoc.panNumber || finalSupplierPan;
      }
    }

    // Payment & Due logic
    const status = paymentStatus || 'Paid';
    let paid = Number(amountPaid);
    if (status === 'Paid') {
      paid = totalPurchaseCost;
    } else if (status === 'Due') {
      paid = 0;
    } else {
      // Partially Paid
      if (isNaN(paid)) paid = 0;
      paid = Math.min(paid, totalPurchaseCost);
    }
    const amountDue = Math.max(0, totalPurchaseCost - paid);

    const purchase = await Purchase.create({
      userId,
      billNumber: billNumber?.trim() || '',
      productId: productDoc ? productDoc._id : undefined,
      productName: finalProductName,
      supplierId: supplierDoc ? supplierDoc._id : undefined,
      supplier: finalSupplierName,
      supplierPhone: finalSupplierPhone,
      supplierPan: finalSupplierPan,
      quantity: qty,
      unit: unit || productDoc?.unit || 'Piece',
      purchasePrice: price,
      subtotal,
      isVatApplicable: vatApply,
      vatRate: rate,
      vatAmount,
      totalPurchaseCost,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      paymentStatus: status,
      paymentMethod: paymentMethod || 'Cash',
      amountPaid: paid,
      amountDue,
      notes: notes?.trim() || '',
    });

    // Update inventory if product exists
    if (productDoc) {
      productDoc.quantityPurchased = (productDoc.quantityPurchased || 0) + qty;
      productDoc.currentStock = (productDoc.currentStock || 0) + qty;
      productDoc.buyingPrice = price; // update to latest cost price
      if (finalSupplierName) productDoc.supplier = finalSupplierName;
      await productDoc.save();
    }

    // Update supplier stats
    if (supplierDoc) {
      supplierDoc.totalPurchases = (supplierDoc.totalPurchases || 0) + totalPurchaseCost;
      supplierDoc.purchaseCount = (supplierDoc.purchaseCount || 0) + 1;
      supplierDoc.totalDue = (supplierDoc.totalDue || 0) + amountDue;
      supplierDoc.lastPurchaseDate = purchase.purchaseDate;
      await supplierDoc.save();
    }

    res.status(201).json({
      message: 'Purchase recorded and inventory updated.',
      purchase,
    });
  } catch (error: any) {
    console.error('createPurchase error:', error);
    res.status(500).json({ error: 'Unable to record purchase.' });
  }
}

export async function deletePurchase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOne({ _id: id, userId });
    if (!purchase) {
      res.status(404).json({ error: 'Purchase record not found.' });
      return;
    }

    // Revert inventory stock
    if (purchase.productId) {
      const product = await Product.findOne({ _id: purchase.productId, userId });
      if (product) {
        product.quantityPurchased = Math.max(0, (product.quantityPurchased || 0) - purchase.quantity);
        product.currentStock = Math.max(0, (product.currentStock || 0) - purchase.quantity);
        await product.save();
      }
    }

    // Revert supplier stats
    if (purchase.supplierId) {
      const supplier = await Supplier.findOne({ _id: purchase.supplierId, userId });
      if (supplier) {
        supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - purchase.totalPurchaseCost);
        supplier.purchaseCount = Math.max(0, (supplier.purchaseCount || 0) - 1);
        supplier.totalDue = Math.max(0, (supplier.totalDue || 0) - (purchase.amountDue || 0));
        await supplier.save();
      }
    }

    await Purchase.deleteOne({ _id: id, userId });
    res.json({ message: 'Purchase deleted and stock adjusted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete purchase.' });
  }
}
