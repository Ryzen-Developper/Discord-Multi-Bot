const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName, getRoleMap } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepat')
        .setDescription('Rebaixa o membro para RECRUTA (rank 1)')
        .addUserOption(option => option.setName('user').setDescription('Usuário do Discord').setRequired(true)),

    async execute(interaction, client, config) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usuário não encontrado no servidor.');

        const nickname = member.nickname || member.user.username;
        const robloxName = extractRobloxName(nickname);
        if (!robloxName) return interaction.editReply('❌ O nickname não está no formato esperado: `[PATENTE] nickroblox`');

        const userId = await getUserIdFromName(robloxName);
        if (!userId) return interaction.editReply(`❌ Usuário Roblox "${robloxName}" não encontrado.`);

        try {
            // Rank 1 = Recruta (presumindo que o rank 1 exista)
            const roles = await noblox.getRoles(config.groupId);
            const recruitRole = roles.find(r => r.rank === 1);
            if (!recruitRole) return interaction.editReply('❌ Rank "RECRUTA" (rank 1) não encontrado no grupo.');

            await noblox.setRank(config.groupId, userId, recruitRole.id);
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⬇️ Patente Removida')
                .setDescription(`${member} foi rebaixado para **RECRUTA**.`)
                .setFooter({ text: `Roblox: ${robloxName}` });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erro ao alterar a patente no Roblox.');
        }
    }
};