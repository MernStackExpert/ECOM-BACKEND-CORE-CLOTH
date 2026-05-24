const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createCoupon = async (req, res) => {
  try {
    const db = getDB();
    const couponsCollection = db.collection("coupons");

    const couponData = req.body;
    couponData.code = couponData.code.toUpperCase();

    const existingCoupon = await couponsCollection.findOne({
      code: couponData.code,
    });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code already exists" });
    }

    const newCoupon = {
      ...couponData,
      startDate: new Date(couponData.startDate),
      expiryDate: new Date(couponData.expiryDate),
      usedCount: 0,
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await couponsCollection.insertOne(newCoupon);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      couponId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const db = getDB();
    const couponsCollection = db.collection("coupons");

    const coupons = await couponsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const db = getDB();
    const couponsCollection = db.collection("coupons");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    if (updateData.startDate)
      updateData.startDate = new Date(updateData.startDate);
    if (updateData.expiryDate)
      updateData.expiryDate = new Date(updateData.expiryDate);

    const result = await couponsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Coupon updated successfully",
        coupon: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const db = getDB();
    const couponsCollection = db.collection("coupons");

    const result = await couponsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const db = getDB();
    const couponsCollection = db.collection("coupons");

    const { code, orderAmount } = req.body;
    const uppercaseCode = code.toUpperCase();
    const currentDate = new Date();

    const coupon = await couponsCollection.findOne({
      code: uppercaseCode,
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or inactive coupon" });
    }

    if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Coupon is expired or not active yet",
        });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Coupon usage limit has been reached",
        });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ${coupon.minOrderAmount} is required`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    }

    await couponsCollection.updateOne(
      { _id: coupon._id },
      { $inc: { usedCount: 1 } },
    );

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
};
