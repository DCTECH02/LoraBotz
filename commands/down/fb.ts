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
      reply += `ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅ ᴄʏʀɪʟ ᴛᴇᴄʜ\n`;
      reply += `📜 *Message:* ${apiMessage || 'No message provided'}\n\n`;
      reply += `**Download Links:**\n`;

      // Send inline buttons for download options
      const buttons = url.map((video: { quality: string; downloadUrl: string }) => ({
        text: video.quality,
        callback_data: video.downloadUrl, // Set the download URL as callback data
      }));

      // Send the video thumbnail with download options
      await bot.sendPhoto(msg.chat.id, cover, {
        caption: reply,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [buttons], // Inline buttons with download options
        },
      });
    } catch (error) {
      // Handle errors and notify the user
      console.error("Error fetching Facebook video:", (error as any).message || error);
      bot.sendMessage(
        msg.chat.id,
        "❌ Unable to process your request. Please ensure the URL is valid or try again later."
      );
    }
  },

  // Handle callback query for download links
  handleCallback: async (pattern: string, callback: (query: TelegramBot.CallbackQuery) => Promise<void>) => {
    // Handle the callback when a user selects a download option (HD, SD, etc.)
    if (pattern) {
      // If the callback contains a download URL, download and send the video file
      try {
        const downloadUrl = pattern;
        const videoStream = await axios.get(downloadUrl, { responseType: 'stream' });

        // Send the video to the user
        callback({
          data: downloadUrl, // Placeholder for callback data
          message: {
            chat: { id: callback.query.message.chat.id },
            video: videoStream.data, // Send the video as a stream
          },
        });
      } catch (error) {
        console.error("Error downloading the video:", error);
        callback({
          data: "Error",
          message: { chat: { id: callback.query.message.chat.id } },
        });
      }
    }
  },
};
