import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String }
  },
  { _id: false }
);

const resourceRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['Food', 'Water', 'Shelter', 'Medical', 'Rescue', 'Other']
    },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    location: { type: pointSchema, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'InProgress', 'PendingVerification', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    // Support both field names for backward compat
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: { type: Number, min: 1, max: 5, default: 3 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: expose assignedVolunteer as assignedTo for frontend compatibility
resourceRequestSchema.virtual('assignedTo').get(function () {
  return this.assignedVolunteer;
});

resourceRequestSchema.index({ location: '2dsphere' });

export const ResourceRequest = mongoose.model('ResourceRequest', resourceRequestSchema);
