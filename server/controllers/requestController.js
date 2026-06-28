import { asyncHandler } from '../utils/asyncHandler.js';
import { ResourceRequest } from '../models/ResourceRequest.js';
import { Task } from '../models/Task.js';
import { HttpError } from '../utils/httpError.js';
import { emitToRole, emitToUser } from '../config/socket.js';

// Helper to populate and return a fresh copy of a request
async function populatedRequest(id) {
  return ResourceRequest.findById(id)
    .populate('userId', 'name email role')
    .populate('assignedVolunteer', 'name email role');
}

// Broadcast to everyone who cares about this request
function broadcastRequestUpdate(io, request) {
  const payload = { request };
  // Citizen who made the request
  emitToUser(io, request.userId.toString(), 'request:updated', payload);
  emitToUser(io, request.userId.toString(), 'status_updated', { requestId: request._id, status: request.status });
  // All volunteers and admins
  emitToRole(io, 'Volunteer', 'request:updated', payload);
  emitToRole(io, 'Admin', 'request:updated', payload);
}

export const createResourceRequest = asyncHandler(async (req, res) => {
  const { type, quantity, description, location } = req.body;
  if (!type || !location?.coordinates) throw new HttpError(400, 'Missing required fields (type, location)');

  const request = await ResourceRequest.create({
    userId: req.user._id,
    type,
    description: description || '',
    quantity: quantity || 1,
    location
  });

  const populated = await populatedRequest(request._id);

  const io = req.app.get('io');
  emitToRole(io, 'Volunteer', 'request:created', { request: populated });
  emitToRole(io, 'Admin', 'request:created', { request: populated });
  // Legacy event names
  emitToRole(io, 'Volunteer', 'new_request', { request: populated });
  emitToRole(io, 'Admin', 'new_request', { request: populated });

  res.status(201).json({ request: populated });
});

export const listResourceRequests = asyncHandler(async (req, res) => {
  const { lng, lat, radiusKm } = req.query;
  const query = {};

  if (req.user.role === 'Citizen') {
    // Citizens see only their own requests (all statuses)
    query.userId = req.user._id;
  } else if (req.user.role === 'Volunteer') {
    // Volunteers see all pending/accepted/in-progress/pending-verification requests they could help with
    query.status = { $in: ['Pending', 'Accepted', 'InProgress', 'PendingVerification'] };
  }
  // Admins see everything (no filter)

  if (lng && lat && radiusKm) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000
      }
    };
  }

  const requests = await ResourceRequest.find(query)
    .populate('userId', 'name email role')
    .populate('assignedVolunteer', 'name email role')
    .sort({ priority: -1, createdAt: -1 });

  res.json({ requests });
});

export const volunteerAcceptRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await ResourceRequest.findById(id);
  if (!request) throw new HttpError(404, 'Request not found');
  if (request.assignedVolunteer) throw new HttpError(409, 'Request already assigned to another volunteer');

  request.assignedVolunteer = req.user._id;
  request.status = 'Accepted';
  await request.save();

  await Task.create({ requestId: request._id, volunteerId: req.user._id, status: 'Accepted' });

  const populated = await populatedRequest(request._id);
  broadcastRequestUpdate(req.app.get('io'), populated);

  res.json({ request: populated });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const request = await ResourceRequest.findById(id);
  if (!request) throw new HttpError(404, 'Request not found');

  // Volunteers can only update their own assigned requests; admins can update any
  if (req.user.role === 'Volunteer') {
    if (!request.assignedVolunteer || request.assignedVolunteer.toString() !== req.user._id.toString()) {
      throw new HttpError(403, 'You can only update requests assigned to you');
    }
  }

  request.status = status;
  await request.save();

  if (req.user.role === 'Volunteer') {
    await Task.findOneAndUpdate(
      { requestId: request._id, volunteerId: req.user._id },
      { status },
      { upsert: true, new: true }
    );
  }

  const populated = await populatedRequest(request._id);
  broadcastRequestUpdate(req.app.get('io'), populated);

  res.json({ request: populated });
});

export const adminSetPriority = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  const request = await ResourceRequest.findById(id);
  if (!request) throw new HttpError(404, 'Request not found');

  request.priority = priority;
  await request.save();

  const populated = await populatedRequest(request._id);
  broadcastRequestUpdate(req.app.get('io'), populated);

  res.json({ request: populated });
});

export const citizenVerifyRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'Confirm' or 'Dispute'

  const request = await ResourceRequest.findById(id);
  if (!request) throw new HttpError(404, 'Request not found');

  if (request.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'You can only verify your own requests');
  }

  if (request.status !== 'PendingVerification') {
    throw new HttpError(400, 'Request is not pending verification');
  }

  if (action === 'Confirm') {
    request.status = 'Completed';
  } else if (action === 'Dispute') {
    request.status = 'InProgress';
  } else {
    throw new HttpError(400, 'Invalid action. Use Confirm or Dispute.');
  }

  await request.save();

  if (request.assignedVolunteer) {
    await Task.findOneAndUpdate(
      { requestId: request._id, volunteerId: request.assignedVolunteer },
      { status: request.status },
      { upsert: true, new: true }
    );
  }

  const populated = await populatedRequest(request._id);
  broadcastRequestUpdate(req.app.get('io'), populated);

  res.json({ request: populated });
});
