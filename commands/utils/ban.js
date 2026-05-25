const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um membro do servidor')
        .addUserOption(option => option.setName('user').setDescription('Usuário a ser banido').setRequired(true))
        .addStringOption(option => option.setName('motivo').setDescription('Motivo do banimento').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('motivo') || 'Sem motivo especificado.';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
        if (!member.bannable) return interaction.reply({ content: '❌ Não tenho permissão para banir este usuário.', ephemeral: true });

        await member.ban({ reason });
        await interaction.reply({ content: `✅ ${user.tag} foi banido.\n📄 Motivo: ${reason}` });
    }
};