import { CommandsHelpers } from '../../types/Command'; // Adjust path if necessary
import TelegramBot from 'node-telegram-bot-api'; // This is Mandatory
import axios from 'axios';
import yts from 'yt-search'; // YouTube search library

export = {
  command: ['play', 'song'], // Command triggers
  categories: ['music'], // You can adjust the category as needed
  description: 'Search and download songs from YouTube.',
  noPrefix: false, // Requires a prefix (e.g., "/play")
  config: {
    requireOwner: false,
    requireModerator: false,
    requireAdmin: false,
  },
  example: ["%cmd Faded by Alan Walker"],

  run: async (msg: TelegramBot.Message, { bot, text, args, command, callbackQuery, isCallback }: CommandsHelpers) => {
    // Extract the song name from the message
    const inputText = args.join(' ');
    if (!inputText) {
      return bot.sendMessage(
        msg.chat.id,
        "❌ Please provide the song name.\nExample: `/play Faded by Alan Walker`"
      );
    }

    try {
      // React with a "searching" emoji
      await bot.sendMessage(msg.chat.id, "🔍 Searching for your song...");

      // Search for the song on YouTube
      const search = await yts(inputText);
      const video = search.all[0]; // Take the first result

      if (!video) {
        return bot.sendMessage(
          msg.chat.id,
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
      await bot.sendPhoto(msg.chat.id, thumbnail, {
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

        // Send the audio file
        await bot.sendAudio(msg.chat.id, dl, {
          caption: `🎧 *Here's your song:*\n🎵 *Title:* ${title}`,
          parse_mode: 'Markdown',
        });
      } else {
        bot.sendMessage(
          msg.chat.id,
          "❌ Unable to download the song. Please try again later."
        );
      }
    } catch (error) {
      // Handle errors and notify the user
      console.error('Error during play command:', (error as any).message || error);
      bot.sendMessage(
        msg.chat.id,
        "❌ An error occurred while processing your request. Please try again later."
      );
    }
  },
};
