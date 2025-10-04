const User = require("../models/user.model.js");
const Company = require("../models/company.model.js");
const asyncHandler = require("../utilities/asyncHandler.utility.js");
const ErrorHandler = require("../utilities/errorHandler.utility.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, company: user.company },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, companyName, country, currency, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  let company;

  const totalUsers = await User.countDocuments();
  if (totalUsers === 0) {
    if (!companyName || !country || !currency) {
      return next(new ErrorHandler("Company details required for first signup", 400));
    }

    company = new Company({ name: companyName, country, currency });
    await company.save();
  } else {
    if (!req.user || req.user.role !== "Admin") {
      return next(new ErrorHandler("Only Admins can create new users", 403));
    }
    company = await Company.findById(req.user.company);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: totalUsers === 0 ? "Admin" : role || "Employee",
    company: company._id,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: company.name,
    },
  });
});

const createUserByAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (req.user.role !== "Admin") {
    return next(new ErrorHandler("Only Admin can create users", 403));
  }

  if (!["Manager", "Employee"].includes(role)) {
    return next(new ErrorHandler("Invalid role. Use 'Manager' or 'Employee'", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    company: req.user.company,
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: req.user.company,
    },
  });
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate("company");
  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company.name,
    },
  });
});

const logoutUser = asyncHandler(async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password").populate("company");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

module.exports = { registerUser, createUserByAdmin, loginUser, logoutUser, getProfile };
