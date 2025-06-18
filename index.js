const { Client, GatewayIntentBits, Collection, ActivityType, PermissionFlagsBits } = require('discord.js');
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
client.slashCommands = new Collection();

/**
 * Load traditional commands from commands directory
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

/**
 * Load slash commands from slash-commands directory
 */
function loadSlashCommands() {
    const slashCommandsPath = path.join(__dirname, 'slash-commands');

    if (!fs.existsSync(slashCommandsPath)) {
        console.warn('⚠️ Slash commands directory not found, creating it...');
        fs.mkdirSync(slashCommandsPath, { recursive: true });
        return;
    }

    const commandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
        console.warn('⚠️ No slash command files found');
        return;
    }

    for (const file of commandFiles) {
        try {
            const filePath = path.join(slashCommandsPath, file);

            // Clear require cache for hot reloading in development
            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            if (!command.data || !command.execute) {
                console.warn(`⚠️ Slash command ${file} is missing required properties (data or execute)`);
                continue;
            }

            client.slashCommands.set(command.data.name, command);
            console.log(`✅ Loaded slash command: ${command.data.name}`);
        } catch (error) {
            console.error(`❌ Error loading slash command ${file}:`, error.message);
        }
    }
}

// Load both command types
loadCommands();
loadSlashCommands();

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} telah online!`);
    console.log(`📊 Loaded ${client.commands.size} traditional commands`);
    console.log(`⚡ Loaded ${client.slashCommands.size} slash commands`);
    console.log(`🏠 Connected to ${client.guilds.cache.size} servers`);
    console.log(`👥 Serving ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`);

    // Set bot activity with proper type
    client.user.setActivity('Discord Castilla | /help', { type: ActivityType.Watching });
});

// Handle slash command interactions with rate limiting
const commandCooldowns = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Enhanced permission checking before command execution
    if (interaction.guild) {
        const botMember = interaction.guild.members.me;
        const channelPerms = interaction.channel.permissionsFor(botMember);

        if (!channelPerms || !channelPerms.has(PermissionFlagsBits.SendMessages)) {
            try {
                await interaction.reply({
                    content: '❌ Bot tidak memiliki permission untuk mengirim pesan di channel ini!',
                    ephemeral: true
                });
            } catch (error) {
                console.error('Cannot send permission error message:', error);
            }
            return;
        }
    }

    // Simple rate limiting per user per command
    const cooldownKey = `${interaction.user.id}-${interaction.commandName}`;
    const now = Date.now();
    const cooldownAmount = (command.cooldown || 3) * 1000; // Default 3 seconds

    if (commandCooldowns.has(cooldownKey)) {
        const expirationTime = commandCooldowns.get(cooldownKey) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
                content: `⏰ Tunggu ${timeLeft.toFixed(1)} detik sebelum menggunakan command ini lagi.`,
                ephemeral: true
            });
        }
    }

    commandCooldowns.set(cooldownKey, now);
    setTimeout(() => commandCooldowns.delete(cooldownKey), cooldownAmount);

    try {
        console.log(`⚡ Executing slash command: ${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'} (#${interaction.channel?.name || 'DM'})`);
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing slash command ${interaction.commandName}:`, error);

        // Enhanced error message based on error type
        let errorMessage = 'Terjadi error saat menjalankan command!';

        switch (error.code) {
            case 50001:
                errorMessage = 'Bot tidak memiliki akses yang diperlukan!';
                break;
            case 50013:
                errorMessage = 'Bot tidak memiliki permission yang diperlukan!';
                break;
            case 10062:
                errorMessage = 'Interaction telah expired!';
                break;
            case 10008:
                errorMessage = 'Channel tidak dapat diakses!';
                break;
        }

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Cannot send error message:', replyError);
        }
    }
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

// Add process monitoring
process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Memory usage monitoring (optional)
setInterval(() => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        console.warn(`⚠️ High memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    }
}, 300000); // Check every 5 minutes
