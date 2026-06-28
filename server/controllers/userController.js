import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

export const getMe = asyncHandler(async (req, res) => {
  // Fetch fresh from DB so skills/available are always up to date
  const user = await User.findById(req.user._id).select('-password');
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
});


export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  );
  if (!user) throw new HttpError(404, 'User not found');

  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'User not found');

  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body;
  if (typeof available !== 'boolean') throw new HttpError(400, 'available must be a boolean');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { available },
    { new: true }
  );
  if (!user) throw new HttpError(404, 'User not found');

  res.json({ user: { id: user._id, name: user.name, available: user.available, skills: user.skills } });
});

export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) throw new HttpError(400, 'skills must be an array');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills },
    { new: true }
  );
  if (!user) throw new HttpError(404, 'User not found');

  res.json({ user: { id: user._id, name: user.name, available: user.available, skills: user.skills } });
});

