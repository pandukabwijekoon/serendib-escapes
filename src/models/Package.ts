import mongoose, { Schema, Model, Document } from "mongoose";
import { DESTINATIONS, DestinationKey } from "@/types";

export interface IPackage extends Document {
  slug: string;
  title: string;
  destination: DestinationKey;
  tagline: string;
  durationDays: number;
  priceUsd: number;
  localPriceLkr: number;
  themeColor: string;
  coverImage: string;
  cutoutImage: string;
  highlights: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    destination: {
      type: String,
      required: true,
      enum: DESTINATIONS,
      index: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    priceUsd: {
      type: Number,
      required: true,
      min: 50,
    },
    localPriceLkr: {
      type: Number,
      required: true,
      min: 5000,
      default: 45000,
    },
    themeColor: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    coverImage: {
      type: String,
      required: true,
    },
    cutoutImage: {
      type: String,
      required: true,
    },
    highlights: {
      type: [String],
      required: true,
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PackageSchema.index({ destination: 1, isActive: 1, isFeatured: -1 });

export const PackageModel: Model<IPackage> =
  mongoose.models.Package ||
  mongoose.model<IPackage>("Package", PackageSchema);
