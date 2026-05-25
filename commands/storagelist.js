const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('storagelist')
        .setDescription('Lista todos os seus documentos armazenados'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userDir = path.join(__dirname, '..', 'data', 'storage', userId);
        
        if (!fs.existsSync(userDir)) {
            return interaction.reply({ content: '📭 Você não possui documentos armazenados.', ephemeral: true });
        }

        const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
        if (files.length === 0) {
            return interaction.reply({ content: '📭 Nenhum documento encontrado.', ephemeral: true });
        }

        const list = files.map(f => {
            const data = JSON.parse(fs.readFileSync(path.join(userDir, f), 'utf8'));
            const icon = data.type === 'file' ? '📎' : '📄';
            return `${icon} **${data.nome}**`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📁 Seus documentos')
            .setDescription(list)
            .setColor(0x2ECC71);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};