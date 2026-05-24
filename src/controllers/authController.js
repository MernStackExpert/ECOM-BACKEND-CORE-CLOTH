const bcrypt = require("bcrypt");
const { getDB } = require("../config/db");
const { generateToken } = require("../utils/token");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const token = generateToken({ id: result.insertedId, role: newUser.role });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser };
