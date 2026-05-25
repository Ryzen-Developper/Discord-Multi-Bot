// up.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName, getCurrentRank } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('up')
        .setDescription('Promove o membro em X ranks')
        .addUserOption(option => option.setName('user').setDescription('Usuário do Discord').setRequired(true))
        .addIntegerOption(option => option.setName('quantidade').setDescription('Número de ranks para subir').setRequired(true).setMinValue(1)),

    async execute(interaction, client, config) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const qtd = interaction.options.getInteger('quantidade');
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usuário não encontrado.');

        const robloxName = extractRobloxName(member.nickname || member.user.username);
        if (!robloxName) return interaction.editReply('❌ Nickname inválido.');

        const userId = await getUserIdFromName(robloxName);
        if (!userId) return interaction.editReply(`❌ Roblox "${robloxName}" não encontrado.`);

        const currentRank = await getCurrentRank(config.groupId, userId);
        if (currentRank === null) return interaction.editReply('❌ Usuário não está no grupo.');

        const roles = await noblox.getRoles(config.groupId);
        const maxRank = Math.max(...roles.map(r => r.rank));
        const newRankValue = Math.min(currentRank + qtd, maxRank);
        const newRole = roles.find(r => r.rank === newRankValue);
        if (!newRole) return interaction.editReply('❌ Rank alvo não encontrado.');

        try {
            await noblox.setRank(config.groupId, userId, newRole.id);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('⬆️ Promoção')
                .setDescription(`${member} subiu ${newRankValue - currentRank} rank(s).`)
                .addFields({ name: 'Nova Patente', value: newRole.name });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Erro ao promover.');
        }
    }
};