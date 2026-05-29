const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { sendFacebookEvent } = require("../utils/facebookTracking");

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const createProduct = async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection("products");

    let productData = req.body;

    if (!productData.slug) {
      productData.slug = generateSlug(productData.name);
    }

    const existingProduct = await productsCollection.findOne({
      $or: [{ sku: productData.sku }, { slug: productData.slug }],
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU or Slug already exists",
      });
    }

    productData.createdAt = new Date();
    productData.updatedAt = new Date();
    productData.totalSold = 0;

    if (!productData.metadata) {
      productData.metadata = {};
    }
    productData.metadata.addedBy = {
      id: req.user.id,
      role: req.user.role,
    };

    const result = await productsCollection.insertOne(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      productId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection("products");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 16; 
    const skip = (page - 1) * limit;

    const query = { "status.isActive": true };

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }
    
    if (req.query.category) {
      query["category.main"] = { $regex: new RegExp(`^${req.query.category}$`, "i") };
    }
    
    if (req.query.subCategory) {
      query["category.sub"] = req.query.subCategory;
    }
    
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      query["pricing.price"] = {};
      if (req.query.minPrice)
        query["pricing.price"].$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice)
        query["pricing.price"].$lte = parseInt(req.query.maxPrice);
    }

    const sortOption = {};
    if (req.query.sortBy) {
      if (req.query.sortBy === "price_asc") sortOption["pricing.price"] = 1;
      else if (req.query.sortBy === "price_desc") sortOption["pricing.price"] = -1;
      else if (req.query.sortBy === "totalSold") sortOption.totalSold = -1;
      else {
        const order = req.query.sortOrder === "desc" ? -1 : 1;
        sortOption[req.query.sortBy] = order;
      }
    } else {
      sortOption.createdAt = -1;
    }

    const projection = {
      name: 1,
      slug: 1,
      "pricing.price": 1,
      "pricing.oldPrice": 1,
      "media.thumbnail": 1,
      "category.main": 1,
      brand: 1,
      status: 1,
      "social.rating": 1,
    };

    const totalProducts = await productsCollection.countDocuments(query);
    const products = await productsCollection
      .find(query)
      .project(projection)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      meta: {
        totalProducts,
        totalPages,
        currentPage: page,
        limit,
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection("products");

    const product = await productsCollection.findOne({ slug: req.params.slug });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    sendFacebookEvent(
      "ViewContent",
      {},
      {
        value: product.pricing.price,
        contentName: product.name,
        contentIds: [product._id.toString()],
      },
      { ip: req.ip, userAgent: req.headers["user-agent"] },
    ).catch((err) => console.error(err));

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection("products");

    let updateData = req.body;
    updateData.updatedAt = new Date();

    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name);
    }

    const result = await productsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection("products");

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};
