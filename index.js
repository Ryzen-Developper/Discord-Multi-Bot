require('dotenv').config();
const noblox = require('noblox.js');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const config = require('./config.json');

// ===== Discord =====
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { loadSchedules } = require('./utils/scheduler');

// === Webhook para logs de comandos ===
const commandHook = new Webhook(process.env.WEBHOOK_COMMANDS);

// ===============================================
//        BOT ROBLOX (SEU CÓDIGO ORIGINAL)
// ===============================================

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot online ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("KeepAlive rodando na porta " + PORT);
});

const borderHook = new Webhook(config.webhooks.borderLogs);
const hierarchyHook = new Webhook(config.webhooks.hierarchyLogs);
const raidHook = new Webhook(config.webhooks.raidLogs);

let lastLogDate = null;
let roleMap = {};

function getTimestamp() {
    const now = new Date();
    return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

async function sendLog(hook, title, color, fields) {
    const embed = new MessageBuilder()
        .setTitle(title)
        .setColor(color)
        .setTimestamp();

    fields.forEach(field => embed.addField(field.name, field.value, field.inline || false));
    
    try {
        await hook.send(embed);
    } catch (err) {
        console.error('Erro ao enviar webhook:', err.message);
    }
}

async function sendCommandLog(title, description, color = 0x5865F2) {
    const embed = new MessageBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
    try {
        await commandHook.send(embed);
    } catch (err) {
        console.error('Erro ao enviar log de comando:', err.message);
    }
}

async function checkLoop() {
    try {
        const logs = await noblox.getAuditLog(config.groupId, { limit: 50 });
        if (!logs?.data?.length) return;

        const mostRecent = new Date(logs.data[0].created);

        if (!lastLogDate) {
            lastLogDate = mostRecent;
            console.log(`[SISTEMA] Monitoramento iniciado - Grupo ${config.groupId}`);
            return;
        }

        if (mostRecent <= lastLogDate) return;

        const newLogs = logs.data
            .filter(log => new Date(log.created) > lastLogDate)
            .reverse();

        for (const entry of newLogs) {
            const actor = entry.actor;
            const action = entry.actionType;
            const desc = entry.description;

            const isWhitelisted = config.whitelistRanks.includes(actor.role.rank);

            if (action === 'Change Rank') {
                const targetId = desc.TargetId;
                const targetName = desc.TargetName;
                const oldRoleId = desc.OldRoleSetId;
                const newRoleId = desc.NewRoleSetId;

                const oldRank = roleMap[oldRoleId];
                const newRank = roleMap[newRoleId];

                if (oldRank === undefined || newRank === undefined) {
                    console.log(`[AVISO] Rank não mapeado: old=${oldRoleId}, new=${newRoleId}`);
                    continue;
                }

                const pulo = Math.abs(newRank - oldRank);
                const isPromocao = newRank > oldRank;
                const status = isPromocao ? 'PROMOÇÃO' : 'REBAIXAMENTO';
                const color = isPromocao ? '#00FF00' : '#FFFF00';

                await sendLog(hierarchyHook, `REGISTRO DE HIERARQUIA: ${status}`, color, [
                    { name: 'Oficial', value: actor.user.username, inline: true },
                    { name: 'Membro', value: `${targetName} (ID: ${targetId})`, inline: true },
                    { name: 'Pulo de Patentes', value: pulo.toString(), inline: false },
                    { name: 'Mudança', value: `${desc.OldRoleSetName} → ${desc.NewRoleSetName}`, inline: false }
                ]);

                if (!isWhitelisted && pulo > config.thresholdRankJump) {
                    console.log(`[ANTI-ABUSO] Detectado por ${actor.user.username} - pulo ${pulo}`);

                    try {
                        await noblox.setRank(config.groupId, targetId, oldRank);
                        await noblox.setRank(config.groupId, actor.user.userId, config.punishmentRankId);

                        await sendLog(raidHook, 'INTERVENÇÃO: ANTI-ABUSO ATIVADO', '#FF0000', [
                            { name: 'Infrator', value: `${actor.user.username} (Punido → 3º SGT)`, inline: true },
                            { name: 'Vítima', value: `${targetName} (Restaurado)`, inline: true },
                            { name: 'Motivo', value: `Pulo de ${pulo} patentes (máx permitido: ${config.thresholdRankJump})`, inline: false },
                            { name: 'Horário', value: getTimestamp(), inline: false }
                        ]);
                    } catch (err) {
                        console.error('Erro ao reverter/punir:', err.message);
                    }
                }
            }

            if (action === 'Accept Join Request') {
                await sendLog(borderHook, 'FRONTEIRA: ENTRADA APROVADA', '#0099FF', [
                    { name: 'Aprovado por', value: actor.user.username, inline: true },
                    { name: 'Novo Membro', value: desc.TargetName, inline: true }
                ]);
            }
        }

        lastLogDate = mostRecent;
    } catch (err) {
        console.error('Erro no loop principal:', err.message);
    }
}

async function startRoblox() {
    try {
        const cookie = process.env.ROBLOX_COOKIE || config.cookie;
        if (!cookie) throw new Error('Cookie não encontrado! Coloque no .env ou config.json');

        const user = await noblox.setCookie(cookie);
        console.log(`[LOGIN] Logado como: ${user.name} (ID: ${user.id})`);

        const roles = await noblox.getRoles(config.groupId);
        roleMap = {};
        for (const role of roles) {
            roleMap[role.ID] = role.rank;
        }
        console.log(`[OK] ${roles.length} patentes mapeadas com sucesso!`);

        setInterval(checkLoop, 5000);
    } catch (err) {
        console.error('Erro fatal na inicialização do Roblox:', err.message);
    }
}

// ===============================================
//        BOT DISCORD
// ===============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: ['CHANNEL', 'MESSAGE', 'USER']
});

