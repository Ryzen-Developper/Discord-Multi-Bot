const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um membro do servidor')
        .addUserOption(option => option.setName('user').setDescription('Usuário a ser expulso').setRequired(true))
        .addStringOption(option => option.setName('motivo').setDescription('Motivo da expulsão').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('motivo') || 'Sem motivo especificado.';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: '❌ Não tenho permissão para expulsar este usuário.', ephemeral: true });

        await member.kick(reason);
        await interaction.reply({ content: `✅ ${user.tag} foi expulso.\n📄 Motivo: ${reason}` });
    }
};