const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "pp",
  version: "1.0",
  permission: 0,
  description: "Send profile picture by UID, mention, or reply",
  category: "image"
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const { threadID, messageReply, mentions } = event;

    let userID = "";
    if (args[0]) userID = args[0];
    else if (messageReply) userID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) userID = Object.keys(mentions)[0];
    else return api.sendMessage("❌ দয়া করে user ID দিন বা reply করুন।", threadID);

    const token = "YOUR_FB_ACCESS_TOKEN";  // <-- এখানে FB token দিন
    const url = `https://graph.facebook.com/${userID}/picture?type=large&access_token=${token}`;

    const tmpFile = path.join(__dirname, `${userID}.jpg`);
    const response = await axios({ url, responseType: "stream" });
    const writer = fs.createWriteStream(tmpFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage({ body: `✨ এখানে ${userID}-এর প্রোফাইল ছবি:`, attachment: fs.createReadStream(tmpFile) }, threadID);
    fs.unlinkSync(tmpFile);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ প্রোফাইল ছবি আনা সম্ভব হয়নি।", event.threadID);
  }
};
