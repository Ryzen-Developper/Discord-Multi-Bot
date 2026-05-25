const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('patlist')
        .setDescription('Lista todas as patentes do grupo'),

    async execute(interaction, client, config) {
        await interaction.deferReply();
        try {
            const roles = await noblox.getRoles(config.groupId);
            const embed = new EmbedBuilder()
                .setTitle('📋 Patentes do Grupo')
                .setColor(0x0099FF)
                .setDescription(roles.map(r => `**${r.name}** (Rank ${r.rank})`).join('\n') || 'Nenhuma patente encontrada.')
                .setFooter({ text: `Total: ${roles.length} patentes` });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Erro ao buscar patentes.');
        }
    }
};