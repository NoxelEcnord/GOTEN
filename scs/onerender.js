//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { renderOnOneRender } = require('./onerender');

const ONERENDER_API_KEY = process.env.ONERENDER_API_KEY || '';

async function handleOneRenderCommand(dest, zk, commandeOptions) {
    const { repondre, arg } = commandeOptions;
    
    if (!ONERENDER_API_KEY) {
        repondre("❌ OneRender API key not configured. Please set ONERENDER_API_KEY in your environment variables.");
        return;
    }

    if (!arg || arg.length < 2) {
        repondre("❌ Please provide a template name and data.\nExample: .onerender template_name {\"text\":\"Hello World\"}");
        return;
    }

    try {
        const [template, ...dataParts] = arg;
        const data = JSON.parse(dataParts.join(' '));

        const options = {
            template,
            data,
            width: 800,
            height: 600,
            format: 'png'
        };

        const imageBuffer = await renderOnOneRender(options);
        
        // Send the rendered image
        await zk.sendMessage(dest, {
            image: imageBuffer,
            caption: `✅ Rendered using OneRender\nTemplate: ${template}`
        }, { quoted: commandeOptions.msgRepondu });
    } catch (error) {
        repondre(`❌ Error: ${error.message}`);
    }
}

module.exports = {
    name: 'onerender',
    handleOneRenderCommand
};

//=====================//
//     © 2025          //
//=====================// 