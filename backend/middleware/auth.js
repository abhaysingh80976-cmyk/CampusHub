const { auth } = require('../config/firebase');
const { getOne } = require('../services/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const readToken = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication token missing');
  try {
    return await auth.verifyIdToken(header.split(' ')[1]);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

// Sirf token verify karta hai (registration ke time profile doc abhi exist nahi karta)
const verifyTokenOnly = asyncHandler(async (req, res, next) => {
  req.firebaseUser = await readToken(req);
  next();
});

// Token verify + Firestore se trusted role/status load
const verifyToken = asyncHandler(async (req, res, next) => {
  const decoded = await readToken(req);
  const profile = await getOne('users', decoded.uid);
  if (!profile) throw new ApiError(403, 'Profile not found. Please complete registration.');
  if (profile.status === 'inactive') throw new ApiError(403, 'Your account has been deactivated.');
  req.firebaseUser = decoded;
  req.user = { ...profile, uid: decoded.uid };
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  const { role, status } = req.user;
  if (!roles.includes(role)) return next(new ApiError(403, 'You do not have permission to perform this action'));
  if (role === 'teacher' && status !== 'active') {
    return next(new ApiError(403, 'Your teacher account is awaiting admin approval'));
  }
  next();
};

module.exports = { verifyTokenOnly, verifyToken, requireRole };