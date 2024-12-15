import { Message } from 'node-telegram-bot-api';
import { CommandHelpers } from '../../types/Command';
import axios from 'axios';

module.exports = {
  command: ['fb', 'facebook'], // Command triggers
  noPrefix: false, // Requires prefix (e.g., "/fb")
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false,
  },
  description: "Download Facebook videos by providing a URL.",
  example: ["%cmd https://facebook.com/video-url"],
  run: async (message: Message, helpers: CommandHelpers) => {
    const { bot } = helpers;

    // Extract the text after the command (the video URL)
    const inputText = message.text?.split(' ').slice(1).join(' ');
    if (!inputText) {
      return bot.sendMessage(
        message.chat.id,
        "❌ Please provide a Facebook video URL.\nExample: `/fb https://facebook.com/video-url`"
      );
    }

    try {
      const apiUrl = `https://api.paxsenix.biz.id/dl/fb?url=${encodeURIComponent(inputText)}`;
      const response = await axios.get(apiUrl);

      if (!response.data.ok || !response.data.url || response.data.url.length === 0) {
        throw new Error("Failed to retrieve download links.");
      }

      const { url, cover, creator, message: apiMessage } = response.data;

      // Format the response with download links
      let reply = `🎥 **Facebook Video Download**\n\n`;
      reply += `👤 Creator: ${creator || 'Unknown'}\n`;
      reply += `📜 Message: ${apiMessage || 'No message provided'}\n\n`;
      reply += `**Download Links:**\n`;

      url.forEach((video: { quality: string; downloadUrl: string }, index: number) => {
        reply += `${index + 1}. [${video.quality}](${video.downloadUrl})\n`;
      });

      // Send the video thumbnail as a preview with the links
      await bot.sendPhoto(message.chat.id, cover, {
        caption: reply,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error("Error fetching Facebook video:", error.message || error);
      bot.sendMessage(
        message.chat.id,
        "❌ Unable to process your request. Please ensure the URL is valid or try again later."
      );
    }
  },
};
