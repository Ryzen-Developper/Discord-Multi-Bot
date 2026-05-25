const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require("path");

const scheduler = require(
  path.resolve(process.cwd(), "utils", "scheduler.js")
););

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dv')
        .setDescription('Envia uma mensagem em DM para membros (agora ou agendada)')
        .addMentionableOption(option => option.setName('alvo').setDescription('@user ou @everyone').setRequired(true))
        .addStringOption(option => option.setName('mensagem').setDescription('Texto a ser enviado').setRequired(true))
        .addStringOption(option => option.setName('horarios').setDescription('Horários (ex: "12:00,18:30") - opcional para agendar'))
        .addStringOption(option => option.setName('acao').setDescription('listar ou remover agendamentos').addChoices(
            { name: 'Listar agendamentos', value: 'list' },
            { name: 'Remover agendamento', value: 'remove' }
        )),

    async execute(interaction, client, config) {
        const alvo = interaction.options.getMentionable('alvo');
        const mensagem = interaction.options.getString('mensagem');
        const horariosInput = interaction.options.getString('horarios');
        const acao = interaction.options.getString('acao');

        // Ações de gerenciamento
        if (acao === 'list') {
            const schedules = listSchedules(interaction.guildId);
            if (schedules.length === 0) return interaction.reply({ content: '📭 Nenhum agendamento ativo.', ephemeral: true });
            const list = schedules.map(s => `🕒 **${s.time}** - "${s.message.substring(0, 50)}..."`).join('\n');
            return interaction.reply({ content: `**Agendamentos ativos:**\n${list}`, ephemeral: true });
        }

        if (acao === 'remove') {
            if (!horariosInput) return interaction.reply({ content: '❌ Especifique o horário do agendamento a remover.', ephemeral: true });
            const times = horariosInput.split(',').map(t => t.trim());
            let removed = 0;
            for (const time of times) {
                if (removeSchedule(interaction.guildId, mensagem, time)) removed++;
            }
            return interaction.reply({ content: `✅ ${removed} agendamento(s) removido(s).`, ephemeral: true });
        }

        // Envio imediato (sem horários)
        if (!horariosInput) {
            await interaction.deferReply({ ephemeral: true });
            let targets = [];
            if (alvo.id === interaction.guild.id) { // @everyone
                const members = await interaction.guild.members.fetch();
                targets = members.filter(m => !m.user.bot);
            } else {
                targets = [await interaction.guild.members.fetch(alvo.id)];
            }

            let success = 0;
            for (const member of targets) {
                try {
                    await member.send(mensagem);
                    success++;
                    await new Promise(r => setTimeout(r, 300));
                } catch {}
            }
            return interaction.editReply(`✅ Mensagem enviada para ${success} membro(s).`);
        }

        // Agendamento
        const times = horariosInput.split(',').map(t => t.trim());
        for (const time of times) {
            if (!/^\d{1,2}:\d{2}$/.test(time)) {
                return interaction.reply({ content: `❌ Formato de hora inválido: "${time}". Use HH:MM.`, ephemeral: true });
            }
            addSchedule(interaction.guildId, mensagem, time);
        }
        await interaction.reply({ content: `✅ Agendamento(s) criado(s) para ${times.join(', ')}.`, ephemeral: true });
    }
};
