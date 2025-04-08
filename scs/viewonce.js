//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

async function handleViewOnceCommand(dest, zk, commandeOptions) {
    const { repondre, msgRepondu } = commandeOptions;
    
    if (!msgRepondu) {
        repondre("Please reply to a message to make it view-once");
        return;
    }

    try {
        // Forward the message with view-once enabled
        await zk.sendMessage(dest, {
            forward: msgRepondu,
            viewOnce: true
        }, { quoted: commandeOptions.msgRepondu });
        
        repondre("✅ Message converted to view-once");
    } catch (error) {
        repondre(`❌ Error: ${error.message}`);
    }
}

module.exports = {
    name: 'viewonce',
    handleViewOnceCommand
};

//=====================//
//     © 2025          //
//=====================// 