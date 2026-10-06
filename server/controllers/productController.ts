import { Response } from 'express';
import { Product } from '../models/Product.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getProducts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { search, category, stockStatus, sortBy, sortOrder } = req.query;
    const lowStockThreshold = req.user?.lowStockThreshold ?? 5;

    const filter: any = { userId };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
        { supplier: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (stockStatus === 'low') {
      filter.$expr = {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', { $ifNull: ['$minimumStock', lowStockThreshold] }] },
        ],
      };
    } else if (stockStatus === 'out') {
      filter.currentStock = { $lte: 0 };
    } else if (stockStatus === 'in_stock') {
      filter.currentStock = { $gt: 0 };
    }

    const sortField = (sortBy as string) || 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find(filter).sort({ [sortField]: order });

    // Format products with computed properties
    const enrichedProducts = products.map((p) => {
      const buyingPrice = p.buyingPrice || 0;
      const sellingPrice = p.sellingPrice || 0;
      const quantityPurchased = p.quantityPurchased || 0;
      const quantitySold = p.quantitySold || 0;
      const currentStock = p.currentStock !== undefined ? p.currentStock : (quantityPurchased - quantitySold);
      const minStock = p.minimumStock !== undefined ? p.minimumStock : lowStockThreshold;

      const totalInvestment = buyingPrice * quantityPurchased;
      const currentStockValue = buyingPrice * currentStock;
      const sellingValue = sellingPrice * currentStock;
      const revenue = sellingPrice * quantitySold;
      const profitPerUnit = sellingPrice - buyingPrice;
      const totalProfitRealized = profitPerUnit * quantitySold;
      const totalPotentialProfit = profitPerUnit * currentStock;
      const profitMargin = sellingPrice > 0 ? Number(((profitPerUnit / sellingPrice) * 100).toFixed(1)) : 0;
      const isLowStock = currentStock <= minStock && currentStock > 0;
      const isOutOfStock = currentStock <= 0;

      return {
        ...p.toObject(),
        currentStock,
        totalInvestment,
        currentStockValue,
        sellingValue,
        revenue,
        profitPerUnit,
        totalProfitRealized,
        totalPotentialProfit,
        profitMargin,
        isLowStock,
        isOutOfStock,
      };
    });

    res.json({ products: enrichedProducts, lowStockThreshold });
  } catch (error: any) {
    console.error('getProducts error:', error);
    res.status(500).json({ error: 'Unable to retrieve inventory products.' });
  }
}

export async function getProductById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({ _id: id, userId });
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const lowStockThreshold = req.user?.lowStockThreshold ?? 5;
    const buyingPrice = product.buyingPrice || 0;
    const sellingPrice = product.sellingPrice || 0;
    const currentStock = product.currentStock;
    const minStock = product.minimumStock !== undefined ? product.minimumStock : lowStockThreshold;

    res.json({
      product: {
        ...product.toObject(),
        totalInvestment: buyingPrice * (product.quantityPurchased || 0),
        currentStockValue: buyingPrice * currentStock,
        sellingValue: sellingPrice * currentStock,
        revenue: sellingPrice * (product.quantitySold || 0),
        profitPerUnit: sellingPrice - buyingPrice,
        totalProfitRealized: (sellingPrice - buyingPrice) * (product.quantitySold || 0),
        profitMargin: sellingPrice > 0 ? Number((((sellingPrice - buyingPrice) / sellingPrice) * 100).toFixed(1)) : 0,
        isLowStock: currentStock <= minStock && currentStock > 0,
        isOutOfStock: currentStock <= 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch product details.' });
  }
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      name,
      sku,
      category,
      buyingPrice,
      sellingPrice,
      quantityPurchased,
      unit,
      minimumStock,
      supplier,
      purchaseDate,
      isVatApplicable,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }

    const buyPrice = Number(buyingPrice);
    const sellPrice = Number(sellingPrice);
    const initialQty = Number(quantityPurchased) || 0;

    if (isNaN(buyPrice) || buyPrice < 0) {
      res.status(400).json({ error: 'Buying price cannot be negative.' });
      return;
    }
    if (isNaN(sellPrice) || sellPrice < 0) {
      res.status(400).json({ error: 'Selling price cannot be negative.' });
      return;
    }
    if (initialQty < 0) {
      res.status(400).json({ error: 'Initial quantity cannot be negative.' });
      return;
    }

    const product = await Product.create({
      userId,
      name: name.trim(),
      sku: sku ? sku.trim().toUpperCase() : '',
      category: category?.trim() || 'General',
      buyingPrice: buyPrice,
      sellingPrice: sellPrice,
      quantityPurchased: initialQty,
      quantitySold: 0,
      currentStock: initialQty,
      unit: unit || 'Piece',
      minimumStock: minimumStock !== undefined ? Number(minimumStock) : 5,
      supplier: supplier?.trim() || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      isVatApplicable: Boolean(isVatApplicable),
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      message: 'Product added to inventory.',
      product,
    });
  } catch (error: any) {
    console.error('createProduct error:', error);
    res.status(500).json({ error: 'Unable to create product.' });
  }
}

export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      sku,
      category,
      buyingPrice,
      sellingPrice,
      currentStock,
      unit,
      minimumStock,
      supplier,
      purchaseDate,
      isVatApplicable,
      notes,
    } = req.body;

    const product = await Product.findOne({ _id: id, userId });
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    if (name) product.name = name.trim();
    if (sku !== undefined) product.sku = sku.trim().toUpperCase();
    if (category) product.category = category.trim();
    if (unit) product.unit = unit;
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock) || 0;
    if (isVatApplicable !== undefined) product.isVatApplicable = Boolean(isVatApplicable);

    if (buyingPrice !== undefined) {
      const bp = Number(buyingPrice);
      if (bp < 0) {
        res.status(400).json({ error: 'Buying price cannot be negative.' });
        return;
      }
      product.buyingPrice = bp;
    }

    if (sellingPrice !== undefined) {
      const sp = Number(sellingPrice);
      if (sp < 0) {
        res.status(400).json({ error: 'Selling price cannot be negative.' });
        return;
      }
      product.sellingPrice = sp;
    }

    if (currentStock !== undefined) {
      const cs = Number(currentStock);
      if (cs < 0) {
        res.status(400).json({ error: 'Current stock cannot be negative.' });
        return;
      }
      product.currentStock = cs;
      product.quantityPurchased = cs + product.quantitySold;
    }

    if (supplier !== undefined) product.supplier = supplier.trim();
    if (purchaseDate) product.purchaseDate = new Date(purchaseDate);
    if (notes !== undefined) product.notes = notes.trim();

    await product.save();

    res.json({
      message: 'Product updated successfully.',
      product,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to update product details.' });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOneAndDelete({ _id: id, userId });
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    res.json({ message: 'Product removed from inventory.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete product.' });
  }
}
