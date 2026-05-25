const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Mostra informações de um usuário')
        .addUserOption(opt => opt.setName('user').setDescription('Usuário (opcional)')),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const embed = new EmbedBuilder()
            .setColor(member?.displayColor || 0x0099FF)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Usuário', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Entrou no servidor', value: member?.joinedAt?.toLocaleDateString('pt-BR') || 'N/A', inline: true },
                { name: 'Cargos', value: member?.roles.cache.map(r => r.toString()).join(', ') || 'Nenhum' }
            );
        await interaction.reply({ embeds: [embed] });
    }
};