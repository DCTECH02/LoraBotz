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

      if (!response.data.ok || !response.data.url || response.data.url.length === 0) {
        throw new Error("Failed to retrieve download links.");
      }

      const { url, cover, creator, message: apiMessage } = response.data;

      // Generate inline keyboard buttons for available video qualities
      const options = {
        reply_markup: {
          inline_keyboard: url.map((video: { quality: string; downloadUrl: string }) => [
            {
              text: video.quality, // Button text (e.g., "HD", "SD")
              callback_data: JSON.stringify({
                type: 'download_video',
                downloadUrl: video.downloadUrl,
                quality: video.quality
              }) // Pass download URL and quality as callback data
            }
          ])
        }
      };

      // Send the video thumbnail with inline buttons
      await bot.sendPhoto(msg.chat.id, cover, {
        caption: `🎥 *Facebook Video Downloader*\n\n👤 *Creator:* ${creator || 'Unknown'}\n📜 *Message:* ${apiMessage || 'No message provided'}\n\nChoose a quality below:`,
        parse_mode: "Markdown",
        ...options
      });
    } catch (error) {
      console.error("Error fetching Facebook video:", (error as any).message || error);
      bot.sendMessage(
        msg.chat.id,
        "❌ Unable to process your request. Please ensure the URL is valid or try again later."
      );
    }
  },
  callback: async (
    query: TelegramBot.CallbackQuery,
    { bot }: CommandHelpers
  ) => {
    try {
      const data = JSON.parse(query.data || '{}');

      if (data.type === 'download_video') {
        const { downloadUrl, quality } = data;

        // Notify the user that the video is being fetched
        await bot.answerCallbackQuery(query.id, { text: `Downloading ${quality} video...` });

        // Send the video directly to the user
        await bot.sendVideo(query.message?.chat.id || 0, downloadUrl, {
          caption: `🎥 Here is your video in *${quality}* quality.`,
          parse_mode: "Markdown"
        });
      }
    } catch (error) {
      console.error("Error handling callback query:", (error as any).message || error);
      bot.sendMessage(
        query.message?.chat.id || 0,
        "❌ Unable to download the video. Please try again later."
      );
    }
  }
};
