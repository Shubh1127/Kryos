import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  externalId: string;
  company: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    externalId: {
      type: String,
      required: [true, 'External ID is required'],
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique user per company
UserSchema.index({ externalId: 1, company: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);