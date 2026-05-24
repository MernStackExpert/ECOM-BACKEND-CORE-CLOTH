const express = require("express");
const {
  createFaq,
  getFaqs,
  getAllFaqsAdmin,
  updateFaq,
  deleteFaq,
} = require("../controllers/faq.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getFaqs);

router.get("/admin", verifyToken, isAdmin, getAllFaqsAdmin);
router.post("/", verifyToken, isAdmin, createFaq);
router.put("/:id", verifyToken, isAdmin, updateFaq);
router.delete("/:id", verifyToken, isAdmin, deleteFaq);

module.exports = router;
