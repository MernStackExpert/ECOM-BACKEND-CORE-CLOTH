const express = require("express");
const {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} = require("../controllers/coupon.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/apply", applyCoupon);

router.post("/", verifyToken, isAdmin, createCoupon);
router.get("/", verifyToken, isAdmin, getAllCoupons);
router.put("/:id", verifyToken, isAdmin, updateCoupon);
router.delete("/:id", verifyToken, isAdmin, deleteCoupon);

module.exports = router;
