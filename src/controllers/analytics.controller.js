const { getDB } = require("../config/db");

const getDashboardAnalytics = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const couponsCollection = db.collection("coupons");
    const bannersCollection = db.collection("banners");
    const sectionsCollection = db.collection("sections");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalCustomers,
      totalProducts,
      totalActiveCoupons,
      totalActiveBanners,
      totalActiveSections,
      orderStatusCounts,
      revenueResult,
      last7DaysSales,
      topSellingProducts,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      usersCollection.countDocuments({ role: "customer" }),

      productsCollection.countDocuments({ "status.isActive": true }),

      couponsCollection.countDocuments({ isActive: true }),

      bannersCollection.countDocuments({ isActive: true }),

      sectionsCollection.countDocuments({ isActive: true }),

      ordersCollection
        .aggregate([
          {
            $group: {
              _id: "$orderStatus",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .aggregate([
          { $match: { orderStatus: "Delivered" } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$pricing.totalAmount" },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .aggregate([
          {
            $match: {
              createdAt: { $gte: sevenDaysAgo },
              orderStatus: { $ne: "Cancelled" },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              dailySales: { $sum: "$pricing.totalAmount" },
              orderCount: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      ordersCollection
        .aggregate([
          { $match: { orderStatus: { $ne: "Cancelled" } } },
          { $unwind: "$orderItems" },
          {
            $group: {
              _id: "$orderItems.productId",
              name: { $first: "$orderItems.name" },
              image: { $first: "$orderItems.image" },
              totalSold: { $sum: "$orderItems.quantity" },
            },
          },
          { $sort: { totalSold: -1 } },
          { $limit: 5 },
        ])
        .toArray(),

      productsCollection
        .find({ "status.isActive": true, "inventory.stock": { $lte: 10 } })
        .project({ name: 1, "inventory.stock": 1, "media.thumbnail": 1 })
        .limit(5)
        .toArray(),

      ordersCollection
        .find({})
        .project({
          "userInfo.name": 1,
          "pricing.totalAmount": 1,
          orderStatus: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ]);

    const orderStatusBreakdown = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    let totalOrders = 0;

    orderStatusCounts.forEach((status) => {
      if (orderStatusBreakdown[status._id] !== undefined) {
        orderStatusBreakdown[status._id] = status.count;
      }
      totalOrders += status.count;
    });

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          totalActiveCoupons,
          totalActiveBanners,
          totalActiveSections,
        },
        orderStatusBreakdown,
        last7DaysSales,
        topSellingProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
};
