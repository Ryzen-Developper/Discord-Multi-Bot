const { SlashCommandBuilder } = require('discord.js');

const mensagem = `# 💣 Bombinha do KING!

> **🚨 ALERTA: BOMBA ENVIADA 🚨**

**BOMBA NELE! (Bem feito 😈)**

Sou apenas um bot automático...  
Não sei exatamente o motivo disso ter sido enviado pra você, mas...  
provavelmente você mereceu. 🙂

> *[Mensagem automática — sem sentimentos envolvidos]*

---

### 🔗 Acesso liberado:
\`\`\`
https://discord.gg/DCqd6Vs4R
\`\`\`

---

\`\`\`diff
- Status: Payload entregue com sucesso.
+ Resultado: Impacto confirmado.
\`\`\`

> *Se você não gostou... missão cumprida.* 😎`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fk')
        .setDescription('Envia 100 mensagens engraçadas no PV do usuário')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Usuário alvo')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.editReply('❌ Usuário não encontrado no servidor.');
        }

        try {
            await member.send(mensagem);
        } catch (err) {
            return interaction.editReply('❌ Não foi possível enviar DM. O usuário pode ter DMs fechadas.');
        }

        await interaction.editReply(`🚀 Iniciando envio de mensagens para ${user.username}...`);

        // Envio em loop
        (async () => {
            for (let i = 1; i < 100; i++) {
                try {
                    await member.send(mensagem);
                    await new Promise(r => setTimeout(r, 300)); // delay maior pra evitar rate limit
                } catch {
                    break;
                }
            }
        })();
    }
};