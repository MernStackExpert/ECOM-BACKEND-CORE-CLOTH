const express = require("express");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  deleteOrder,
} = require("../controllers/order.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/my-orders", verifyToken, getMyOrders);

router.get("/admin/all-orders",  getAllOrders);
router.get("/admin/:id", verifyToken, isAdmin, getOrderById);
router.put("/admin/:id/status", verifyToken, isAdmin, updateOrderStatus);
router.delete("/admin/:id", verifyToken, isAdmin, deleteOrder);

module.exports = router;