client.commands = new Collection();
client.startTime = Date.now();

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const loadCommandsFromDir = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                loadCommandsFromDir(itemPath);
            } else if (item.endsWith('.js')) {
                const command = require(itemPath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`[COMANDO] Carregado: ${command.data.name}`);
                }
            }
        }
    };
    loadCommandsFromDir(commandsPath);
}

// === STATUS ===
const STATUS_TEXTS = ['EB DO KING', '👉 .gg/DCqd6Vs4R ⚠️'];
let statusIndex = 0;

function updateStatus() {
    client.user?.setActivity(STATUS_TEXTS[statusIndex], { type: ActivityType.Custom });
}

setInterval(() => {
    statusIndex = (statusIndex + 1) % STATUS_TEXTS.length;
    updateStatus();
}, 10000);

// ===============================================
//        VOZ - CANAL DE STATUS DO BOT
// ===============================================
const VOICE_CHANNEL_ID = '1491873456415834342';

async function setupVoiceChannel() {
    try {
        const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
        if (!channel || !channel.isVoiceBased()) {
            console.error('[VOZ] Canal não encontrado ou não é de voz.');
            return;
        }

        // Renomeia o canal para BOT-ON
        await channel.setName('—͟͞͞⌠🟢⌡・⌠ BOT-ON ⌡');
        console.log('[VOZ] Canal renomeado para BOT-ON');

        // Entra no canal de voz
        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });
        console.log('[VOZ] Bot entrou no canal de voz');
    } catch (err) {
        console.error('[VOZ] Erro ao configurar canal de voz:', err.message);
    }
}

client.once('ready', async () => {
    console.log(`[DISCORD] Bot logado como ${client.user.tag}`);

    await sendCommandLog('🚀 Bot Iniciado', `**Hora:** ${new Date().toLocaleString('pt-BR')}`, 0x00FF00);

    updateStatus();

    await setupVoiceChannel();

    loadSchedules(client);

    const commands = [];
    client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Registrando comandos slash...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
});

function hasPermission(member, userId) {
    if (userId === '1451961500595126394') return true;
    if (!member) return false;
    const allowedRoles = ['1462284795374473260', '1462533718001320130', '1462284795919990998', '1462284795374473262'];
    return member.roles.cache.some(role => allowedRoles.includes(role.id));
}

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
            try {
                await command.autocomplete(interaction, config);
            } catch (error) {
                console.error('Erro no autocomplete:', error);
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const publicCommands = ['help', 'info', 'guardar', 'abrirdoc', 'storagelist', 'fk', 'dv', 'ping', 'userinfo', 'say'];
    const isPublic = publicCommands.includes(interaction.commandName);
    
    if (!isPublic) {
        if (!hasPermission(interaction.member, interaction.user.id)) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', flags: 64 });
        }
    }

    try {
        await command.execute(interaction, client, config);
        
        await sendCommandLog(
            `✅ Comando: /${interaction.commandName}`,
            `**Usuário:** ${interaction.user.tag}\n**Local:** ${interaction.guild?.name || 'DM'}\n**Opções:** ${interaction.options.data.map(o => `${o.name}: ${o.value}`).join(', ') || 'Nenhuma'}`,
            0x00FF00
        );
    } catch (error) {
        console.error(`Erro no comando ${interaction.commandName}:`, error);
        await sendCommandLog(
            `❌ Erro: /${interaction.commandName}`,
            `**Usuário:** ${interaction.user.tag}\n**Erro:** ${error.message}`,
            0xFF0000
        );
        const reply = { content: 'Ocorreu um erro ao executar este comando.', flags: 64 };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// ===============================================
//        INICIALIZAÇÃO
// ===============================================

(async () => {
    await startRoblox();
    await client.login(process.env.DISCORD_TOKEN);
})();