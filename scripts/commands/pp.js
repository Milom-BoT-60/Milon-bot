const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pp",
  version: "2.1.0",
  permission: 0,
  credits: "Imran",
  prefix: true,
  description: "Send profile picture using UID, mention, or reply with PIN protection",
  category: "image",
  usages: "[uid/reply/mention] PIN",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, global }) {
  const SECURE_PIN = "1234"; // PIN যেটা দিবে, এটা অবশ্যই একই হতে হবে

  let uid;

  // ---------------- Get UID ----------------
  if (event.type === "message_reply" && event.messageReply?.senderID) {
    uid = event.messageReply.senderID;
  } else if (event.mentions && Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
  } else if (args[0] && /^\d+$/.test(args[0])) {
    uid = args[0];
  } else {
    uid = event.senderID;
  }

  // ---------------- Get PIN ----------------
  // PIN সর্বদা শেষ args-এ হবে
  const pin = args[args.length - 1];
  if (pin !== SECURE_PIN) {
    return api.sendMessage("❌ Access denied! PIN missing or incorrect.", event.threadID, event.messageID);
  }

  // ---------------- Prepare URL ----------------
  if (!global.imranapi || !global.imranapi.imran) {
    return api.sendMessage("❌ API configuration missing! Check global.imranapi.imran", event.threadID, event.messageID);
  }

  const imageUrl = `${global.imranapi.imran}/api/fbp?uid=${uid}`;
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `${uid}.jpg`);

  try {
    await fs.ensureDir(cacheDir);

    const response = await axios.get(imageUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `━━ ❖ 𝑷𝑹𝑶𝑭𝑰𝑳𝑬 𝑷𝑰𝑪 ❖ ━━`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

    writer.on("error", (err) => {
      console.error("❌ Error writing file:", err);
      api.sendMessage("❌ প্রোফাইল পিক আনতে সমস্যা হয়েছে!", event.threadID, event.messageID);
    });

  } catch (err) {
    console.error("❌ Error fetching profile picture:", err);
    api.sendMessage("❌ প্রোফাইল পিক আনতে সমস্যা হয়েছে!", event.threadID, event.messageID);
  }
};
