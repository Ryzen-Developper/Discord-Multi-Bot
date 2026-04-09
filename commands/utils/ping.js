const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Latência do bot'),
    async execute(interaction) {
        await interaction.reply(`🏓 Pong! Latência: ${interaction.client.ws.ping}ms`);
    }
};