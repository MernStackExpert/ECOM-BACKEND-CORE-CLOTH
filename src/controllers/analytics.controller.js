const { getDB } = require("../config/db");

const getDashboardAnalytics = async (req, res) => {
  try {
    const db = getDB();
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");
    const couponsCollection = db.collection("coupons");
    const bannersCollection = db.collection("banners");
    const sectionsCollection = db.collection("sections");
    const faqsCollection = db.collection("faqs");
    const testimonialsCollection = db.collection("testimonials");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      customerStatsResult,
      categoryStatsResult,
      totalProducts,
      totalActiveCoupons,
      totalActiveBanners,
      totalActiveSections,
      totalFaqs,
      totalTestimonials,
      outOfStockCount,
      orderStatusCounts,
      revenueResult,
      last7DaysSales,
      topSellingProducts,
      lowStockProducts,
      recentOrders,
      inventoryResult,
      todaySalesResult,
      discountResult,
      ratingResult,
    ] = await Promise.all([
      usersCollection
        .aggregate([
          { $match: { role: "customer" } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $ne: ["$isActive", false] }, 1, 0] },
              },
              inactive: {
                $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
              },
            },
          },
        ])
        .toArray(),

      categoriesCollection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: ["$isActive", 1, 0] } },
              trending: { $sum: { $cond: ["$isTrending", 1, 0] } },
              top: { $sum: { $cond: ["$isTop", 1, 0] } },
            },
          },
        ])
        .toArray(),

      productsCollection.countDocuments({ "status.isActive": true }),

      couponsCollection.countDocuments({ isActive: true }),

      bannersCollection.countDocuments({ isActive: true }),

      sectionsCollection.countDocuments({ isActive: true }),

      faqsCollection.countDocuments({ isActive: true }),

      testimonialsCollection.countDocuments({ isActive: true }),

      productsCollection.countDocuments({ "inventory.stock": { $lte: 0 } }),

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
        .find({
          "status.isActive": true,
          "inventory.stock": { $lte: 10, $gt: 0 },
        })
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

      productsCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalStock: { $sum: "$inventory.stock" },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .aggregate([
          {
            $match: {
              createdAt: { $gte: startOfToday },
              orderStatus: { $ne: "Cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              todayRevenue: { $sum: "$pricing.totalAmount" },
              todayOrders: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .aggregate([
          { $match: { orderStatus: { $ne: "Cancelled" } } },
          {
            $group: {
              _id: null,
              totalDiscountGiven: { $sum: "$pricing.discountAmount" },
            },
          },
        ])
        .toArray(),

      testimonialsCollection
        .aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
            },
          },
        ])
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

    const totalCustomers =
      customerStatsResult.length > 0 ? customerStatsResult[0].total : 0;
    const totalActiveCustomers =
      customerStatsResult.length > 0 ? customerStatsResult[0].active : 0;
    const totalInactiveCustomers =
      customerStatsResult.length > 0 ? customerStatsResult[0].inactive : 0;

    const totalCategories =
      categoryStatsResult.length > 0 ? categoryStatsResult[0].total : 0;
    const totalActiveCategories =
      categoryStatsResult.length > 0 ? categoryStatsResult[0].active : 0;
    const totalTrendingCategories =
      categoryStatsResult.length > 0 ? categoryStatsResult[0].trending : 0;
    const totalTopCategories =
      categoryStatsResult.length > 0 ? categoryStatsResult[0].top : 0;

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const totalInventory =
      inventoryResult.length > 0 ? inventoryResult[0].totalStock : 0;

    const todaysRevenue =
      todaySalesResult.length > 0 ? todaySalesResult[0].todayRevenue : 0;
    const todaysOrders =
      todaySalesResult.length > 0 ? todaySalesResult[0].todayOrders : 0;

    const totalDiscountGiven =
      discountResult.length > 0 ? discountResult[0].totalDiscountGiven : 0;
    const averageRating =
      ratingResult.length > 0
        ? Number(ratingResult[0].averageRating.toFixed(1))
        : 0;

    const averageOrderValue =
      totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          todaysRevenue,
          totalOrders,
          todaysOrders,
          totalPendingOrders: orderStatusBreakdown.Pending,
          averageOrderValue,
          totalCustomers,
          totalActiveCustomers,
          totalInactiveCustomers,
          totalCategories,
          totalActiveCategories,
          totalTrendingCategories,
          totalTopCategories,
          totalProducts,
          totalInventory,
          outOfStockCount,
          totalDiscountGiven,
          totalActiveCoupons,
          totalActiveBanners,
          totalActiveSections,
          totalFaqs,
          totalTestimonials,
          averageRating,
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
