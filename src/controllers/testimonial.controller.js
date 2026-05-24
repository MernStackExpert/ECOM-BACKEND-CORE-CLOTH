const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createTestimonial = async (req, res) => {
  try {
    const db = getDB();
    const testimonialsCollection = db.collection("testimonials");

    const newTestimonial = {
      customerName: req.body.customerName,
      designation: req.body.designation || "",
      rating: req.body.rating || 5,
      reviewText: req.body.reviewText,
      image: req.body.image || "",
      productId: req.body.productId ? new ObjectId(req.body.productId) : null,
      serial: req.body.serial || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testimonialsCollection.insertOne(newTestimonial);

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      testimonialId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTestimonials = async (req, res) => {
  try {
    const db = getDB();
    const testimonialsCollection = db.collection("testimonials");

    const testimonials = await testimonialsCollection
      .find({ isActive: true })
      .sort({ serial: 1, createdAt: -1 })
      .toArray();

    res
      .status(200)
      .json({ success: true, count: testimonials.length, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTestimonialsAdmin = async (req, res) => {
  try {
    const db = getDB();
    const testimonialsCollection = db.collection("testimonials");

    const testimonials = await testimonialsCollection
      .find()
      .sort({ serial: 1, createdAt: -1 })
      .toArray();

    res
      .status(200)
      .json({ success: true, count: testimonials.length, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTestimonial = async (req, res) => {
  try {
    const db = getDB();
    const testimonialsCollection = db.collection("testimonials");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    if (updateData.productId) {
      updateData.productId = new ObjectId(updateData.productId);
    }

    const result = await testimonialsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Testimonial updated successfully",
        testimonial: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const db = getDB();
    const testimonialsCollection = db.collection("testimonials");

    const result = await testimonialsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTestimonial,
  getTestimonials,
  getAllTestimonialsAdmin,
  updateTestimonial,
  deleteTestimonial,
};
