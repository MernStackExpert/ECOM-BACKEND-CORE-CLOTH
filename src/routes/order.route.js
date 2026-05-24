const express = require("express");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/my-orders", verifyToken, getMyOrders);

router.get("/admin/all-orders", verifyToken, isAdmin, getAllOrders);
router.put("/admin/:id/status", verifyToken, isAdmin, updateOrderStatus);

module.exports = router;
