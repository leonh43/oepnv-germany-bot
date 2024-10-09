// Load environment variables from .env file
require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Message } = require('discord.js');
const fs = require('fs');

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Set static variables
const GUILD_ID = '1222127021686001685';
const CLIENT_ID = '1220692094595760260';
const BOT_TOKEN = process.env.BOT_TOKEN;  // Load the bot token from environment variables

// Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('selfroles')
        .setDescription('Sende die Selfroles Nachricht in diesen Channel')
]
    .map(command => command.toJSON());

// Set up REST API for slash commands
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

// Register or update commands
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const existingCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));

        for (const command of existingCommands) {
            if (command.name === 'poll') {
                await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
                console.log(`Deleted old command: ${command.name}`);
            }
        }

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands for the guild.');
    } catch (error) {
        console.error(error);
    }
})();

// Bot is ready
client.on('ready', () => {
    console.log('Bot is online!');
});

// Login to Discord
client.login(BOT_TOKEN);

// Create a selfroles embed for the selfroles command
const selfrolesEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('**Selfroles**')
    .setDescription('Assign yourself roles');

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'selfroles') {
            // Acknowledge the command
            await interaction.reply({ content: 'Nachricht wird gesendet', ephemeral: true });

            // Create select menu for role selection
            const select = new StringSelectMenuBuilder()
                .setCustomId('starter')
                .setPlaceholder('Make a selection!')
                .setMaxValues(3)
                .setMinValues(0)
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bulbasaur')
                        .setDescription('The dual-type Grass/Poison Seed Pokémon.')
                        .setValue('bulbasaur'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Charmander')
                        .setDescription('The Fire-type Lizard Pokémon.')
                        .setValue('charmander'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Squirtle')
                        .setDescription('The Water-type Tiny Turtle Pokémon.')
                        .setValue('squirtle'),
                );

            // Add select menu to a row
            const row = new ActionRowBuilder().addComponents(select);

            // Send the poll embed with the select menu
            await interaction.channel.send({ embeds: [selfrolesEmbed], components: [row] });
        }
    } else if (interaction.isStringSelectMenu()) {
        // Check if the custom ID matches 'starter'
        if (interaction.customId === 'starter') {
            const selectedValues = interaction.values; // Get the selected values as an array
            const member = interaction.guild.members.cache.get(interaction.user.id);
            const roleChanges = []; // Array to hold messages about role changes

            // Iterate over selected values and handle role assignment
            for (const value of selectedValues) {
                if (value === 'bulbasaur') {
                    if (member.roles.cache.has('1222127021686001690')) {
                        // If member has the role, remove it
                        await member.roles.remove('1222127021686001690');
                        roleChanges.push(`You no longer have: ${value}`);
                    } else {
                        // If member does not have the role, add it
                        await member.roles.add('1222127021686001690');
                        roleChanges.push(`You now have: ${value}`);
                    }
                } else if (value === 'charmander') {
                    if (member.roles.cache.has('1222127021686001687')) {
                        // If member has the role, remove it
                        await member.roles.remove('1222127021686001687');
                        roleChanges.push(`You no longer have: ${value}`);
                    } else {
                        // If member does not have the role, add it
                        await member.roles.add('1222127021686001687');
                        roleChanges.push(`You now have: ${value}`);
                    }
                } else if (value === 'squirtle') {
                    if (member.roles.cache.has('1222127021686001694')) {
                        // If member has the role, remove it
                        await member.roles.remove('1222127021686001694');
                        roleChanges.push(`You no longer have: ${value}`);
                    } else {
                        // If member does not have the role, add it
                        await member.roles.add('1222127021686001694');
                        roleChanges.push(`You now have: ${value}`);
                    }
                }
            }

            // Send a single response summarizing all role changes
            await interaction.reply({
                content: roleChanges.length > 0 ? roleChanges.join('\n') : 'You made no changes to your roles.',
                ephemeral: true // Only the user who made the selection can see this message
            });
        }
    }
});
