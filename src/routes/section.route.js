const express = require("express");
const {
  createSection,
  getAllSectionsAdmin,
  updateSection,
  deleteSection,
  getHomepageData,
} = require("../controllers/section.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/homepage", getHomepageData);

router.get("/admin", verifyToken, isAdmin, getAllSectionsAdmin);
router.post("/", verifyToken, isAdmin, createSection);
router.put("/:id", verifyToken, isAdmin, updateSection);
router.delete("/:id", verifyToken, isAdmin, deleteSection);

module.exports = router;
