const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const GUILD_ID = '1104669016565489675';
const CLIENT_ID = '1292565513771286589';
const BOT_TOKEN = 'MTI5MjU2NTUxMzc3MTI4NjU4OQ.GYhU6X.znTxmiWAQc6C0c2FbCGiZKReZQtRWQHZXZIX9A';
const POLL_ROLE_ID = '1292712164599267349';
const WELCOME_CHANNEL_ID = '1292874725370101822';
const COUNTING_CHANNEL_ID = '1292892233326006323';

let currentCount = 0;
let countingAllowed = true;
const recentCounters = new Set();

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

const loadCount = () => {
    if (fs.existsSync('currentCount.json')) {
        const data = fs.readFileSync('currentCount.json', 'utf-8');
        const parsedData = JSON.parse(data);
        currentCount = parsedData.currentCount || 0;
    }
};

const saveCount = () => {
    fs.writeFileSync('currentCount.json', JSON.stringify({ currentCount }));
};

client.once('ready', () => {
    console.log('Bot is online!');
    loadCount();
});

client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!welcomeChannel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('👋 Willkommen!')
        .setDescription(`Willkommen auf dem ÖPNV Germany Discord-Server, <@${member.id}>! 🎉`)
        .setFooter({ text: 'Hast du Fragen? Frag einfach einen Moderator!' })
        .setTimestamp();

    const welcomeMessage = await welcomeChannel.send({ embeds: [welcomeEmbed] });

    await welcomeMessage.react('👋');
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

        await interaction.reply({ content: 'Deine Umfrage wurde erstellt!', ephemeral: true });

        await interaction.channel.send(`<@&${POLL_ROLE_ID}>`);

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

        const pollMessage = await interaction.channel.send({ embeds: [pollEmbed] });

        await pollMessage.react('1️⃣');
        await pollMessage.react('2️⃣');
        if (option3) await pollMessage.react('3️⃣');
        if (option4) await pollMessage.react('4️⃣');
        if (option5) await pollMessage.react('5️⃣');
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== COUNTING_CHANNEL_ID) return;

    const number = parseInt(message.content);

    if (isNaN(number)) {
        await message.reply('Bitte gib eine gültige Zahl ein.');
        return;
    }

    if (number === currentCount + 1) {
        if (!recentCounters.has(message.author.id)) {
            currentCount = number;
            saveCount();
            await message.react('✅');
            recentCounters.add(message.author.id);
            countingAllowed = false;

            setTimeout(() => {
                countingAllowed = true;
                recentCounters.clear();
            }, 5000);
        } else {
            await message.reply('Du hast bereits gezählt! Warte bitte, bis jemand anders gezählt hat.');
        }
    } else {
        await message.react('❌');
        await message.channel.send(`Falsche Zahl! Du hast mit ${number} gezählt. Bitte zähle mit ${currentCount + 1} weiter.`);

        recentCounters.add(message.author.id);

        const currentUserId = message.author.id;

        const filter = (msg) => !msg.author.bot && msg.channel.id === COUNTING_CHANNEL_ID && msg.author.id !== currentUserId;

        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (msg) => {
            const nextNumber = parseInt(msg.content);
            if (nextNumber === currentCount + 1) {
                recentCounters.delete(currentUserId);
                await msg.react('✅');
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (recentCounters.has(currentUserId)) {
                message.reply('Warte bitte, bis jemand anders die nächste Zahl zählt.');
            }
        });
    }
});

client.login(BOT_TOKEN);
