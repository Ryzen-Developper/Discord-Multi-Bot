const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Aceita um usuário no grupo do Roblox baseado no apelido do Discord')
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
            await noblox.handleJoinRequest(config.groupId, userId, true);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Usuário aceito no grupo')
                .setDescription(`${member} foi aceito no grupo.`)
                .setFooter({ text: `Roblox: ${robloxName}` });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erro ao aceitar o usuário. Verifique se ele solicitou entrada.');
        }
    }
};