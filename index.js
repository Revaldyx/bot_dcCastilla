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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,     // ADDED: detect streaming status
        GatewayIntentBits.GuildMembers        // ADDED: manage roles reliably
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

/** ===== NOW STREAMING role utils ===== */
const streamingCfg = config.streamingRole || {};
const liveCfg = config.liveAnnouncements || { enabled: false };
const liveSessions = new Map(); // key: `${guildId}:${userId}` => { messageId, url, startedAt }
const streamingDetectCfg = (config.streamingDetect && config.streamingDetect.customStatusLinks) || { enabled: false, domains: [] };

function isMemberStreaming(presence) {
    // Use unified detector
    return !!getStreamingActivity(presence);
}

function getStreamingActivity(presence) {
    if (!presence) return null;

    const requireUrl = streamingCfg.requireStreamingUrl !== false;

    // 1) Native Discord Streaming activity (Twitch/YouTube/Go Live with URL)
    const native = (presence.activities || []).find(a =>
        a.type === ActivityType.Streaming && (!requireUrl || !!a.url)
    );
    if (native) return native;

    // 2) Fallback: detect live link in Custom Status (e.g., TikTok, Kick, FB Gaming)
    if (streamingDetectCfg.enabled) {
        const custom = (presence.activities || []).find(a =>
            a.type === ActivityType.Custom && typeof a.state === 'string' && a.state.length
        );
        if (custom) {
            const match = custom.state.match(/https?:\/\/\S+/i);
            if (match) {
                try {
                    const url = new URL(match[0]);
                    const host = url.hostname.toLowerCase();
                    const domains = streamingDetectCfg.domains || [];
                    const matches = domains.some(d => host === d || host.endsWith(`.${d}`));
                    if (matches) {
                        // Return a normalized object with url so downstream code can announce it
                        return { url: url.toString(), type: 'CUSTOM_LINK' };
                    }
                } catch {
                    // ignore invalid URLs
                }
            }
        }
    }

    return null;
}

async function getOrCreateStreamingRole(guild) {
    if (!streamingCfg.enabled) return null;

    // Try by ID first
    if (streamingCfg.roleId) {
        const byId = guild.roles.cache.get(streamingCfg.roleId) || await guild.roles.fetch(streamingCfg.roleId).catch(() => null);
        if (byId) return byId;
    }

    // Fallback: by name
    const roleName = streamingCfg.roleName || 'NOW STREAMING';
    let role = guild.roles.cache.find(r => r.name === roleName);
    if (role) return role;

    // Auto-create if allowed
    if (streamingCfg.autoCreateIfMissing) {
        const me = guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            console.warn(`⚠️ Missing ManageRoles in guild ${guild.name}, cannot create streaming role.`);
            return null;
        }
        try {
            role = await guild.roles.create({
                name: roleName,
                color: streamingCfg.roleColor || '#593695',
                mentionable: true,
                reason: 'Auto-created streaming role'
            });
            console.log(`✅ Created role "${roleName}" in guild ${guild.name}`);
            return role;
        } catch (e) {
            console.error(`❌ Failed creating role "${roleName}" in ${guild.name}:`, e.message);
            return null;
        }
    }

    return null;
}
/** ==================================== */

client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} telah online!`);
    console.log(`📊 Loaded ${client.commands.size} traditional commands`);
    console.log(`⚡ Loaded ${client.slashCommands.size} slash commands`);
    console.log(`🏠 Connected to ${client.guilds.cache.size} servers`);
    console.log(`👥 Serving ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`);

    // Set bot activity with proper type
    client.user.setActivity('Discord Castilla | /help', { type: ActivityType.Watching });

    // Ensure NOW STREAMING role exists (optional auto-create)
    if (streamingCfg.enabled && streamingCfg.autoCreateIfMissing) {
        for (const [, guild] of client.guilds.cache) {
            await getOrCreateStreamingRole(guild);
        }
    }
});

// Handle slash command interactions with rate limiting
const commandCooldowns = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Always allow user 403174107904081933 to run any slash command
    if (interaction.user.id === '403174107904081933') {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing slash command ${interaction.commandName}:`, error);
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
        return;
    }

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

// Assign/Remove NOW STREAMING role on presence updates
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
        if (!streamingCfg.enabled && !liveCfg.enabled) return;
        if (!newPresence || !newPresence.guild) return;
        if (newPresence.user?.bot) return;

        const guild = newPresence.guild;
        const me = guild.members.me;
        if (!me) return;

        const member = newPresence.member || await guild.members.fetch(newPresence.userId).catch(() => null);
        if (!member) return;

        // Role management (do not return if missing ManageRoles; just skip role part)
        if (streamingCfg.enabled) {
            if (me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const role = await getOrCreateStreamingRole(guild);
                if (role) {
                    const canManage = me.roles.highest.comparePositionTo(role) > 0;
                    if (!canManage) {
                        console.warn(`⚠️ Cannot manage role "${role.name}" in ${guild.name} due to role hierarchy.`);
                    } else {
                        const activity = getStreamingActivity(newPresence);
                        const streaming = !!activity;
                        const hasRole = member.roles.cache.has(role.id);

                        if (streaming && !hasRole) {
                            await member.roles.add(role, 'Member is streaming').catch(err => {
                                if (err.code === 50013) console.warn('⚠️ Missing permission to add role.');
                                else console.error('❌ Failed to add streaming role:', err);
                            });
                        } else if (!streaming && hasRole && (streamingCfg.removeOnStop !== false)) {
                            await member.roles.remove(role, 'Member stopped streaming').catch(err => {
                                if (err.code === 50013) console.warn('⚠️ Missing permission to remove role.');
                                else console.error('❌ Failed to remove streaming role:', err);
                            });
                        }
                    }
                }
            } else {
                // No ManageRoles: skip role update but continue to announcements
            }
        }

        // Livestream link announcement (works for native streaming and custom-status link)
        if (liveCfg.enabled && liveCfg.channelId) {
            const key = `${guild.id}:${member.id}`;
            const activity = getStreamingActivity(newPresence);
            const isStreamingNow = !!activity && !!activity.url;

            if (isStreamingNow) {
                if (!liveSessions.has(key)) {
                    const channel =
                        guild.channels.cache.get(liveCfg.channelId) ||
                        await guild.channels.fetch(liveCfg.channelId).catch(() => null);

                    if (!channel) return;

                    const perms = channel.permissionsFor(me);
                    if (!perms || !perms.has(PermissionFlagsBits.SendMessages)) return;

                    const msgContent = `🔴 ${member} sedang LIVE sekarang!\nTonton di: ${activity.url}`;
                    const sent = await channel.send({ content: msgContent }).catch(err => {
                        console.error('❌ Failed to send live announcement:', err);
                        return null;
                    });
                    if (sent) {
                        liveSessions.set(key, { messageId: sent.id, url: activity.url, startedAt: Date.now() });
                    }
                }
            } else {
                const prev = liveSessions.get(key);
                if (prev) {
                    if (liveCfg.deleteOnStop) {
                        const channel =
                            guild.channels.cache.get(liveCfg.channelId) ||
                            await guild.channels.fetch(liveCfg.channelId).catch(() => null);
                        if (channel) {
                            await channel.messages.delete(prev.messageId).catch(() => { });
                        }
                    }
                    liveSessions.delete(key);
                }
            }
        }
    } catch (e) {
        console.error('❌ Error in presenceUpdate handler:', e);
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