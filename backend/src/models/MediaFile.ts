import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaFile extends Document {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  company: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema: Schema = new Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      unique: true,
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimetype: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
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
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
MediaFileSchema.index({ company: 1, uploadedAt: -1 });
MediaFileSchema.index({ user: 1, uploadedAt: -1 });
MediaFileSchema.index({ mimetype: 1 });

export default mongoose.model<IMediaFile>('MediaFile', MediaFileSchema);