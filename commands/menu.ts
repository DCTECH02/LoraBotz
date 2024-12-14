import TelegramBot from 'node-telegram-bot-api';
import { CommandHelpers, CommandType } from '../types/Command';

export = {
  command: ["menu", "help", "start"],
  description: "Displays a list of available commands",
  categories: ["main"],
  run: async (msg: TelegramBot.Message, { bot, command }: CommandHelpers) => {
    try {
      const commands = Array.from(global.handler.getCommands().entries());

      const categorizedCommands = new Map<string, CommandType[]>();
      
      commands.forEach(([cmdName, cmdData]) => {
        const category = cmdData.categories?.[0] || 'uncategorized';
        if (!categorizedCommands.has(category)) {
          categorizedCommands.set(category, []);
        }
        
        const existingCommands = categorizedCommands.get(category)!;
        if (!existingCommands.some(cmd => cmd.command[0] === cmdData.command[0])) {
          existingCommands.push(cmdData);
        }
      });

      const categoryButtons = Array.from(categorizedCommands.keys()).map(category => ({
        text: category.charAt(0).toUpperCase() + category.slice(1),
        callback_data: `menu_${category}`
      }));
      const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
      for (let i = 0; i < categoryButtons.length; i += 2) {
        keyboard.push(categoryButtons.slice(i, i + 2));
      }
      const menuMessage = `👋 Hi ${msg.from?.first_name}${msg.from?.last_name} !\n\nName: Atomic\nStatus: Active\n\nHere is a list of available command categories.\nPlease select a category to view command details:`;
      
      await bot.sendMessage(msg.chat.id, menuMessage, {
        reply_to_message_id: msg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });

      bot.on('callback_query', async (callbackQuery) => {
        if (!callbackQuery.data?.startsWith('menu_')) return;

        const category = callbackQuery.data.replace('menu_', '');
        const commands = categorizedCommands.get(category) || [];
        
        let commandList = `📑 *Command List ${category.toUpperCase()}*\n\n`;
        
        commands.forEach(cmd => {
          const mainCommand = cmd.command[0];
          const aliases = cmd.command.slice(1).length > 0 
            ? ` (${cmd.command.slice(1).join(', ')})`
            : '';
          const example = cmd.example 
            ? `\nExample: /${cmd.example[0].replace('%cmd', mainCommand)}`
            : '';
            
          commandList += `/${mainCommand}${aliases}\n`;
          commandList += `├ ${cmd.description}${example}\n\n`;
        });
        const backButton = {
          inline_keyboard: [[{
            text: '⬅️ Back to Menu',
            callback_data: 'menu_back'
          }]]
        };

        if (callbackQuery.data === 'menu_back') {
          await bot.editMessageText(menuMessage, {
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id,
            reply_markup: {
              inline_keyboard: keyboard
            }
          });
        } else {
          await bot.editMessageText(commandList, {
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id,
            parse_mode: 'Markdown',
            reply_markup: backButton
          });
        }
        await bot.answerCallbackQuery(callbackQuery.id);
      });

    } catch (error) {
      console.error('Error in menu command:', error);
      bot.sendMessage(msg.chat.id, 'An error occurred while displaying the menu.');
    }
  }
};