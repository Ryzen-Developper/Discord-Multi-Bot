const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lista todos os comandos disponíveis'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Comandos do KING - BOT do EB')
            .setColor(0x0099FF)
            .setDescription('Aqui estão todos os comandos disponíveis:')
            .addFields(
                { name: '/addpat <@user> <pat>', value: 'Promove o usuário para a patente especificada (baseado no nickname)' },
                { name: '/removepat <@user>', value: 'Rebaixa o usuário para RECRUTA (rank 1)' },
                { name: '/patlist', value: 'Lista todas as patentes do grupo' },
                { name: '/up <@user> <quantidade>', value: 'Promove o usuário em X ranks' },
                { name: '/down <@user> <quantidade>', value: 'Rebaixa o usuário em X ranks' },
                { name: '/remove <@user>', value: 'Expulsa o usuário do grupo' },
                { name: '/info', value: 'Mostra informações do bot' },
                { name: '/fk <@user>', value: 'Envia 100 mensagens engraçadas no PV do usuário' },
                { name: '/dv <@user|@everyone> <mensagem> [horários]', value: 'Envia mensagem no PV de membros (agora ou agendada)' },
                { name: '--- Utilitários ---', value: '\u200b' },
                { name: '/ping', value: 'Latência do bot' },
                { name: '/userinfo [@user]', value: 'Informações de um usuário' },
                { name: '/kick <@user> [motivo]', value: 'Expulsa do servidor' },
                { name: '/ban <@user> [motivo]', value: 'Bane do servidor' },
                { name: '/clear <quantidade>', value: 'Limpa mensagens do canal' },
                { name: '/say <mensagem>', value: 'Faz o bot repetir uma mensagem' }
            )
            .setFooter({ text: 'Desenvolvido por kauax2 KING' });

        await interaction.reply({ embeds: [embed] });
    }
};