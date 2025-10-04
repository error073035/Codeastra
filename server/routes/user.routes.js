const express = require("express");
const router = express.Router();
const { registerUser, createUserByAdmin, loginUser, logoutUser, getProfile } = require("../controllers/user.controller.js");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth.middlware.js");

router.post("/register", registerUser);

router.post("/create-user", isAuthenticated, authorizeRoles("Admin"), createUserByAdmin);

router.post("/login", loginUser);

router.post("/logout", isAuthenticated, logoutUser);

router.get("/profile", isAuthenticated, getProfile);

module.exports = router;
