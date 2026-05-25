const crypto = require("crypto");

const hashData = (data) => {
  if (!data) return null;
  return crypto
    .createHash("sha256")
    .update(String(data).trim().toLowerCase())
    .digest("hex");
};

const sendFacebookEvent = async (eventName, userData, customData) => {
  try {
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const apiVersion = process.env.FB_API_VERSION || "v19.0";

    if (
      !pixelId ||
      !accessToken ||
      pixelId.includes("placeholder") ||
      accessToken.includes("placeholder")
    ) {
      return;
    }

    const hashedPhone = hashData(userData.phoneNumber);
    const hashedName = hashData(userData.name);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            ph: hashedPhone ? [hashedPhone] : [],
            fn: hashedName ? [hashedName] : [],
          },
          custom_data: {
            currency: "BDT",
            value: customData.totalAmount,
            order_id: customData.orderId,
          },
        },
      ],
    };

    if (process.env.FB_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.FB_TEST_EVENT_CODE;
    }

    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Facebook CAPI Error:", error.message);
  }
};

module.exports = { sendFacebookEvent };
