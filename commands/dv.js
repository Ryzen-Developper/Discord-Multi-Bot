const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dv')
        .setDescription('Envia uma mensagem em DM para um ou mais membros')
        .addMentionableOption(option =>
            option.setName('alvo')
                .setDescription('@user ou @everyone')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('Texto a ser enviado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('horarios')
                .setDescription('Agendar (ex: "12:00,18:30") - opcional')
                .setRequired(false)),

    async execute(interaction, client, config) {
        const alvo = interaction.options.getMentionable('alvo');
        const mensagem = interaction.options.getString('mensagem');
        const horariosInput = interaction.options.getString('horarios');

        // Se for agendamento, delega para o scheduler
        if (horariosInput) {
            const { addSchedule } = require('../utils/scheduler');
            const times = horariosInput.split(',').map(t => t.trim());
            for (const time of times) {
                if (!/^\d{1,2}:\d{2}$/.test(time)) {
                    return interaction.reply({ content: `❌ Formato de hora inválido: "${time}". Use HH:MM.`, flags: 64 });
                }
                addSchedule(interaction.guildId, mensagem, time);
            }
            return interaction.reply({ content: `✅ Agendamento(s) criado(s) para ${times.join(', ')}.`, flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        let targets = [];
        if (alvo.id === interaction.guild.id) {
            // @everyone
            const members = await interaction.guild.members.fetch();
            targets = members.filter(m => !m.user.bot).map(m => m);
        } else {
            const member = await interaction.guild.members.fetch(alvo.id).catch(() => null);
            if (!member) return interaction.editReply('❌ Usuário não encontrado.');
            targets = [member];
        }

        let sucessos = 0;
        let falhas = 0;

        for (const member of targets) {
            try {
                await member.send(mensagem);
                sucessos++;
                await new Promise(r => setTimeout(r, 300)); // evitar rate limit
            } catch {
                falhas++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('📨 Resultado da Divulgação')
            .setColor(sucessos > 0 ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: '✅ Enviadas com sucesso', value: `${sucessos}`, inline: true },
                { name: '❌ Falhas (DMs fechadas)', value: `${falhas}`, inline: true }
            )
            .setFooter({ text: `Mensagem: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}` });

        await interaction.editReply({ embeds: [embed] });
    }
};