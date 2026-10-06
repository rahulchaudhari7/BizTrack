import { Response } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.ts';
import { Product } from '../models/Product.ts';
import { Customer } from '../models/Customer.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { getCurrentFiscalYear, getLastFiscalYear } from '../utils/nepalDates.ts';

export async function getSales(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      productId,
      customerId,
      paymentMethod,
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

    if (customerId && customerId !== 'All') {
      filter.customerId = customerId;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { invoiceNumber: { $regex: search.trim(), $options: 'i' } },
        { productName: { $regex: search.trim(), $options: 'i' } },
        { customerName: { $regex: search.trim(), $options: 'i' } },
        { customerPhone: { $regex: search.trim(), $options: 'i' } },
        { customerPan: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Date range filtering
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filter.saleDate = { $gte: start };
    } else if (dateRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      filter.saleDate = { $gte: firstDay };
    } else if (dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.saleDate = { $gte: start };
    } else if (dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      filter.saleDate = { $gte: start, $lte: end };
    } else if (dateRange === 'this_fiscal_year') {
      const fy = getCurrentFiscalYear();
      filter.saleDate = { $gte: fy.start, $lte: fy.end };
    } else if (dateRange === 'last_fiscal_year') {
      const lastFy = getLastFiscalYear();
      filter.saleDate = { $gte: lastFy.start, $lte: lastFy.end };
    } else if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    const sortField = (sortBy as string) || 'saleDate';
    const order = sortOrder === 'asc' ? 1 : -1;

    const sales = await Sale.find(filter).sort({ [sortField]: order });
    res.json({ sales });
  } catch (error: any) {
    console.error('getSales error:', error);
    res.status(500).json({ error: 'Unable to retrieve sales records.' });
  }
}

export async function getSaleById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOne({ _id: id, userId });
    if (!sale) {
      res.status(404).json({ error: 'Sale record not found.' });
      return;
    }

    res.json({ sale });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch sale details.' });
  }
}

