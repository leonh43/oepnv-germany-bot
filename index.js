const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const GUILD_ID = '1104669016565489675'; // Server ID
const CLIENT_ID = '1292565513771286589'; // Bot ID
const BOT_TOKEN = 'MTI5MjU2NTUxMzc3MTI4NjU4OQ.GYhU6X.znTxmiWAQc6C0c2FbCGiZKReZQtRWQHZXZIX9A'; // Bot Token
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
        .toJSON(),
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Starte ein Giveaway')
        .addStringOption(option =>
            option.setName('preis')
                .setDescription('Der Preis des Giveaways')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('dauer')
                .setDescription('Dauer des Giveaways in Minuten')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('anzahl')
                .setDescription('Anzahl der Gewinner')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Lösche eine bestimmte Anzahl von Nachrichten')
        .addIntegerOption(option =>
            option.setName('anzahl')
                .setDescription('Die Anzahl der zu löschenden Nachrichten')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Antwortet mit Pong!')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands for the guild.');
    } catch (error) {
        console.error('Error registering commands:', error);
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

    if (interaction.commandName === 'giveaway') {
        const preis = interaction.options.getString('preis');
        const dauer = interaction.options.getInteger('dauer');
        const anzahl = interaction.options.getInteger('anzahl');

        await interaction.reply({ content: 'Das Giveaway wurde gestartet!', ephemeral: true });

        const endTimestamp = new Date(Date.now() + dauer * 60 * 1000).getTime();
        const giveawayEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎉 Giveaway 🎉')
            .setDescription(`Preis: **${preis}**`)
            .addFields(
                { name: 'Erstellt von', value: interaction.user.username, inline: false },
                { name: 'Endet um', value: `<t:${Math.floor(endTimestamp / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: `Gewinner: ${anzahl}` })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('giveaway_entry')
            .setLabel('Teilnehmen 🎉')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);
        const giveawayMessage = await interaction.channel.send({ embeds: [giveawayEmbed], components: [row] });

        const giveawayParticipants = new Set();
        const collector = giveawayMessage.createMessageComponentCollector({ time: dauer * 60 * 1000 });

        collector.on('collect', async i => {
            if (i.customId === 'giveaway_entry') {
                if (!giveawayParticipants.has(i.user.id)) {
                    giveawayParticipants.add(i.user.id);
                    await i.reply({ content: 'Du hast am Giveaway teilgenommen! 🎉', ephemeral: true });
                } else {
                    await i.reply({ content: 'Du hast bereits am Giveaway teilgenommen!', ephemeral: true });
                }
            }
        });

        collector.on('end', async () => {
            const participantsArray = Array.from(giveawayParticipants);
            const winners = [];

            for (let i = 0; i < Math.min(anzahl, participantsArray.length); i++) {
                const winner = participantsArray[Math.floor(Math.random() * participantsArray.length)];
                winners.push(winner);
                participantsArray.splice(participantsArray.indexOf(winner), 1);
            }

            const winnerMentions = winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'Keine Teilnehmer';
            await interaction.channel.send(`🎉 Giveaway beendet! Gewinner: ${winnerMentions}`);
        });
    }

    if (interaction.commandName === 'clear') {
        const anzahl = interaction.options.getInteger('anzahl');

        const fetched = await interaction.channel.messages.fetch({ limit: anzahl });
        await interaction.channel.bulkDelete(fetched);
        await interaction.reply({ content: `${anzahl} Nachrichten wurden gelöscht.`, ephemeral: true });
    }

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

client.on('messageCreate', async message => {
    if (message.channel.id === COUNTING_CHANNEL_ID) {
        if (!countingAllowed || isNaN(message.content)) return;

        const number = parseInt(message.content, 10);
        if (number === currentCount + 1 && !recentCounters.has(message.author.id)) {
            currentCount = number;
            recentCounters.add(message.author.id);
            setTimeout(() => recentCounters.delete(message.author.id), 5000);
            saveCount();
        } else {
            await message.delete();
        }
    } else if (message.content === '!ping') {
        await message.reply('Pong!');
    }
});

console.log(commands)
client.login(BOT_TOKEN);
