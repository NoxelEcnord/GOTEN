//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

const axios = require('axios');
const FormData = require('form-data');

const ONERENDER_API_KEY = process.env.ONERENDER_API_KEY || '';

async function renderOnOneRender(options) {
    try {
        const formData = new FormData();
        
        // Add required parameters
        formData.append('apiKey', ONERENDER_API_KEY);
        formData.append('template', options.template);
        
        // Add optional parameters if provided
        if (options.data) {
            formData.append('data', JSON.stringify(options.data));
        }
        if (options.width) {
            formData.append('width', options.width);
        }
        if (options.height) {
            formData.append('height', options.height);
        }
        if (options.format) {
            formData.append('format', options.format);
        }

        const response = await axios.post('https://api.onerender.com/v1/render', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error) {
        console.error('OneRender Error:', error.message);
        throw error;
    }
}

module.exports = {
    renderOnOneRender
};

//=====================//
//     © 2025          //
//=====================// 