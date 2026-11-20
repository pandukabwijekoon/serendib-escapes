import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  BOOKING_STATUSES,
  BookingStatus,
  DESTINATIONS,
  DestinationKey,
  TRAVEL_TIERS,
  TravelTier,
  VISITOR_TYPES,
  VisitorType,
} from "@/types";

export interface IBooking extends Document {
  bookingRef: string;
  fullName: string;
  email: string;
  phone: string;
  visitorType: VisitorType;
  destination: DestinationKey;
  packageId?: Types.ObjectId | null;
  packageSlug?: string | null;
  travelDate: Date;
  durationDays: number;
  adults: number;
  children: number;
  tier: TravelTier;
  airportPickup: boolean;
  specialRequests?: string;
  estimatedTotalUsd: number;
  estimatedTotalLkr: number;
  status: BookingStatus;
  clientIpHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    visitorType: {
      type: String,
      required: true,
      enum: VISITOR_TYPES,
      default: "International",
      index: true,
    },
    destination: {
      type: String,
      required: true,
      enum: DESTINATIONS,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    packageSlug: {
      type: String,
      trim: true,
      default: null,
    },
    travelDate: {
      type: Date,
      required: true,
      index: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    adults: {
      type: Number,
      required: true,
      min: 1,
      max: 16,
    },
    children: {
      type: Number,
      required: true,
      min: 0,
      max: 12,
      default: 0,
    },
    tier: {
      type: String,
      required: true,
      enum: TRAVEL_TIERS,
    },
    airportPickup: {
      type: Boolean,
      default: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
    estimatedTotalUsd: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTotalLkr: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: BOOKING_STATUSES,
      default: "Pending",
      index: true,
    },
    clientIpHash: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ status: 1, createdAt: -1 });

export const BookingModel: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
