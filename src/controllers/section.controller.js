const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createSection = async (req, res) => {
  try {
    const db = getDB();
    const sectionsCollection = db.collection("sections");

    const newSection = {
      title: req.body.title,
      serial: req.body.serial || 0,
      productLimit: req.body.productLimit || 8,
      layout: req.body.layout || "grid", // 'slider' or 'grid'
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      filters: req.body.filters || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await sectionsCollection.insertOne(newSection);

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      sectionId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllSectionsAdmin = async (req, res) => {
  try {
    const db = getDB();
    const sectionsCollection = db.collection("sections");

    const sections = await sectionsCollection
      .find()
      .sort({ serial: 1 })
      .toArray();

    res.status(200).json({ success: true, count: sections.length, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const db = getDB();
    const sectionsCollection = db.collection("sections");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const result = await sectionsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    const db = getDB();
    const sectionsCollection = db.collection("sections");

    const result = await sectionsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHomepageData = async (req, res) => {
  try {
    const db = getDB();
    const sectionsCollection = db.collection("sections");
    const productsCollection = db.collection("products");

    const sections = await sectionsCollection
      .find({ isActive: true })
      .sort({ serial: 1 })
      .toArray();

    const homepageData = await Promise.all(
      sections.map(async (section) => {
        const query = { "status.isActive": true, ...section.filters };

        const projection = {
          name: 1,
          slug: 1,
          pricing: 1,
          "media.thumbnail": 1,
          status: 1,
          "social.rating": 1,
          brand: 1,
        };

        const products = await productsCollection
          .find(query)
          .project(projection)
          .limit(section.productLimit)
          .sort({ createdAt: -1 })
          .toArray();

        return {
          _id: section._id,
          title: section.title,
          serial: section.serial,
          layout: section.layout,
          productLimit: section.productLimit,
          
          products,
        };
      }),
    );

    res.status(200).json({ success: true, data: homepageData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSection,
  getAllSectionsAdmin,
  updateSection,
  deleteSection,
  getHomepageData,
};
