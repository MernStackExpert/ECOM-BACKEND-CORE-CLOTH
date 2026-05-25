const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const createCategory = async (req, res) => {
  try {
    const db = getDB();
    const categoriesCollection = db.collection("categories");

    const { name, image, description, isActive, isTop, isTrending } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const slug = generateSlug(name);

    const existingCategory = await categoriesCollection.findOne({ slug });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const newCategory = {
      name,
      slug,
      image: image || "",
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      isTop: isTop !== undefined ? isTop : false,
      isTrending: isTrending !== undefined ? isTrending : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await categoriesCollection.insertOne(newCategory);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      categoryId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const db = getDB();
    const categoriesCollection = db.collection("categories");

    const { isTop, isTrending } = req.query;
    let query = { isActive: true };

    if (isTop === "true") query.isTop = true;
    if (isTrending === "true") query.isTrending = true;

    const categories = await categoriesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res
      .status(200)
      .json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const db = getDB();
    const categoriesCollection = db.collection("categories");

    const categories = await categoriesCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res
      .status(200)
      .json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const db = getDB();
    const categoriesCollection = db.collection("categories");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const result = await categoriesCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Category updated successfully",
        category: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const db = getDB();
    const categoriesCollection = db.collection("categories");
    const productsCollection = db.collection("products");

    const categoryId = new ObjectId(req.params.id);

    const linkedProducts = await productsCollection.countDocuments({
      "category.id": categoryId,
    });
    if (linkedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${linkedProducts} products are linked to it.`,
      });
    }

    const result = await categoriesCollection.deleteOne({ _id: categoryId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getAllCategoriesAdmin,
  updateCategory,
  deleteCategory,
};
