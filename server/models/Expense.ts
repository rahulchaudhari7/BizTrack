import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  date: Date;
  category: string;
  paymentMethod: string;
  isPersonal: boolean;
  vendor?: string;
  billNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Expense name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Other',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      default: 'Cash',
      trim: true,
    },
    isPersonal: {
      type: Boolean,
      default: false,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
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

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, isPersonal: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
