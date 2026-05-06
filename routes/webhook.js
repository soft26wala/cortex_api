import express from "express"
import { sendText, sendButtons, sendImage } from "../wabhookfun/sms.js"

const router = express.Router()

let db
export const setWebhookDB = (database) => {
  db = database
}

// 🔥 VERIFY
router.options("/", (req, res) => {
  res.sendStatus(200)
})

router.get("/", (req, res) => {
  const VERIFY_TOKEN = "my_verify_token"

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified ✅")
    return res.status(200).send(challenge)
  }

  res.sendStatus(403)
})


// 🧠 🔥 RUN NODE (MAIN ENGINE)
const runNode = async (client, to, node) => {
  let textParts = []
  let imageUrl = null

  // blocks parse
  node.blocks?.forEach((b) => {
    if (b.type === "heading" || b.type === "text") {
      textParts.push(b.text || b.content || "")
    }

    if (b.type === "image") {
      imageUrl = b.url
    }
  })

  const finalText = textParts.join("\n")

  // 🔥 1. IMAGE
  if (imageUrl) {
    await sendImage(client, to, imageUrl, finalText || "")
  }

  // 🔥 2. TEXT
  if (!imageUrl && finalText) {
    await sendText(client, to, finalText)
  }

  // 🔥 3. BUTTONS
  if (node.buttons?.length) {
    await sendButtons(client, to, finalText || "Choose option:", node.buttons)
  }
}


// 🔥 RECEIVE MESSAGE
router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    const message = value?.messages?.[0]
    if (!message) return res.sendStatus(200)

    const from = message.from
    const phoneNumberId = value.metadata.phone_number_id

    const text = message.text?.body?.toLowerCase() || ""
    const buttonReply = message.interactive?.button_reply?.id

    console.log("📩 Incoming:", text || buttonReply)

    // 🔥 STEP 1: FIND CLIENT
    const clientRes = await db.query(
      "SELECT * FROM clients WHERE phone_number_id = $1",
      [phoneNumberId]
    )

    const client = clientRes.rows[0]
    if (!client) {
      console.log("❌ Client not found")
      return res.sendStatus(200)
    }

    // 🔥 STEP 2: LOAD FLOW
    const flowRes = await db.query(
      `SELECT data FROM flows
       WHERE client_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [client.id]
    )

    const flow = flowRes.rows[0]?.data
    if (!flow) return res.sendStatus(200)

    // ============================================
    // 🔥 STEP 3: BUTTON CLICK FLOW
    // ============================================
    if (buttonReply) {
      console.log("👉 Button clicked:", buttonReply)

      let clickedButton = null

      for (const node of flow.nodes) {
        const btn = node.buttons?.find(b => b.id === buttonReply)
        if (btn) {
          clickedButton = btn
          break
        }
      }

      if (!clickedButton) return res.sendStatus(200)

      // 🔥 NEXT NODE
      const nextNode = flow.nodes.find(
        n => n.id === clickedButton.nextNodeId
      )

      if (!nextNode) return res.sendStatus(200)

      await runNode(client, from, nextNode)

      return res.sendStatus(200)
    }

    // ============================================
    // 🔥 STEP 4: TRIGGER FLOW
    // ============================================
    const node = flow.nodes.find(n =>
      n.triggers?.some(t =>
        text.includes(t.toLowerCase())
      )
    )

    if (!node) {
      await sendText(client, from, "Sorry, I didn't understand.")
      return res.sendStatus(200)
    }

    await runNode(client, from, node)

    res.sendStatus(200)

  } catch (err) {
    console.error("❌ Webhook error:", err)
    res.sendStatus(500)
  }
})

export default router