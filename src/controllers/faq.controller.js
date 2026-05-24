const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createFaq = async (req, res) => {
  try {
    const db = getDB();
    const faqsCollection = db.collection("faqs");

    const newFaq = {
      question: req.body.question,
      answer: req.body.answer,
      serial: req.body.serial || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await faqsCollection.insertOne(newFaq);

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      faqId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFaqs = async (req, res) => {
  try {
    const db = getDB();
    const faqsCollection = db.collection("faqs");

    const faqs = await faqsCollection
      .find({ isActive: true })
      .sort({ serial: 1, createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllFaqsAdmin = async (req, res) => {
  try {
    const db = getDB();
    const faqsCollection = db.collection("faqs");

    const faqs = await faqsCollection
      .find()
      .sort({ serial: 1, createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFaq = async (req, res) => {
  try {
    const db = getDB();
    const faqsCollection = db.collection("faqs");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const result = await faqsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "FAQ updated successfully",
        faq: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const db = getDB();
    const faqsCollection = db.collection("faqs");

    const result = await faqsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFaq,
  getFaqs,
  getAllFaqsAdmin,
  updateFaq,
  deleteFaq,
};
