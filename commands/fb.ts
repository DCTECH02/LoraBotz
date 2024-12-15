import { CommandHelpers } from '../../types/Command'; // Adjust path if necessary
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

export = {
  command: ["fb", "facebook"], // Command triggers
  categories: ["downloader"], // Category of the command
  description: "Download Facebook videos by providing a URL.",
  noPrefix: false, // Requires a prefix (e.g., "/fb")
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false
  },
  example: ["%cmd https://facebook.com/video-url"],
  run: async (
    msg: TelegramBot.Message,
    { bot, text, args, command, callbackQuery, isCallback }: CommandHelpers
  ) => {
    // Extract the Facebook video URL from the message
    const videoUrl = args.join(' ');

    if (!videoUrl) {
      return bot.sendMessage(
        msg.chat.id,
        "❌ Please provide a valid Facebook video URL.\nExample: `/fb https://facebook.com/video-url`"
      );
    }

    try {
      // Inform the user that the bot is processing the request
      await bot.sendMessage(msg.chat.id, "🔍 Fetching the Facebook video...");

      // Call the external API to fetch download links
      const apiUrl = `https://api.paxsenix.biz.id/dl/fb?url=${encodeURIComponent(videoUrl)}`;
      const response = await axios.get(apiUrl);

      // Validate the API response
      if (!response.data.ok || !response.data.url || response.data.url.length === 0) {
        throw new Error("Failed to retrieve download links.");
      }

      const { url, cover, creator, message: apiMessage } = response.data;

      // Format the response message
      let reply = `🎥 *Facebook Video Downloader*\n\n`;
      reply += `👤 *Creator:* ${creator || 'Unknown'}\n`;
      reply += `📜 *Message:* ${apiMessage || 'No message provided'}\n\n`;
      reply += `**Download Links:**\n`;

      url.forEach((video: { quality: string; downloadUrl: string }, index: number) => {
        reply += `${index + 1}. [${video.quality}](${video.downloadUrl})\n`;
      });

      // Send the video thumbnail with download links
      await bot.sendPhoto(msg.chat.id, cover, {
        caption: reply,
        parse_mode: "Markdown"
      });
    } catch (error) {
      // Handle errors and notify the user
      console.error("Error fetching Facebook video:", (error as any).message || error);
      bot.sendMessage(
        msg.chat.id,
        "❌ Unable to process your request. Please ensure the URL is valid or try again later."
      );
    }
  }
};
