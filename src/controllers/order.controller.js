const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createOrder = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    const { userInfo, userId, orderItems, pricing, payment, shippingDetails } =
      req.body;

    const bulkOperations = orderItems.map((item) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(item.productId),
          "inventory.stock": { $gte: item.quantity },
        },
        update: { $inc: { "inventory.stock": -item.quantity } },
      },
    }));

    if (bulkOperations.length > 0) {
      const bulkResult = await productsCollection.bulkWrite(bulkOperations);
      if (bulkResult.modifiedCount !== orderItems.length) {
        return res.status(400).json({
          success: false,
          message:
            "One or more items are out of stock or the requested quantity is unavailable",
        });
      }
    }

    const newOrder = {
      userInfo,
      userId: userId ? new ObjectId(userId) : null,
      orderItems,
      pricing,
      payment: {
        method: payment?.method || "Cash on Delivery",
        status: payment?.status || "Pending",
        transactionId: payment?.transactionId || null,
      },
      orderStatus: "Pending",
      shippingDetails: shippingDetails || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(newOrder);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");

    const orders = await ordersCollection
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }
    if (req.query.phone) {
      query["userInfo.phoneNumber"] = req.query.phone;
    }

    const totalOrders = await ordersCollection.countDocuments(query);
    const orders = await ordersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      meta: {
        totalOrders,
        totalPages,
        currentPage: page,
        limit,
      },
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");

    const { orderStatus, paymentStatus } = req.body;
    const updateData = { updatedAt: new Date() };

    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData["payment.status"] = paymentStatus;

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Order updated successfully",
        order: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
