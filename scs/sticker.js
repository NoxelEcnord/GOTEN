const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const {adams} = require("../Ibrahim/adams");

adams({
  nomCom: "sticker",
  categorie: "Media",
  reaction: "🎨"
},
async (dest, zk, commandeOptions) => {
  const { repondre, msgRepondu } = commandeOptions;
  
  if (!msgRepondu) {
    repondre("Please reply to an image or video to convert it to sticker");
    return;
  }
  
  try {
    let stickerMess = new Sticker(media, {
      pack: 'GOTEN',
      type: StickerTypes.CROPPED,
      categories: ["🤩", "🎉"],
      id: "12345",
      quality: 70,
      background: "transparent",
    });
    const stickerBuffer2 = await stickerMess.toBuffer();
    zk.sendMessage(dest, { sticker: stickerBuffer2 }, { quoted: msgRepondu });
  } catch (error) {
    repondre("Error creating sticker: " + error.message);
  }
});
