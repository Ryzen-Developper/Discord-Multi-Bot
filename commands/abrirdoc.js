const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DONO_ID = '1451961500595126394';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abrirdoc')
        .setDescription('Visualiza seus documentos armazenados (ou de outro usuário se for o dono)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário (apenas para o dono)').setRequired(false))
        .addStringOption(opt => opt.setName('arquivo').setDescription('Nome do arquivo específico (opcional)').setRequired(false)),

    async execute(interaction) {
        const isDono = interaction.user.id === DONO_ID;
        let targetUserId = interaction.user.id;
        const userMention = interaction.options.getUser('usuario');
        
        if (userMention) {
            if (!isDono) {
                return interaction.reply({ content: '❌ Você não tem permissão para ver documentos de outros usuários.', ephemeral: true });
            }
            targetUserId = userMention.id;
        }

        const userDir = path.join(__dirname, '..', 'data', 'storage', targetUserId);
        if (!fs.existsSync(userDir)) {
            return interaction.reply({ content: '📭 Nenhum documento encontrado para este usuário.', ephemeral: true });
        }

        const nomeArquivo = interaction.options.getString('arquivo');
        
        // Determina se a resposta deve ser ephemeral (só funciona em servidores)
        const ephemeral = !!interaction.guild;
        
        if (nomeArquivo) {
            const filePath = path.join(userDir, `${nomeArquivo}.json`);
            if (!fs.existsSync(filePath)) {
                return interaction.reply({ content: `❌ Arquivo \`${nomeArquivo}\` não encontrado.`, ephemeral });
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.type === 'file') {
                // Arquivo binário: envia como attachment
                const buffer = Buffer.from(data.content, 'base64');
                const attachment = new AttachmentBuilder(buffer, { name: data.fileName });
                const embed = new EmbedBuilder()
                    .setTitle(`📎 ${data.fileName}`)
                    .setColor(0x3498DB)
                    .setFooter({ text: `Salvo em ${new Date(data.data).toLocaleString('pt-BR')}` });
                await interaction.reply({ embeds: [embed], files: [attachment], ephemeral });
            } else {
                // Texto simples
                const embed = new EmbedBuilder()
                    .setTitle(`📄 ${data.nome}`)
                    .setDescription(`\`\`\`${data.content}\`\`\``)
                    .setFooter({ text: `Salvo em ${new Date(data.data).toLocaleString('pt-BR')}` })
                    .setColor(0x3498DB);
                await interaction.reply({ embeds: [embed], ephemeral });
            }
        } else {
            // Listar todos os arquivos
            const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
            if (files.length === 0) {
                return interaction.reply({ content: '📭 Nenhum documento encontrado.', ephemeral });
            }
            
            const fileList = files.map(f => {
                const data = JSON.parse(fs.readFileSync(path.join(userDir, f), 'utf8'));
                const icon = data.type === 'file' ? '📎' : '📄';
                return `${icon} **${data.nome}** - ${new Date(data.data).toLocaleDateString('pt-BR')}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`📁 Documentos de ${targetUserId === interaction.user.id ? 'você' : `usuário ${targetUserId}`}`)
                .setDescription(fileList)
                .setColor(0x2ECC71);
            await interaction.reply({ embeds: [embed], ephemeral });
        }
    }
};