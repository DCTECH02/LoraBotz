import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import { CommandHandler } from './handlers/CommandHandlers';
import config from './config';
import dotenv from 'dotenv';
import express from 'express';

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

// Add HTTP server for Render deployment health check
const app = express();
const PORT = process.env.PORT || 3000;

// Basic HTML response for health check
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bot Status</title>
      </head>
      <body style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
        <h1 style="color: green;">✅ Connected to Telegram</h1>
        <p>Your bot is up and running!</p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});