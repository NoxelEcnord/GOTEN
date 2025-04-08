const { adams } = require('../Ibrahim/adams');
const axios = require('axios');

adams({ nomCom: "quote", categorie: "Fun", reaction: "💭" }, async (dest, zk, commandeOptions) => {
  const { repondre } = commandeOptions;
  
  try {
    const response = await axios.get('https://api.quotable.io/random');
    const quote = response.data;
    
    let msg = `╔═══════════════════╗\n`;
    msg += `║   NORMAL BOT      ║\n`;
    msg += `╠═══════════════════╣\n`;
    msg += `║ ${quote.content}  ║\n`;
    msg += `║                   ║\n`;
    msg += `║ - ${quote.author} ║\n`;
    msg += `╚═══════════════════╝\n`;
    msg += `Powered by NORMAL BOT`;
    
    repondre(msg);
  } catch (error) {
    repondre("Error fetching quote: " + error.message);
  }
});
