//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

async function handleContactCommand(dest, zk, commandeOptions) {
    const { repondre } = commandeOptions;
    
    const contactMessage = `╭─────────────━┈⊷
│ GOTEN Contact Info
╰─────────────━┈⊷

╭─────────────━┈⊷
│ 📱 Contact & Support:
│ • Telegram: t.me/botGOTEN
│ • WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6
│ • WhatsApp Channel: https://whatsapp.com/channel/0029VaevRgSEwEjnvksGQp2K
╰─────────────━┈⊷

> Regards GOTEN`;

    await repondre(contactMessage);
}

module.exports = {
    name: 'contact',
    handleContactCommand
};

//=====================//
//     © 2025          //
//=====================// 