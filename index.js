const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const GUILD_ID = '1104669016565489675'; //Server ID
const CLIENT_ID = '1292565513771286589'; //Bot ID
const BOT_TOKEN = 'MTI5MjU2NTUxMzc3MTI4NjU4OQ.GYhU6X.znTxmiWAQc6C0c2FbCGiZKReZQtRWQHZXZIX9A'; //Bot Token

const commands = [
    new SlashCommandBuilder()
        .setName('createpoll')
        .setDescription('Erstelle eine Umfrage')
        .addStringOption(option =>
            option.setName('frage')
                .setDescription('Die Frage für die Umfrage')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('Erste Option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Zweite Option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Dritte Option (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Vierte Option (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Fünfte Option (optional)')
                .setRequired(false))
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

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

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'createpoll') {
        const frage = interaction.options.getString('frage');
        const option1 = interaction.options.getString('option1');
        const option2 = interaction.options.getString('option2');
        const option3 = interaction.options.getString('option3');
        const option4 = interaction.options.getString('option4');
        const option5 = interaction.options.getString('option5');

        const pollEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`**${frage}**`)
            .addFields(
                { name: 'Option 1️⃣', value: option1, inline: false },
                { name: 'Option 2️⃣', value: option2, inline: false }
            )
            .setFooter({ text: `Erstellt von ${interaction.user.username}` })
            .setTimestamp();

        if (option3) pollEmbed.addFields({ name: 'Option 3️⃣', value: option3, inline: false });
        if (option4) pollEmbed.addFields({ name: 'Option 4️⃣', value: option4, inline: false });
        if (option5) pollEmbed.addFields({ name: 'Option 5️⃣', value: option5, inline: false });

        const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });

        await pollMessage.react('1️⃣');
        await pollMessage.react('2️⃣');
        if (option3) await pollMessage.react('3️⃣');
        if (option4) await pollMessage.react('4️⃣');
        if (option5) await pollMessage.react('5️⃣');
    }
});

client.login(BOT_TOKEN);
