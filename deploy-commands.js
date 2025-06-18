const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validate environment variables
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('❌ Missing required environment variables: DISCORD_TOKEN and CLIENT_ID');
    process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, 'slash-commands');

if (fs.existsSync(foldersPath)) {
    const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(foldersPath, file);
            delete require.cache[require.resolve(filePath)]; // Clear cache
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }
} else {
    console.error('❌ Slash commands directory not found!');
    process.exit(1);
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        console.log('🎉 Deployment completed!');

        // List deployed commands
        data.forEach(command => {
            console.log(`📋 Deployed: /${command.name} - ${command.description}`);
        });

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        if (error.code === 50001) {
            console.error('Bot is missing access to the application. Check bot permissions.');
        }
        process.exit(1);
    }
})();
