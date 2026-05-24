const express = require("express");
const {
  createTestimonial,
  getTestimonials,
  getAllTestimonialsAdmin,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonial.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getTestimonials);

router.get("/admin", verifyToken, isAdmin, getAllTestimonialsAdmin);
router.post("/", verifyToken, isAdmin, createTestimonial);
router.put("/:id", verifyToken, isAdmin, updateTestimonial);
router.delete("/:id", verifyToken, isAdmin, deleteTestimonial);

module.exports = router;
