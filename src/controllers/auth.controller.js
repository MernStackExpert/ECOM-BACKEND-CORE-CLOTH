const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { generateToken } = require("../utils/token");

const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, role, image, address } =
      req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ phoneNumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email: email || "",
      phoneNumber,
      password: hashedPassword,
      role: role || "customer",
      image: image || "",
      address: {
        street: address?.street || "",
        city: address?.city || "",
        country: address?.country || "",
      },
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const token = generateToken({ id: result.insertedId, role: newUser.role });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertedId, ...userWithoutPassword },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ phoneNumber });
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials or account inactive",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, image, address } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (image) updateData.image = image;
    if (address) updateData.address = address;

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user.id) },
      { $set: updateData },
      { returnDocument: "after", projection: { password: 0 } },
    );

    res.status(200).json({ success: true, user: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.id),
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
    );

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserRoleStatus = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");

    const updateData = { updatedAt: new Date() };
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after", projection: { password: 0 } },
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User privileges updated successfully",
      user: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMyProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRoleStatus
};
