import TelegramBot from 'node-telegram-bot-api';
import { CommandHandler } from './handlers/CommandHandlers';
import config from './config';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TOKEN_BOT || '', { polling: true });
const commandHandler = new CommandHandler(bot, config);

// Declare a global handler
declare global {
  var handler: CommandHandler;
}
global.handler = commandHandler;

// Bot initialization
async function startBot() {
  try {
    await commandHandler.loadCommands();
    console.log('Bot started successfully!');

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
    console.error('Error starting bot:', error);
  }
}

// Start the bot
startBot();

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve gifted.html
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});