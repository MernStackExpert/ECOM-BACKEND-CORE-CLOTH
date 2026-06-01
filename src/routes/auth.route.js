const express = require("express");
const {
  registerUser,
  loginUser,
  getMyProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRoleStatus,
} = require("../controllers/auth.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

router.get("/admin/users", verifyToken, isAdmin, getAllUsers);
router.get("/admin/users/:id", verifyToken, isAdmin, getUserById);
router.delete("/admin/users/:id", verifyToken, isAdmin, deleteUser);
router.put("/admin/users/:id", verifyToken, isAdmin, updateUserRoleStatus);

module.exports = router;