export async function createSale(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const user = req.user;
    const {
      productId,
      productName,
      customerId,
      customerName,
      customerPhone,
      customerPan,
      customerAddress,
      quantity,
      unit,
      sellingPrice,
      discount,
      isVatApplicable,
      vatRate,
      paymentMethod,
      paymentStatus,
      amountPaid,
      saleDate,
      notes,
    } = req.body;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: 'Quantity must be greater than 0.' });
      return;
    }

    let finalProductName = productName?.trim();
    let productBuyingPrice = 0;
    let productDoc: any = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      productDoc = await Product.findOne({ _id: productId, userId });
      if (!productDoc) {
        res.status(404).json({ error: 'Selected product was not found in inventory.' });
        return;
      }

      // Check stock availability
      if (productDoc.currentStock < qty) {
        res.status(400).json({
          error: `Insufficient stock! Only ${productDoc.currentStock} ${productDoc.unit || 'unit(s)'} available for "${productDoc.name}".`,
        });
        return;
      }

      finalProductName = productDoc.name;
      productBuyingPrice = productDoc.buyingPrice || 0;
    } else {
      if (!finalProductName) {
        res.status(400).json({ error: 'Product name or selection is required.' });
        return;
      }
    }

    const price = Number(sellingPrice);
    if (isNaN(price) || price < 0) {
      res.status(400).json({ error: 'Selling price cannot be negative.' });
      return;
    }

    const disc = Number(discount) || 0;
    const grossProductAmount = qty * price;
    const subtotal = Math.max(0, grossProductAmount - disc);

    // VAT calculation: check if VAT enabled on user account or explicitly checked for product
    const vatApply = user?.vatEnabled ? Boolean(isVatApplicable) : false;
    const rate = vatApply ? (Number(vatRate) || user?.vatRate || 13) : 0;
    const vatAmount = vatApply ? (subtotal * rate) / 100 : 0;
    const totalAmount = subtotal + vatAmount;

    // Payment & Due logic
    const status = paymentStatus || 'Paid';
    let paid = Number(amountPaid);
    if (status === 'Paid') {
      paid = totalAmount;
    } else if (status === 'Due') {
      paid = 0;
    } else {
      // Partially Paid
      if (isNaN(paid)) paid = 0;
      paid = Math.min(paid, totalAmount);
    }
    const amountDue = Math.max(0, totalAmount - paid);

    // Generate Invoice Number
    const totalSalesCount = await Sale.countDocuments({ userId });
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${(totalSalesCount + 1).toString().padStart(4, '0')}`;

    // Customer association
    let custDoc: any = null;
    let finalCustName = customerName?.trim() || 'Walk-in Customer';
    let finalCustPhone = customerPhone?.trim() || '';
    let finalCustPan = customerPan?.trim() || '';
    let finalCustAddress = customerAddress?.trim() || '';

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      custDoc = await Customer.findOne({ _id: customerId, userId });
      if (custDoc) {
        finalCustName = custDoc.name;
        finalCustPhone = custDoc.phone || finalCustPhone;
        finalCustPan = custDoc.panNumber || finalCustPan;
        finalCustAddress = custDoc.address || finalCustAddress;
      }
    }

    const sale = await Sale.create({
      userId,
      invoiceNumber,
      productId: productDoc ? productDoc._id : undefined,
      productName: finalProductName,
      customerId: custDoc ? custDoc._id : undefined,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      customerPan: finalCustPan,
      customerAddress: finalCustAddress,
      quantity: qty,
      unit: unit || productDoc?.unit || 'Piece',
      sellingPrice: price,
      buyingPrice: productBuyingPrice,
      discount: disc,
      subtotal,
      isVatApplicable: vatApply,
      vatRate: rate,
      vatAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: status,
      amountPaid: paid,
      amountDue,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      notes: notes?.trim() || '',
    });

    // Decrement stock in product inventory
    if (productDoc) {
      productDoc.quantitySold = (productDoc.quantitySold || 0) + qty;
      productDoc.currentStock = Math.max(0, (productDoc.currentStock || 0) - qty);
      await productDoc.save();
    }

    // Update customer stats
    if (custDoc) {
      custDoc.totalPurchases = (custDoc.totalPurchases || 0) + totalAmount;
      custDoc.transactionCount = (custDoc.transactionCount || 0) + 1;
      custDoc.totalDue = (custDoc.totalDue || 0) + amountDue;
      custDoc.lastPurchaseDate = sale.saleDate;
      await custDoc.save();
    }

    res.status(201).json({
      message: 'Sale and Invoice generated successfully.',
      sale,
    });
  } catch (error: any) {
    console.error('createSale error:', error);
    res.status(500).json({ error: 'Unable to record sale.' });
  }
}

export async function deleteSale(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOne({ _id: id, userId });
    if (!sale) {
      res.status(404).json({ error: 'Sale record not found.' });
      return;
    }

    // Revert inventory stock
    if (sale.productId) {
      const product = await Product.findOne({ _id: sale.productId, userId });
      if (product) {
        product.quantitySold = Math.max(0, (product.quantitySold || 0) - sale.quantity);
        product.currentStock = (product.currentStock || 0) + sale.quantity;
        await product.save();
      }
    }

    // Revert customer due and purchases
    if (sale.customerId) {
      const customer = await Customer.findOne({ _id: sale.customerId, userId });
      if (customer) {
        customer.totalPurchases = Math.max(0, (customer.totalPurchases || 0) - sale.totalAmount);
        customer.transactionCount = Math.max(0, (customer.transactionCount || 0) - 1);
        customer.totalDue = Math.max(0, (customer.totalDue || 0) - (sale.amountDue || 0));
        await customer.save();
      }
    }

    await Sale.deleteOne({ _id: id, userId });
    res.json({ message: 'Sale deleted and inventory restored.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete sale.' });
  }
}
