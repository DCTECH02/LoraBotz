import TelegramBot from 'node-telegram-bot-api';
import { CommandHandler } from './handlers/CommandHandlers';
import config from './config';
import dotenv from 'dotenv';


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
