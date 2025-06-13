const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = require('./config.json');
const StickyManager = require('./utils/stickyManager');

/**
 * Discord Bot Client with improved error handling
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

/**
 * Load commands from commands directory
 */
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Commands directory not found, creating it...');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
        console.warn('⚠️ No command files found in commands directory');
        return;
    }

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if (!command.name || !command.execute) {
                console.warn(`⚠️ Command ${file} is missing required properties (name or execute)`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }
}

// Load commands
loadCommands();

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} telah online!`);
    console.log(`📊 Loaded ${client.commands.size} commands`);
    console.log(`🏠 Connected to ${client.guilds.cache.size} servers`);

    // Set bot activity with proper type
    client.user.setActivity('Discord Castilla', { type: ActivityType.Watching });
});

client.on('messageCreate', async message => {
    // Handle sticky messages first (for non-bot, non-command messages)
    if (!message.author.bot && !message.content.startsWith(config.prefix)) {
        try {
            await StickyManager.handleStickyMessage(message);
        } catch (error) {
            console.error('Error in sticky message handler:', error);
        }
    }

    // Ignore bots and messages without prefix
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    // Parse command and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        console.log(`🔧 Executing command: ${commandName} by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error);

        try {
            const errorMessage = error.code === 50013
                ? 'Bot tidak memiliki permission yang diperlukan!'
                : 'Terjadi error saat menjalankan command!';

            await message.reply(`❌ ${errorMessage}`);
        } catch (replyError) {
            console.error('Cannot send error message:', replyError);
        }
    }
});

// Enhanced error handling
client.on('error', error => {
    console.error('❌ Client error:', error);
});

client.on('warn', warning => {
    console.warn('⚠️ Client warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is required in .env file');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
});
