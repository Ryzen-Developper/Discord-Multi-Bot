const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Expulsa o membro do grupo do Roblox')
        .addUserOption(option => option.setName('user').setDescription('Usuário do Discord').setRequired(true)),

    async execute(interaction, client, config) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usuário não encontrado.');

        const robloxName = extractRobloxName(member.nickname || member.user.username);
        if (!robloxName) return interaction.editReply('❌ Nickname inválido.');

        const userId = await getUserIdFromName(robloxName);
        if (!userId) return interaction.editReply(`❌ Roblox "${robloxName}" não encontrado.`);

        try {
            await noblox.exile(config.groupId, userId);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Expulso do Grupo')
                .setDescription(`${member} foi removido do grupo.`);
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Erro ao expulsar do grupo.');
        }
    }
};