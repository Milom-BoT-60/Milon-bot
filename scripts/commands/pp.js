const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// ---------------- Config ----------------
const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN"; // Bot Page token
const VERIFY_TOKEN = "YOUR_VERIFY_TOKEN"; // Webhook verify token
const SECURE_PIN = "1234"; // যাকে জানাবে, শুধু সে পিক পাবে

// ---------------- Webhook verification ----------------
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if(mode && token){
        if(token === VERIFY_TOKEN){
            console.log('✅ Webhook verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// ---------------- Receive messages ----------------
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if(body.object === 'page'){
        body.entry.forEach(async entry => {
            const webhookEvent = entry.messaging[0];
            const senderPsid = webhookEvent.sender.id;

            if(webhookEvent.message && webhookEvent.message.text){
                const messageText = webhookEvent.message.text.trim().toLowerCase();
                
                // format: get pic 1234 pik.sj
                if(messageText.startsWith("get pic")){
                    const parts = webhookEvent.message.text.split(" ");
                    const pin = parts[2];
                    const customName = parts[3] || `profile_pic_${senderPsid}`;

                    if(pin === SECURE_PIN){
                        await fetchProfilePic(senderPsid, customName);
                    } else {
                        sendTextMessage(senderPsid, "❌ Invalid PIN! Access denied.");
                    }
                } else {
                    sendTextMessage(senderPsid, `You said: "${webhookEvent.message.text}"`);
                }
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// ---------------- Send text message ----------------
function sendTextMessage(senderPsid, message){
    axios.post(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderPsid },
        message: { text: message }
    }).catch(err => console.error("❌ Error sending message:", err.response?.data));
}

// ---------------- Fetch profile pic ----------------
async function fetchProfilePic(senderPsid, customName){
    try {
        const res = await axios.get(`https://graph.facebook.com/${senderPsid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`);
        const profilePicUrl = res.data.profile_pic;
        const userName = `${res.data.first_name}_${res.data.last_name}`;

        const path = `${customName.replace(/\.[^/.]+$/, "")}.jpg`; // auto .jpg

        const response = await axios({ method: 'GET', url: profilePicUrl, responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(path));

        response.data.on('end', () => {
            console.log(`✅ Profile picture saved: ${path}`);
            sendTextMessage(senderPsid, `Here is your profile picture: ${profilePicUrl}`);
        });

    } catch (err) {
        console.error("❌ Failed to fetch profile picture:", err.message);
        sendTextMessage(senderPsid, "❌ Failed to fetch profile picture.");
    }
}

// ---------------- Start server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 pp.js Messenger Bot running on port ${PORT}`));
