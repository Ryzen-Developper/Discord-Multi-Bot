const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fk')
        .setDescription('Envia 100 mensagens engraçadas no PV do usuário')
        .addUserOption(option => option.setName('user').setDescription('Usuário alvo').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        
        interaction.editReply(`Enviando 100 mensagens para ${user.username}...`);
        for (let i = 0; i < 100; i++) {
            try {
                await user.send('KINGZERA NÉ ERRIESSI KKKKKKKKKKKKKKKKKKKK');
                await new Promise(r => setTimeout(r, 200)); // evitar rate limit
            } catch {
                return interaction.editReply('❌ Não foi possível enviar DM (usuário com DMs fechadas).');
            }
        }
        await interaction.editReply(`✅ 100 mensagens enviadas para ${user.username}!`);
    }
};