const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

const PODIO_WEBHOOK_URL = "https://workflow-automation.podio.com/catch/725u5fz7gkv185t";

app.post("/webhook/call", async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { data } = req.body;
    if (!data) {
      console.warn("No JWT token provided in request body");
      return res.status(400).json({ error: "JWT token is required" });
    }

    // decode JWT
    const decoded = jwt.decode(data, { complete: true });
    console.log("Decoded JWT:", decoded);

    if (!decoded || !decoded.payload) {
      console.warn("Invalid JWT token");
      return res.status(400).json({ error: "Invalid JWT" });
    }

    const payload = decoded.payload;

    // pick required fields
    const dataToSend = {
      state: payload.state,
      direction: payload.direction,
      contact: payload.contact,
      target_phone: payload.target?.phone || null,
      recording_url: payload.recording_url || null
    };

    console.log("Data to send to Podio:", dataToSend);

    // send to Podio webhook
    const podioResp = await fetch(PODIO_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    const podioText = await podioResp.text();
    console.log("Response from Podio:", podioText);

    res.json({
      message: "JWT processed and forwarded",
      forwarded: dataToSend,
      podioResponse: podioText,
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
