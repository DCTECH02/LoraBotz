import axios from 'axios';
import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';
import yts from 'yt-search'; // Ensure this is included for YouTube search

export = {
  command: ["play", "song"], // Command triggers
  categories: ["downloader"], // Category of the command
  description: "Search and download songs from YouTube.",
  noPrefix: false, // Requires prefix (e.g., "/play")
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false,
  },
  example: ["%cmd Faded by Alan Walker"],
  run: async (message: TelegramBot.Message, helpers: CommandHelpers) => {
    const { bot } = helpers;

    // Extract the song name from the message
    const inputText = message.text?.split(' ').slice(1).join(' ');
    if (!inputText) {
      return bot.sendMessage(
        message.chat.id,
        "❌ Please provide the song name.\nExample: `/play Faded by Alan Walker`"
      );
    }

    try {
      // React with a "searching" emoji
      await bot.sendMessage(message.chat.id, "🔍 Searching for your song...");

      // Search for the song on YouTube
      const search = await yts(inputText);
      const video = search.all[0]; // Take the first result

      if (!video) {
        return bot.sendMessage(
          message.chat.id,
          "❌ Sorry, I couldn't find the song. Try another keyword."
        );
      }

      // Build the preview message
      const preview = `🎶 *Music Player* 🎶\n\n` +
                      `🎵 *Title:* ${video.title}\n` +
                      `👁️ *Views:* ${video.views}\n` +
                      `⏳ *Duration:* ${video.timestamp}\n` +
                      `📅 *Uploaded:* ${video.ago}\n` +
                      `🔗 [Watch on YouTube](${video.url})\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅ ᴄʏʀɪʟ ᴛᴇᴄʜ*`;

      // Send the preview message with the thumbnail, or a placeholder if no thumbnail
      const thumbnail = video.thumbnail || 'https://via.placeholder.com/300x200.png?text=No+Thumbnail';
      await bot.sendPhoto(message.chat.id, thumbnail, {
        caption: preview,
        parse_mode: 'Markdown',
      });

      // Fetch the song using the new external API
      const apiUrl = `https://api.paxsenix.biz.id/yt/ytaudio?url=${encodeURIComponent(video.url)}`;
      const apiResponse = await axios.get(apiUrl);

      // Log the API response to check its structure
      console.log('API Response:', apiResponse.data);

      // Check if the API returned a valid download link
      if (apiResponse.data.ok) {
        const { url, creator, message: apiMessage } = apiResponse.data; // Extract download URL and creator info

        // Log the download link
        console.log('Download link:', url);

        // Send the audio file
        await bot.sendAudio(message.chat.id, url, {
          caption: `🎧 *Here's your song:*\n🎵 *Title:* ${video.title}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅ ᴄʏʀɪʟ ᴛᴇᴄʜ*`,
          parse_mode: 'Markdown',
        });
      } else {
        // If the API didn't return a valid download link, show an error
        console.error('Failed to retrieve download link:', apiResponse.data);
        bot.sendMessage(
          message.chat.id,
          "❌ Unable to download the song. Please try again later."
        );
      }
    } catch (error) {
      // Handle error properly, ensuring it's of type 'Error'
      if (error instanceof Error) {
        console.error('Error during play command:', error.message);
      } else {
        console.error('Unknown error during play command:', error);
      }

      bot.sendMessage(
        message.chat.id,
        "❌ An error occurred while processing your request. Please try again later."
      );
    }
  },
};