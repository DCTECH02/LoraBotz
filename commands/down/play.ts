import { CommandHelpers } from '../../types/Command'; // Adjust path if necessary
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import yts from 'yt-search'; // YouTube search library

export = {
  command: ['play', 'song'], // Command triggers
  noPrefix: false, // Requires prefix (e.g., "/play")
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false,
  },
  description: "Search and download songs from YouTube.",
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
                      `🔗 [Watch on YouTube](${video.url})`;

      // Send the preview message with the thumbnail
      const thumbnail = video.thumbnail || 'https://via.placeholder.com/300x200.png?text=No+Thumbnail';
      await bot.sendPhoto(message.chat.id, thumbnail, {
        caption: preview,
        parse_mode: 'Markdown',
      });

      // Fetch the song using the external API
      const apiResponse = await axios.get('https://api.siputzx.my.id/api/d/ytmp3', {
        params: { url: video.url },
      });

      // Check if the API returned a successful response
      if (apiResponse.data.status) {
        const { title, dl } = apiResponse.data.data; // Extract song title and download link

        // Send the audio file directly
        await bot.sendAudio(message.chat.id, dl, {
          caption: `🎧 *Here's your song:*\n🎵 *Title:* ${title}`,
          parse_mode: 'Markdown',
        });
      } else {
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
