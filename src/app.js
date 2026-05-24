const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.route");
const productRoutes = require("./routes/product.route")

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// api endpoint

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "E-commerce API is running smoothly." });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app;
