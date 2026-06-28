import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';
import { User } from '../models/User.js';

export async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'Not authorized'));

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new HttpError(401, 'Not authorized'));

    req.user = user;
    next();
  } catch {
    next(new HttpError(401, 'Not authorized'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not authorized'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
