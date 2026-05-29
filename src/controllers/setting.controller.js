const { getDB } = require("../config/db");

const getSettings = async (req, res) => {
  try {
    const db = getDB();
    const settingsCollection = db.collection("settings");

    let settings = await settingsCollection.findOne({});

    if (!settings) {
      settings = {
        branding: { siteName: "", logo: "", favicon: "" },
        contact: { phone: "", email: "", address: "" },
        socialMedia: { facebook: "", instagram: "", youtube: "", whatsapp: "" , tiktok:""},
        trackingAndSeo: {
          facebookPixelId: "",
          googleAnalyticsId: "",
          metaTitle: "",
          metaDescription: "",
        },
        policies: {
          deliveryChargeInside: 0,
          deliveryChargeOutside: 0,
          returnPolicyText: "",
        },
        deleveryDiscount: {
          isActive: true,
          minOrder: 0,
          message:"",
        },
        isWebsiteOff: false,
      };
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const db = getDB();
    const settingsCollection = db.collection("settings");

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const result = await settingsCollection.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
