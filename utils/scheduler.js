const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const schedulesPath = path.join(__dirname, '..', 'data', 'schedules.json');
let schedules = [];
let clientRef = null;

function loadSchedules(client) {
    clientRef = client;
    if (!fs.existsSync(path.dirname(schedulesPath))) {
        fs.mkdirSync(path.dirname(schedulesPath), { recursive: true });
    }
    if (fs.existsSync(schedulesPath)) {
        try {
            schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
        } catch {
            schedules = [];
        }
    }
    schedules.forEach(sched => scheduleJob(sched));
}

function saveSchedules() {
    fs.writeFileSync(schedulesPath, JSON.stringify(schedules, null, 2));
}

function timeToCron(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return `${minute} ${hour} * * *`;
}

function scheduleJob(sched) {
    const cronTime = timeToCron(sched.time);
    const job = cron.schedule(cronTime, async () => {
        if (!clientRef) return;
        try {
            const guild = await clientRef.guilds.fetch(sched.guildId);
            if (!guild) return;
            const members = await guild.members.fetch();
            for (const member of members.values()) {
                if (member.user.bot) continue;
                try {
                    await member.send(sched.message);
                } catch {}
                await new Promise(r => setTimeout(r, 500));
            }
        } catch (err) {
            console.error('Erro ao executar agendamento:', err);
        }
    }, { timezone: "America/Sao_Paulo" });
    job.start();
    sched.job = job;
}

function addSchedule(guildId, message, time) {
    const existing = schedules.find(s => s.guildId === guildId && s.message === message && s.time === time);
    if (!existing) {
        const sched = { guildId, message, time };
        scheduleJob(sched);
        schedules.push(sched);
        saveSchedules();
    }
}

function removeSchedule(guildId, message, time) {
    const index = schedules.findIndex(s => s.guildId === guildId && s.message === message && s.time === time);
    if (index !== -1) {
        const sched = schedules[index];
        if (sched.job) sched.job.stop();
        schedules.splice(index, 1);
        saveSchedules();
        return true;
    }
    return false;
}

function listSchedules(guildId) {
    return schedules.filter(s => s.guildId === guildId);
}

module.exports = { loadSchedules, addSchedule, removeSchedule, listSchedules };