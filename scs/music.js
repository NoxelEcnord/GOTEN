const ytdl = require('ytdl-core');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const path = require('path');
const { adams } = require('../Ibrahim/adams');

const MUSIC_DIR = path.join(__dirname, '../music');
if (!require('fs').existsSync(MUSIC_DIR)) {
    require('fs').mkdirSync(MUSIC_DIR);
}

adams({
    nomCom: 'play',
    categorie: 'Music',
    reaction: '🎵'
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, arg } = commandeOptions;
    
    if (!arg[0]) {
        return repondre('Please provide a YouTube URL or search term');
    }

    try {
        // Get video info
        const videoUrl = arg[0].includes('youtube.com') ? arg[0] : `ytsearch:${arg.join(' ')}`;
        const info = await ytdl.getInfo(videoUrl);
        const videoDetails = info.videoDetails;
        
        // Get available formats
        const formats = info.formats.filter(format => 
            (format.hasAudio && !format.hasVideo) || // Audio only
            (format.hasAudio && format.hasVideo)    // Video with audio
        );

        // Create format options
        const formatOptions = [
            { type: 'mp3', quality: '128kbps', format: formats.find(f => f.audioBitrate === 128) },
            { type: 'mp3', quality: '192kbps', format: formats.find(f => f.audioBitrate === 192) },
            { type: 'mp4', quality: '360p', format: formats.find(f => f.qualityLabel === '360p') },
            { type: 'mp4', quality: '720p', format: formats.find(f => f.qualityLabel === '720p') }
        ].filter(opt => opt.format);

        // Create menu message
        let menuMessage = `*🎵 ${videoDetails.title}*\n\n`;
        menuMessage += '*Available Formats:*\n';
        formatOptions.forEach((opt, index) => {
            menuMessage += `${index + 1}. ${opt.type.toUpperCase()} (${opt.quality})\n`;
        });
        menuMessage += '\nReply with the number of your choice';

        // Send menu with thumbnail
        await zk.sendMessage(dest, {
            image: { url: videoDetails.thumbnails[0].url },
            caption: menuMessage
        }, { quoted: ms });

        // Wait for user response
        const response = await new Promise((resolve) => {
            const handler = async (message) => {
                if (message.from === dest && message.quoted?.id === ms.id) {
                    const choice = parseInt(message.body);
                    if (choice >= 1 && choice <= formatOptions.length) {
                        resolve(choice - 1);
                    }
                }
            };
            zk.ev.on('messages.upsert', handler);
            setTimeout(() => {
                zk.ev.off('messages.upsert', handler);
                resolve(null);
            }, 30000);
        });

        if (response === null) {
            return repondre('No response received. Please try again.');
        }

        const selectedFormat = formatOptions[response];
        const fileName = `${videoDetails.title.replace(/[^\w\s]/gi, '')}.${selectedFormat.type}`;
        const filePath = path.join(MUSIC_DIR, fileName);

        // Send processing message
        await repondre(`Fetching ${selectedFormat.type.toUpperCase()} (${selectedFormat.quality})...`);

        // Download the file
        const video = ytdl(videoUrl, {
            format: selectedFormat.format,
            quality: selectedFormat.quality
        });

        await pipeline(
            video,
            createWriteStream(filePath)
        );

        // Send the file
        await zk.sendMessage(dest, {
            document: { url: filePath },
            mimetype: `application/${selectedFormat.type}`,
            fileName: fileName
        }, { quoted: ms });

        // Clean up
        require('fs').unlinkSync(filePath);

    } catch (error) {
        console.error('Music download error:', error);
        repondre('Error downloading music. Please try again.');
    }
}); 