const PermissionFlagsBits = require('discord.js').PermissionFlagsBits;
const StrukturManager = require('../utils/strukturManager');
const config = require('../config.json');

const POSITION_ROLE_MAP = {
    boss: '1381940226192183306',
    advisor: '1344013042765140059',
    captain: '1344013042765140059',
    broker: '1381942543314452480',
    recruit: '1381942778728153128'
};

async function syncUserRolesWithStruktur(member, currentPositionKey, POSITION_ROLE_MAP, strukturData, guild) {
    if (!member || !guild) return;
    const allPositionKeys = Object.keys(POSITION_ROLE_MAP);
    if (!currentPositionKey) {
        // Remove all struktur roles from member
        for (const posKey of allPositionKeys) {
            const roleId = POSITION_ROLE_MAP[posKey];
            if (roleId && member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId).catch(() => { });
            }
        }
        return;
    }
    const shouldHaveRoleId = POSITION_ROLE_MAP[currentPositionKey];
    for (const posKey of allPositionKeys) {
        const roleId = POSITION_ROLE_MAP[posKey];
        if (!roleId) continue;
        if (roleId === shouldHaveRoleId) continue;
        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId).catch(() => { });
        }
    }
}

module.exports = {
    name: 'cekrolestruktur',
    description: 'Cek dan sinkronkan role Discord member sesuai struktur organisasi',
    async execute(message, args, client) {
        // Only allow admin/commander
        const allowedRoleIds = ['1381940226192183306', '1344013042765140059'];
        const commanderRoles = ['Boss', 'Advisor', 'Captain'];
        const hasPermission =
            message.author.id === '403174107904081933' ||
            message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            allowedRoleIds.some(roleId => message.member.roles.cache.has(roleId)) ||
            commanderRoles.some(role =>
                message.member.roles.cache.some(r => r.name.includes(role))
            );
        if (!hasPermission) {
            const notif = await message.reply('❌ Hanya **Commander** atau **Admin** yang dapat menjalankan command ini!');
            setTimeout(async () => {
                try { await notif.delete(); } catch { }
                try { await message.delete(); } catch { }
            }, 30000);
            return;
        }
        if (!message.guild) {
            const notif = await message.reply('❌ Command ini hanya bisa dijalankan di server.');
            setTimeout(async () => {
                try { await notif.delete(); } catch { }
                try { await message.delete(); } catch { }
            }, 30000);
            return;
        }
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const notif = await message.reply('❌ Bot tidak punya permission **Manage Roles**.');
            setTimeout(async () => {
                try { await notif.delete(); } catch { }
                try { await message.delete(); } catch { }
            }, 30000);
            return;
        }
        const sentMsg = await message.reply('⏳ Mengecek dan menyinkronkan role struktur, mohon tunggu...');
        const strukturData = StrukturManager.loadStrukturData();
        let totalChecked = 0, totalUpdated = 0, totalError = 0, totalRemoved = 0;

        // 1. Sinkronisasi role untuk user yang ada di struktur
        for (const [posKey, posData] of Object.entries(strukturData.positions)) {
            for (const member of posData.members) {
                if (!member.userId) continue;
                try {
                    const guildMember = await message.guild.members.fetch(member.userId).catch(() => null);
                    if (!guildMember) continue;
                    totalChecked++;
                    await syncUserRolesWithStruktur(guildMember, posKey, POSITION_ROLE_MAP, strukturData, message.guild);
                    const roleId = POSITION_ROLE_MAP[posKey];
                    if (roleId && message.guild.roles.cache.has(roleId) && !guildMember.roles.cache.has(roleId)) {
                        await guildMember.roles.add(roleId).catch(() => { });
                        totalUpdated++;
                    }
                } catch (e) {
                    totalError++;
                }
            }
        }

        // 2. Remove struktur roles dari user yang tidak ada di struktur
        for (const posKey of Object.keys(POSITION_ROLE_MAP)) {
            const roleId = POSITION_ROLE_MAP[posKey];
            if (!roleId) continue;
            const role = message.guild.roles.cache.get(roleId);
            if (!role) continue;
            for (const member of role.members.values()) {
                // Cek apakah userId ada di struktur posisi manapun
                let found = false;
                for (const posData of Object.values(strukturData.positions)) {
                    if (posData.members.some(m => m.userId === member.id)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    await member.roles.remove(roleId).catch(() => { });
                    totalRemoved++;
                }
            }
        }

        await sentMsg.edit(`✅ Selesai cek role struktur!\nTotal dicek: **${totalChecked}**\nRole diperbaiki: **${totalUpdated}**\nRole dihapus: **${totalRemoved}**\nError: **${totalError}**`);
        setTimeout(async () => {
            try { await sentMsg.delete(); } catch { }
            try { await message.delete(); } catch { }
        }, 5000);
    }
};
