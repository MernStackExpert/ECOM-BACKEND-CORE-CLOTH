const crypto = require("crypto");

const hashData = (data) => {
  if (!data) return null;
  return crypto
    .createHash("sha256")
    .update(String(data).trim().toLowerCase())
    .digest("hex");
};

const sendFacebookEvent = async (
  eventName,
  userData = {},
  customData = {},
  reqData = {},
) => {
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
            client_ip_address: reqData.ip || null,
            client_user_agent: reqData.userAgent || null,
          },
          custom_data: {
            currency: "BDT",
            value: customData.value || 0,
            order_id: customData.orderId || null,
            content_name: customData.contentName || null,
            content_ids: customData.contentIds || [],
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
