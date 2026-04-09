const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Faz o bot repetir uma mensagem')
        .addStringOption(option => option.setName('mensagem').setDescription('Texto a ser enviado').setRequired(true)),

    async execute(interaction) {
        const message = interaction.options.getString('mensagem');
        await interaction.channel.send(message);
        await interaction.reply({ content: '✅ Mensagem enviada.', ephemeral: true });
    }
};