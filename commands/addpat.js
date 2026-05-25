const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { extractRobloxName, getUserIdFromName, getRoleMap } = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpat')
        .setDescription('Adiciona uma patente a um membro (baseado no nickname)')
        .addUserOption(option => option.setName('user').setDescription('Usuário do Discord').setRequired(true))
        .addStringOption(option => option.setName('patente').setDescription('Nome da patente (ex: CABO)').setRequired(true).setAutocomplete(true)),

    async autocomplete(interaction, config) {
        const focused = interaction.options.getFocused();
        const roleMap = await getRoleMap(config.groupId);
        const choices = Object.keys(roleMap).filter(name => name.includes(focused.toLowerCase())).slice(0, 25);
        await interaction.respond(choices.map(name => ({ name, value: name })));
    },

    async execute(interaction, client, config) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const patenteNome = interaction.options.getString('patente');
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usuário não encontrado no servidor.');

        const nickname = member.nickname || member.user.username;
        const robloxName = extractRobloxName(nickname);
        if (!robloxName) return interaction.editReply('❌ O nickname não está no formato esperado: `[PATENTE] nickroblox`');

        const userId = await getUserIdFromName(robloxName);
        if (!userId) return interaction.editReply(`❌ Usuário Roblox "${robloxName}" não encontrado.`);

        const roleMap = await getRoleMap(config.groupId);
        const targetRole = roleMap[patenteNome.toLowerCase()];
        if (!targetRole) return interaction.editReply(`❌ Patente "${patenteNome}" não encontrada.`);

        try {
            await noblox.setRank(config.groupId, userId, targetRole.id);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Patente Adicionada')
                .setDescription(`${member} foi promovido para **${patenteNome}** no grupo.`)
                .setFooter({ text: `Roblox: ${robloxName}` });
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erro ao alterar a patente no Roblox.');
        }
    }
};