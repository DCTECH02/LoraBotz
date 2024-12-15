import { Message } from 'node-telegram-bot-api';
import { CommandHelpers } from '../../types/Command';
import axios from 'axios';

module.exports = {
  command: ['fb', 'facebook'],
  noPrefix: false,
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false,
  },
  description: "Download Facebook videos by providing a URL.",
  example: ["%cmd https://facebook.com/video-url"],
  run: async (message: Message, helpers: CommandHelpers) => {
    const { bot } = helpers;

    const inputText = message.text?.split(' ').slice(1).join(' ');
    if (!inputText || !inputText.startsWith('http') || !inputText.includes('facebook.com')) {
      return bot.sendMessage(
        message.chat.id,
        "❌ Please provide a valid Facebook video URL.\nExample: `/fb https://facebook.com/video-url`"
      );
    }

    try {
      const apiUrl = `https://api.paxsenix.biz.id/dl/fb?url=${encodeURIComponent(inputText)}`;
      const response = await axios.get(apiUrl);

      if (!response.data.ok || !Array.isArray(response.data.url) || response.data.url.length === 0) {
        throw new Error("Failed to retrieve download links.");
      }

      const { url = [], cover, creator = 'Unknown', message: apiMessage = 'No message provided' } = response.data;

      let reply = `🎥 **Facebook Video Download**\n\n`;
      reply += `👤 Creator: ${creator}\n`;
      reply += `📜 Message: ${apiMessage}\n\n`;
      reply += `**Download Links:**\n`;

      if (url.length > 0) {
        url.forEach((video: { quality: string; downloadUrl: string }, index: number) => {
          reply += `${index + 1}. [${video.quality}](${video.downloadUrl})\n`;
        });
      } else {
        reply += "No download links available.";
      }

      if (cover) {
        await bot.sendPhoto(message.chat.id, cover, {
          caption: reply,
          parse_mode: 'Markdown',
        });
      } else {
        await bot.sendMessage(message.chat.id, reply, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error("Error fetching Facebook video:", error instanceof Error ? error.message : error);
      bot.sendMessage(
        message.chat.id,
        "❌ Unable to process your request. Please ensure the URL is valid or try again later."
      );
    }
  },
};