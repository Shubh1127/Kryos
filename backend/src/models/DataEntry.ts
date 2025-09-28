import mongoose, { Document, Schema } from 'mongoose';

export interface IDataEntry extends Document {
  externalId: string;
  company: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  dataType: 'user_data' | 'event_data' | 'custom_data';
  data: Record<string, any>;
  files?: mongoose.Types.ObjectId[];
  tags: string[];
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DataEntrySchema: Schema = new Schema(
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dataType: {
      type: String,
      enum: ['user_data', 'event_data', 'custom_data'],
      required: [true, 'Data type is required'],
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, 'Data is required'],
    },
    files: [{
      type: Schema.Types.ObjectId,
      ref: 'MediaFile',
    }],
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
DataEntrySchema.index({ company: 1, receivedAt: -1 });
DataEntrySchema.index({ user: 1, receivedAt: -1 });
DataEntrySchema.index({ dataType: 1, receivedAt: -1 });
DataEntrySchema.index({ tags: 1 });

export default mongoose.model<IDataEntry>('DataEntry', DataEntrySchema);