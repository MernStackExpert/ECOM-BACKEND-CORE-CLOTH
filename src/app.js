const express = require("express");
const cors = require("cors");

// ------------------------------------------- //
const authRoutes = require("./routes/auth.route");
const productRoutes = require("./routes/product.route");
const orderRoutes = require("./routes/order.route");
const settingRoutes = require("./routes/setting.route");
const couponRoutes = require("./routes/coupon.route");
const bannerRoutes = require("./routes/banner.route");
const sectionRoutes = require("./routes/section.route");
const analyticsRoutes = require("./routes/analytics.route");
const faqRoutes = require("./routes/faq.route");
const testimonialRoutes = require("./routes/testimonial.route");
const categoryRoutes = require("./routes/category.route");
// ------------------------------------------- //

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------> api endpoint <--------------- //

// auth
app.use("/api/auth", authRoutes);

// prodcuts
app.use("/api/products", productRoutes);

// orders
app.use("/api/orders", orderRoutes);

// setting
app.use("/api/settings", settingRoutes);

// copuon
app.use("/api/coupons", couponRoutes);

// banner
app.use("/api/banners", bannerRoutes);

// section
app.use("/api/sections", sectionRoutes);

// analytics
app.use("/api/analytics", analyticsRoutes);

// faqa
app.use("/api/faqs", faqRoutes);

// testimonials
app.use("/api/testimonials", testimonialRoutes);

// category
app.use("/api/categories", categoryRoutes);

// --------------------------------------------- //

app.get("/", (req, res) => {
  res
    .status(200)
    .json({
      success: true,
      message: "ALHAMDULILLAH E-commerce API is running smoothly.",
    });
});

app.use((req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: "INNAHLILLAH Route not found" });
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ success: false, message: "INNAHLILLAH Internal Server Error" });
});

module.exports = app;
