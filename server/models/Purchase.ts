import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  billNumber?: string;
  productId?: mongoose.Types.ObjectId;
  productName: string;
  supplierId?: mongoose.Types.ObjectId;
  supplier: string;
  supplierPhone?: string;
  supplierPan?: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  subtotal: number;
  isVatApplicable: boolean;
  vatRate: number;
  vatAmount: number;
  totalPurchaseCost: number;
  purchaseDate: Date;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Due';
  paymentMethod: string;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: false,
    },
    supplier: {
      type: String,
      trim: true,
      default: 'General Supplier',
    },
    supplierPhone: {
      type: String,
      trim: true,
      default: '',
    },
    supplierPan: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      default: 'Piece',
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    isVatApplicable: {
      type: Boolean,
      default: false,
    },
    vatRate: {
      type: Number,
      default: 13,
      min: 0,
    },
    vatAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchaseCost: {
      type: Number,
      required: [true, 'Total purchase cost is required'],
      min: [0, 'Total purchase cost cannot be negative'],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partially Paid', 'Due'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ userId: 1, purchaseDate: -1 });
PurchaseSchema.index({ userId: 1, paymentStatus: 1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);
