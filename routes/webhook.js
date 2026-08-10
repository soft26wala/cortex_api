import express from "express";
import { sendText, sendButtons, sendImage } from "../wabhookfun/sms.js";

const router = express.Router();

let db;
export const setWebhookDB = (database) => {
  db = database;
};

// 🔥 VERIFY WEBHOOK
router.options("/", (req, res) => {
  res.sendStatus(200);
});

router.get("/", (req, res) => {
  console.log("👉 Webhook verification request received");
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "my_verify_token";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Helper function to find connected target node using edges or nextNodeId
const getNextNode = (flow, currentNode) => {
  if (!currentNode) return null;

  // 1. Check direct nextNodeId property
  if (currentNode.data?.nextNodeId) {
    const found = flow.nodes.find((n) => n.id === currentNode.data.nextNodeId);
    if (found) return found;
  }

  // 2. Check edges array
  if (Array.isArray(flow.edges)) {
    const edge = flow.edges.find((e) => e.source === currentNode.id);
    if (edge) {
      return flow.nodes.find((n) => n.id === edge.target) || null;
    }
  }

  return null;
};

// Helper function to run/render a node
const runNode = async (client, to, node, flow) => {
  if (!node) return;

  const nodeData = node.data || node;
  const nodeType = nodeData.type || node.type;

  console.log(`🤖 Executing Node [${node.id}] Type: ${nodeType}`);

  // Extract content
  let textContent = nodeData.text || nodeData.content || nodeData.body || nodeData.label || "";
  let imageUrl = nodeData.imageUrl || null;

  // Parse blocks if present
  if (Array.isArray(nodeData.blocks)) {
    const textParts = [];
    nodeData.blocks.forEach((b) => {
      if (b.type === "heading" || b.type === "text") {
        textParts.push(b.text || b.content || "");
      }
      if (b.type === "image") {
        imageUrl = b.url || imageUrl;
      }
    });
    if (textParts.length > 0) {
      textContent = textParts.join("\n");
    }
  }

  // 1. Send Image
  if (imageUrl) {
    await sendImage(client, to, imageUrl, textContent || "");
  }

  // 2. Send Buttons if interactive
  if (Array.isArray(nodeData.buttons) && nodeData.buttons.length > 0) {
    await sendButtons(client, to, textContent || "Please select an option:", nodeData.buttons);
    return; // Wait for button reply
  }

  // 3. Send Text if standard message/trigger
  if (!imageUrl && textContent && nodeType !== "trigger") {
    await sendText(client, to, textContent);
  }

  // Auto-advance to next connected node if no user choice required
  if (nodeType !== "buttons" && nodeType !== "input") {
    const next = getNextNode(flow, node);
    if (next && next.id !== node.id) {
      // Avoid infinite loops by running next node
      await runNode(client, to, next, flow);
    }
  }
};

// 🔥 RECEIVE WEBHOOK MESSAGE
router.post("/", async (req, res) => {
  console.log("📩 Incoming webhook request:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;
    const phoneNumberId = value.metadata?.phone_number_id;

    const text = (message.text?.body || "").trim().toLowerCase();
    const buttonReply = message.interactive?.button_reply?.id;

    console.log(`📩 Incoming message from ${from} (phoneId: ${phoneNumberId}): "${text || buttonReply}"`);

    // STEP 1: FIND CLIENT
    const clientRes = await db.query(
      "SELECT * FROM clients WHERE phone_number_id = $1 OR phone = $1",
      [phoneNumberId]
    );

    let client = clientRes.rows[0];

    // Fallback: If test environment or first client
    if (!client) {
      const fallbackClientRes = await db.query("SELECT * FROM clients ORDER BY id ASC LIMIT 1");
      client = fallbackClientRes.rows[0];
    }

    if (!client) {
      console.log("❌ No registered client found for WhatsApp Business number.");
      return res.sendStatus(200);
    }

    // STEP 2: LOAD ACTIVE FLOW
    const flowRes = await db.query(
      `SELECT data FROM flows
       WHERE client_id = $1 AND (is_active = TRUE OR is_active IS NULL)
       ORDER BY updated_at DESC
       LIMIT 1`,
      [client.id]
    );

    const flow = flowRes.rows[0]?.data;
    if (!flow || !Array.isArray(flow.nodes)) {
      console.log("❌ No active flow configured for client.");
      return res.sendStatus(200);
    }

    // STEP 3: HANDLE BUTTON REPLIES
    if (buttonReply) {
      console.log("👉 Button clicked:", buttonReply);

      let clickedButton = null;
      let parentNode = null;

      for (const node of flow.nodes) {
        const buttons = node.data?.buttons || node.buttons;
        if (Array.isArray(buttons)) {
          const btn = buttons.find((b) => b.id === buttonReply);
          if (btn) {
            clickedButton = btn;
            parentNode = node;
            break;
          }
        }
      }

      if (clickedButton) {
        let nextNode = null;
        if (clickedButton.nextNodeId) {
          nextNode = flow.nodes.find((n) => n.id === clickedButton.nextNodeId);
        }
        if (!nextNode) {
          nextNode = getNextNode(flow, parentNode);
        }

        if (nextNode) {
          await runNode(client, from, nextNode, flow);
        }
      }

      return res.sendStatus(200);
    }

    // STEP 4: TRIGGER MATCHING
    const matchingNode = flow.nodes.find((n) => {
      const triggers = n.data?.triggers || n.triggers;
      if (Array.isArray(triggers)) {
        return triggers.some((t) => text.includes(t.toLowerCase()) || text === t.toLowerCase());
      }
      return false;
    });

    if (matchingNode) {
      // Find node following the trigger
      const firstActionNode = getNextNode(flow, matchingNode) || matchingNode;
      await runNode(client, from, firstActionNode, flow);
      return res.sendStatus(200);
    }

    // STEP 5: DEFAULT FALLBACK / STARTING NODE
    const startNode = flow.nodes.find((n) => n.type === "trigger" || n.data?.type === "trigger") || flow.nodes[0];
    if (startNode) {
      const firstActionNode = getNextNode(flow, startNode) || startNode;
      await runNode(client, from, firstActionNode, flow);
    } else {
      await sendText(client, from, "Hello! Thank you for reaching out.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.sendStatus(500);
  }
});

export default router;