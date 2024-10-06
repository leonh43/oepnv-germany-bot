const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', (message) => {
    if (message.content === '!ping') {
        message.channel.send('Pong!');
    }
});

client.login("MTI5MjIyMzgwODM2Mjc3ODcwNQ.GbwL-e.Ucyr2_iKeHPw_HUiLbGIpjmrfmJF9RGRD2rlqw");
