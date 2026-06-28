import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const publicRoles = new Set(['Citizen', 'Volunteer']);

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Missing required fields');

  const safeRole = publicRoles.has(role) ? role : 'Citizen';

  if (role === 'Admin') {
    throw new HttpError(403, 'Admin accounts cannot be created through public registration');
  }

  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, 'Email already in use');

  const user = await User.create({ name, email, password, role: safeRole });

  const token = signToken(user._id);
  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Missing credentials');

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await user.matchPassword(password);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  const token = signToken(user._id);
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
