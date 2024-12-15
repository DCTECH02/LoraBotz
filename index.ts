import TelegramBot from 'node-telegram-bot-api';
import { CommandHandler } from './handlers/CommandHandlers';
import config from './config';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

dotenv.config();

const bot = new TelegramBot(`${process.env.TOKEN_BOT}`, { polling: true });
const commandHandler = new CommandHandler(bot, config);

declare global {
   var handler: CommandHandler;
}
global.handler = commandHandler;

async function startBot() {
  try {
    await commandHandler.loadCommands();
    console.log("Bot started successfully!");

    // Handle graceful shutdown
    process.once('SIGINT', () => {
      bot.stopPolling();
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      bot.stopPolling();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error starting bot:", error);
  }
}

// Start the bot
startBot();

// Set up the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve gifted.html as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});