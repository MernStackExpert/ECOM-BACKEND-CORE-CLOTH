const express = require("express");
const {
  getSettings,
  updateSettings,
} = require("../controllers/setting.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getSettings);
router.put("/", verifyToken, isAdmin, updateSettings);

module.exports = router;
