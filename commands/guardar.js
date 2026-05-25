const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guardar')
        .setDescription('Armazena um texto ou arquivo')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do documento').setRequired(true))
        .addStringOption(opt => opt.setName('texto').setDescription('Texto a ser guardado').setRequired(false))
        .addAttachmentOption(opt => opt.setName('arquivo').setDescription('Arquivo a ser guardado').setRequired(false)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const nome = interaction.options.getString('nome').replace(/[^a-zA-Z0-9_-]/g, '_');
        const texto = interaction.options.getString('texto');
        const attachment = interaction.options.getAttachment('arquivo');

        if (!texto && !attachment) {
            return interaction.reply({ content: '❌ Você deve fornecer um texto ou um arquivo.', ephemeral: true });
        }

        const userDir = path.join(__dirname, '..', 'data', 'storage', userId);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        let content, type, fileName;
        if (attachment) {
            // Baixar o arquivo e converter para base64
            const response = await fetch(attachment.url);
            const buffer = await response.arrayBuffer();
            content = Buffer.from(buffer).toString('base64');
            type = 'file';
            fileName = attachment.name;
        } else {
            content = texto;
            type = 'text';
            fileName = null;
        }

        const data = {
            nome: nome,
            type: type,
            content: content,
            fileName: fileName,
            data: new Date().toISOString()
        };

        const filePath = path.join(userDir, `${nome}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        await interaction.reply({ content: `✅ Documento \`${nome}\` salvo com sucesso!`, ephemeral: true });
    }
};