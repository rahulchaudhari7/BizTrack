import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  name: string;
  email: string;
  profilePicture?: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  businessCategory: string;
  panNumber: string;
  vatEnabled: boolean;
  vatNumber: string;
  vatRate: number;
  phone: string;
  businessAddress: string;
  fullAddress: string;
  country: string;
  province: string;
  district: string;
  municipality: string;
  wardNo: string;
  tole: string;
  currency: string;
  currencySymbol: string;
  lowStockThreshold: number;
  fiscalYearType: string;
  paymentMethods: string[];
  customExpenseCategories: string[];
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'eSewa',
  'Khalti',
  'IME Pay',
  'Fonepay',
  'ConnectIPS',
  'Debit Card',
  'Credit Card',
  'Cheque',
  'Other',
];

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    businessName: {
      type: String,
      default: 'मेरो व्यवसाय (Hamro Business)',
      trim: true,
    },
    ownerName: {
      type: String,
      default: '',
      trim: true,
    },
    businessType: {
      type: String,
      default: 'Retail Shop',
    },
    businessCategory: {
      type: String,
      default: 'General Store',
    },
    panNumber: {
      type: String,
      default: '',
      trim: true,
    },
    vatEnabled: {
      type: Boolean,
      default: false,
    },
    vatNumber: {
      type: String,
      default: '',
      trim: true,
    },
    vatRate: {
      type: Number,
      default: 13,
      min: 0,
      max: 100,
    },
    phone: {
      type: String,
      default: '+977 9800000000',
      trim: true,
    },
    businessAddress: {
      type: String,
      default: 'New Road, Ward 10, Kathmandu, Bagmati Province, Nepal',
      trim: true,
    },
    fullAddress: {
      type: String,
      default: 'New Road, Ward 10, Kathmandu, Bagmati Province, Nepal',
      trim: true,
    },
    country: {
      type: String,
      default: 'Nepal',
    },
    province: {
      type: String,
      default: 'Bagmati Province',
    },
    district: {
      type: String,
      default: 'Kathmandu',
    },
    municipality: {
      type: String,
      default: 'Kathmandu Metropolitan City',
    },
    wardNo: {
      type: String,
      default: '10',
    },
    tole: {
      type: String,
      default: 'New Road',
    },
    currency: {
      type: String,
      default: 'NPR',
    },
    currencySymbol: {
      type: String,
      default: 'रु',
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [1, 'Threshold must be at least 1'],
    },
    fiscalYearType: {
      type: String,
      default: 'nepal', // 'nepal' (Shrawan 1 - Ashadh end) or 'english'
    },
    paymentMethods: {
      type: [String],
      default: DEFAULT_PAYMENT_METHODS,
    },
    customExpenseCategories: {
      type: [String],
      default: [],
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
