module.exports.config = {
  name: "pp",
  version: "2.0.0",
  permission: 0,
  credits: "Milon Fix (No Token)",
  prefix: true,
  description: "Send Facebook profile picture without token",
  category: "image"
};

module.exports.run = async function ({ api, event, args }) {
  let uid;

  if (event.type === "message_reply") {
    uid = event.messageReply.senderID;
  } else if (Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
  } else if (args[0]) {
    uid = args[0];
  } else {
    uid = event.senderID;
  }

  const imgURL = `https://graph.facebook.com/${uid}/picture?type=large`;

  return api.sendMessage(
    {
      body: "🖼️ Profile Picture",
      attachment: await global.utils.getStreamFromURL(imgURL)
    },
    event.threadID
  );
};
