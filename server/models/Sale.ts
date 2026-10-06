import mongoose, { Document, Schema } from 'mongoose';

export interface ISale extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  productId?: mongoose.Types.ObjectId;
  productName: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  customerPan?: string;
  customerAddress?: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  buyingPrice: number;
  discount: number;
  subtotal: number;
  isVatApplicable: boolean;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Due';
  amountPaid: number;
  amountDue: number;
  saleDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
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
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: false,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    customerPan: {
      type: String,
      default: '',
      trim: true,
    },
    customerAddress: {
      type: String,
      default: '',
      trim: true,
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
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    buyingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Buying price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
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
    totalAmount: {
      type: Number,
      required: [true, 'Grand Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partially Paid', 'Due'],
      default: 'Paid',
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
    saleDate: {
      type: Date,
      default: Date.now,
      required: true,
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

SaleSchema.index({ userId: 1, saleDate: -1 });
SaleSchema.index({ userId: 1, invoiceNumber: 1 });
SaleSchema.index({ userId: 1, paymentStatus: 1 });

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
