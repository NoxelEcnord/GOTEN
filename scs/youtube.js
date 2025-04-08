// 🇧​​​​​🇼​​​​​🇲​​​​​ 🇽​​​​​��​​​​​🇩​​​​​

const ytdl = require('ytdl-core');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const path = require('path');

async function downloadYouTubeAudio(url, outputPath) {
    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        
        const video = ytdl(url, {
            format: format,
            filter: 'audioonly',
            quality: 'highestaudio'
        });

        await pipeline(
            video,
            createWriteStream(outputPath)
        );

        return {
            success: true,
            title: info.videoDetails.title,
            path: outputPath
        };
    } catch (error) {
        console.error('YouTube download error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    downloadYouTubeAudio
};
