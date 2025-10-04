const asyncHandler = require("../utilities/asyncHandler.utility.js");
const ErrorHandler = require("../utilities/errorHandler.utility.js");
const jwt = require("jsonwebtoken");

const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  try {
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = tokenData;
    next();
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 403));
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler("Access denied", 403));
    }
    next();
  };
};

module.exports = { isAuthenticated, authorizeRoles };
