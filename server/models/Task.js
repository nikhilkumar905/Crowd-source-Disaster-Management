import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceRequest', required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Accepted', 'InProgress', 'Completed'],
      default: 'Accepted'
    }
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);
