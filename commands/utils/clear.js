const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Apaga mensagens do canal')
        .addIntegerOption(option => option.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('quantidade');
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 ${amount} mensagens apagadas.`, ephemeral: true });
    }
};