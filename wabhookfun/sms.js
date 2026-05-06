export const sendText = async (client, to, text) => {
  return fetch(
    `https://graph.facebook.com/v25.0/${client.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "jaspers_market_plain_text_v1",
          language: {
            code: "en_US",
          },
        },
      }),
    },
  );
};

export const sendImage = async (client, to, imageUrl, caption = "") => {
  return fetch(
    `https://graph.facebook.com/v25.0/${client.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: {
          link: imageUrl, // 🔥 Cloudinary URL
          caption,
        },
      }),
    },
  );
};

export const sendButtons = async (client, to, text, buttons) => {
  return fetch(
    `https://graph.facebook.com/v25.0/${client.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: buttons.map((b, i) => ({
              type: "reply",
              reply: {
                id: b.id || `btn_${i}`, // 🔥 important
                title: b.text.slice(0, 20), // max 20 chars
              },
            })),
          },
        },
      }),
    },
  );
};
