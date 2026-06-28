import { asyncHandler } from '../utils/asyncHandler.js';
import { DisasterReport } from '../models/DisasterReport.js';
import { HttpError } from '../utils/httpError.js';
import { emitToRole, emitToAll } from '../config/socket.js';

export const createDisasterReport = asyncHandler(async (req, res) => {
  let { disasterType, description, severity, location } = req.body;

  // multipart/form-data sends nested objects as strings
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch {
      throw new HttpError(400, 'Invalid location JSON');
    }
  }

  if (!disasterType || !description || !severity || !location?.coordinates) {
    throw new HttpError(400, 'Missing required fields');
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const report = await DisasterReport.create({
    userId: req.user._id,
    disasterType,
    description,
    severity: Number(severity),
    location,
    imageUrl
  });

  emitToRole(req.app.get('io'), 'Volunteer', 'disaster:created', { report });
  emitToRole(req.app.get('io'), 'Admin', 'disaster:created', { report });

  res.status(201).json({ report });
});

export const listDisasterReports = asyncHandler(async (req, res) => {
  const { lng, lat, radiusKm } = req.query;
  const query = {};
  if (req.user.role === 'Citizen') query.userId = req.user._id;

  if (lng && lat && radiusKm) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000
      }
    };
  }

  const reports = await DisasterReport.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  res.json({ reports });
});

export const updateDisasterStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const report = await DisasterReport.findById(id);
  if (!report) throw new HttpError(404, 'Report not found');

  report.status = status;
  await report.save();

  emitToRole(req.app.get('io'), 'Admin', 'disaster:updated', { report });
  res.json({ report });
});

export const broadcastAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const report = await DisasterReport.findById(id).populate('userId', 'name');
  if (!report) throw new HttpError(404, 'Report not found');
  if (!message?.trim()) throw new HttpError(400, 'Message is required');

  const payload = {
    reportId: report._id,
    disasterType: report.disasterType,
    severity: report.severity,
    location: report.location,
    message: message.trim(),
    broadcastBy: req.user.name,
    broadcastAt: new Date().toISOString()
  };

  emitToAll(req.app.get('io'), 'alert:broadcast', payload);

  res.json({ ok: true, payload });
});

export const volunteerRespondToDisaster = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await DisasterReport.findById(id);
  if (!report) throw new HttpError(404, 'Report not found');
  
  if (report.status === 'Resolved') throw new HttpError(400, 'Cannot respond to a resolved disaster');

  const existingResponder = report.responders?.find(r => r.volunteerId.toString() === req.user._id.toString());
  if (existingResponder) throw new HttpError(400, 'You are already assigned to this disaster');

  report.responders.push({ volunteerId: req.user._id, status: 'EnRoute' });
  if (report.status === 'Open' || report.status === 'Acknowledged') {
    report.status = 'InProgress';
  }

  await report.save();

  const io = req.app.get('io');
  emitToRole(io, 'Admin', 'disaster:updated', { report });
  emitToRole(io, 'Volunteer', 'disaster:updated', { report });

  res.json({ report });
});

export const volunteerCheckInDisaster = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await DisasterReport.findById(id);
  if (!report) throw new HttpError(404, 'Report not found');

  const responder = report.responders?.find(r => r.volunteerId.toString() === req.user._id.toString());
  if (!responder) throw new HttpError(403, 'You must respond to this disaster first before checking in');

  if (responder.status === 'Arrived') throw new HttpError(400, 'You are already checked in');

  responder.status = 'Arrived';
  responder.timestamp = new Date();

  await report.save();

  const io = req.app.get('io');
  emitToRole(io, 'Admin', 'disaster:updated', { report });
  emitToRole(io, 'Volunteer', 'disaster:updated', { report });

  res.json({ report });
});
