const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName, getCurrentRank } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('down')
        .setDescription('Rebaixa o membro em X ranks')
        .addUserOption(option => option.setName('user').setDescription('Usuário do Discord').setRequired(true))
        .addIntegerOption(option => option.setName('quantidade').setDescription('Número de ranks para descer').setRequired(true).setMinValue(1)),

    async execute(interaction, client, config) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const qtd = interaction.options.getInteger('quantidade');
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usuário não encontrado no servidor.');

        const nickname = member.nickname || member.user.username;
        const robloxName = extractRobloxName(nickname);
        if (!robloxName) return interaction.editReply('❌ O nickname não está no formato esperado: `[PATENTE] nickroblox`');

        const userId = await getUserIdFromName(robloxName);
        if (!userId) return interaction.editReply(`❌ Usuário Roblox "${robloxName}" não encontrado.`);

        const currentRank = await getCurrentRank(config.groupId, userId);
        if (currentRank === null) return interaction.editReply('❌ Usuário não está no grupo do Roblox.');

        const roles = await noblox.getRoles(config.groupId);
        const minRank = Math.min(...roles.map(r => r.rank));
        const newRankValue = Math.max(currentRank - qtd, minRank);
        const newRole = roles.find(r => r.rank === newRankValue);
        if (!newRole) return interaction.editReply('❌ Rank alvo não encontrado.');

        try {
            await noblox.setRank(config.groupId, userId, newRole.id);
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⬇️ Rebaixamento')
                .setDescription(`${member} desceu ${currentRank - newRankValue} rank(s).`)
                .addFields({ name: 'Nova Patente', value: newRole.name, inline: true });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erro ao rebaixar no Roblox.');
        }
    }
};