const express = require("express");
const {
  createBanner,
  getBanners,
  getAllBannersAdmin,
  updateBanner,
  deleteBanner,
} = require("../controllers/banner.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getBanners);

router.get("/admin", verifyToken, isAdmin, getAllBannersAdmin);
router.post("/", verifyToken, isAdmin, createBanner);
router.put("/:id", verifyToken, isAdmin, updateBanner);
router.delete("/:id", verifyToken, isAdmin, deleteBanner);

module.exports = router;
