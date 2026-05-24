const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createBanner = async (req, res) => {
  try {
    const db = getDB();
    const bannersCollection = db.collection("banners");
    const bannerData = req.body;

    const newBanner = {
      title: bannerData.title || "",
      image: bannerData.image,
      link: bannerData.link || "",
      position: bannerData.position || "main-slider",
      buttonText: bannerData.buttonText || "",
      isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
      serial: bannerData.serial || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await bannersCollection.insertOne(newBanner);

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      bannerId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    const db = getDB();
    const bannersCollection = db.collection("banners");

    const query = { isActive: true };
    if (req.query.position) {
      query.position = req.query.position;
    }

    const banners = await bannersCollection
      .find(query)
      .sort({ serial: 1, createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBannersAdmin = async (req, res) => {
  try {
    const db = getDB();
    const bannersCollection = db.collection("banners");

    const banners = await bannersCollection
      .find()
      .sort({ position: 1, serial: 1 })
      .toArray();

    res.status(200).json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const db = getDB();
    const bannersCollection = db.collection("banners");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const result = await bannersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Banner updated successfully",
        banner: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const db = getDB();
    const bannersCollection = db.collection("banners");

    const result = await bannersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBanner,
  getBanners,
  getAllBannersAdmin,
  updateBanner,
  deleteBanner,
};
