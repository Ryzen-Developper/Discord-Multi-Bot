const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Informações sobre o bot'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 KING - BOT do EB')
            .setColor(0x0099FF)
            .setDescription('Bot oficial do Exército Brasileiro no Roblox e Discord.')
            .addFields(
                { name: '👑 Dono', value: 'kauax2 KING', inline: true },
                { name: '📅 Criado em', value: '30/03/2026', inline: true },
                { name: '⚙️ Versão', value: '2.0.0', inline: true }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL());
        await interaction.reply({ embeds: [embed] });
    }
};