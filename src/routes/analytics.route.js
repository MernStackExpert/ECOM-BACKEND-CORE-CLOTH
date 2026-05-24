const express = require("express");
const {
  getDashboardAnalytics,
} = require("../controllers/analytics.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/dashboard", verifyToken, isAdmin, getDashboardAnalytics);

module.exports = router;
