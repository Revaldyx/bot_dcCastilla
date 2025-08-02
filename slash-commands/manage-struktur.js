const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const StrukturManager = require('../utils/strukturManager');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const LOG_PATH = path.join(__dirname, '..', 'data', 'struktur-activity.log');

const POSITION_ROLE_MAP = {
    boss: '1381940226192183306',
    advisor: '1344013042765140059',
    captain: '1344013042765140059',
    broker: '1381942543314452480',
    recruit: '1381942778728153128'
};

const POSITION_CHOICES = [
    { name: '👑 Boss', value: 'boss' },
    { name: '🎯 Advisor', value: 'advisor' },
    { name: '⚔️ Captain', value: 'captain' },
    { name: '💼 Brokers', value: 'broker' },
    { name: '🤝 Recruit', value: 'recruit' }
];

function logStrukturActivity(action, user, detail) {
    const logLine = `[${new Date().toISOString()}] [${action}] by ${user.tag || user.id} (${user.id}): ${detail}\n`;
    fs.appendFile(LOG_PATH, logLine, err => { if (err) console.error('Log error:', err); });
}

// Helper untuk sinkronisasi role user sesuai struktur JSON
async function syncUserRolesWithStruktur(member, currentPositionKey, POSITION_ROLE_MAP, strukturData, guild) {
    if (!member || !guild) return;
    const allPositionKeys = Object.keys(POSITION_ROLE_MAP);
    if (!currentPositionKey) {
        // Jika currentPositionKey null, hapus semua role di POSITION_ROLE_MAP dari member
        for (const posKey of allPositionKeys) {
            const roleId = POSITION_ROLE_MAP[posKey];
            if (roleId && member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId).catch(() => { });
            }
        }
        return;
    }
    // Dapatkan role yang seharusnya dimiliki user (hanya satu, sesuai posisi di struktur)
    const shouldHaveRoleId = POSITION_ROLE_MAP[currentPositionKey];
    // Hapus role lain yang tidak sesuai struktur
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
    data: new SlashCommandBuilder()
        .setName('ms')
        .setDescription('Kelola struktur organisasi Castilla')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Tambah member ke posisi')
                .addStringOption(option =>
                    option.setName('position')
                        .setDescription('Posisi dalam organisasi')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES))
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nama member')
                        .setRequired(true)
                        .setMaxLength(50))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Discord user (opsional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Hapus member dari posisi')
                .addStringOption(option =>
                    option.setName('position')
                        .setDescription('Posisi dalam organisasi')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES))
                .addStringOption(option =>
                    option.setName('member_id')
                        .setDescription('ID member yang akan dihapus')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update data member')
                .addStringOption(option =>
                    option.setName('position')
                        .setDescription('Posisi member')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES))
                .addStringOption(option =>
                    option.setName('member_id')
                        .setDescription('ID member yang akan diupdate')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('new_name')
                        .setDescription('Nama baru (opsional)')
                        .setRequired(false)
                        .setMaxLength(50))
                .addUserOption(option =>
                    option.setName('new_user')
                        .setDescription('Discord user baru (opsional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('Pindah member ke posisi lain')
                .addStringOption(option =>
                    option.setName('from_position')
                        .setDescription('Posisi asal')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES))
                .addStringOption(option =>
                    option.setName('to_position')
                        .setDescription('Posisi tujuan')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES))
                .addStringOption(option =>
                    option.setName('member_id')
                        .setDescription('ID member yang akan dipindah')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Cari member dalam struktur')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Nama atau ID member')
                        .setRequired(true)
                        .setMinLength(2)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Lihat statistik struktur organisasi'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lihat daftar member di posisi tertentu')
                .addStringOption(option =>
                    option.setName('position')
                        .setDescription('Posisi yang ingin dilihat')
                        .setRequired(true)
                        .addChoices(...POSITION_CHOICES)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Tampilkan semua data struktur organisasi lengkap'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cekrolestruktur')
                .setDescription('Cek dan sinkronkan role Discord member sesuai struktur organisasi')),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'member_id') {
            const position = interaction.options.getString('position') ||
                interaction.options.getString('from_position');
            if (!position) return interaction.respond([]);
            try {
                const data = StrukturManager.loadStrukturData();
                const members = data.positions[position]?.members || [];
                if (members.length === 0) {
                    return interaction.respond([{ name: 'Tidak ada member di posisi ini', value: 'no_members' }]);
                }
                const choices = members.map(member => ({
                    name: `${member.name} | ID: ${member.id}`,
                    value: member.id
                }));
                const filtered = choices.filter(choice =>
                    choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
                    choice.value.toLowerCase().includes(focusedOption.value.toLowerCase())
                ).slice(0, 25);
                if (filtered.length === 0) {
                    await interaction.respond([{ name: `Tidak ditemukan member dengan: "${focusedOption.value}"`, value: 'not_found' }]);
                } else {
                    await interaction.respond(filtered);
                }
            } catch (error) {
                console.error('Error in autocomplete:', error);
                await interaction.respond([{ name: 'Error loading members', value: 'error' }]);
            }
        }
    },

    async execute(interaction) {
        // Check permissions - only commanders and above can manage structure
        const commanderRoles = ['Boss', 'Advisor', 'Captain'];
        const allowedRoleIds = ['1381940226192183306', '1344013042765140059'];
        const hasPermission =
            interaction.user.id === '403174107904081933' ||
            interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
            allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId)) ||
            commanderRoles.some(role =>
                interaction.member.roles.cache.some(r => r.name.includes(role))
            );
        if (!hasPermission) {
            return interaction.reply({
                content: '❌ Hanya **Commander** atau **Admin** yang dapat mengelola struktur organisasi!',
                ephemeral: true
            });
        }
        const subcommand = interaction.options.getSubcommand();
        const botCanManageRoles = interaction.guild
            ? interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)
            : false;
        try {
            switch (subcommand) {
                case 'add': {
                    const position = interaction.options.getString('position');
                    const name = interaction.options.getString('name');
                    const user = interaction.options.getUser('user');
                    const memberData = { name, userId: user?.id || null };
                    const result = StrukturManager.addMember(position, memberData, interaction.user.id);
                    logStrukturActivity('ADD', interaction.user, `Add ${name} to ${position} (user: ${user?.id || '-'}) result: ${result.success}`);
                    if (result.success) {
                        if (user && interaction.guild) {
                            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                            const roleId = POSITION_ROLE_MAP[position];
                            if (member && roleId && interaction.guild.roles.cache.has(roleId) && botCanManageRoles) {
                                if (!member.roles.cache.has(roleId)) {
                                    await member.roles.add(roleId).catch(() => { });
                                }
                                // Sinkronisasi role: hapus role lain yang tidak sesuai struktur
                                const strukturData = StrukturManager.loadStrukturData();
                                await syncUserRolesWithStruktur(member, position, POSITION_ROLE_MAP, strukturData, interaction.guild);
                            }
                        }
                        await interaction.reply({ content: '✅ Member berhasil ditambahkan!', ephemeral: true });
                        if (user && interaction.guild && POSITION_ROLE_MAP[position] && !botCanManageRoles) {
                            await interaction.followUp({
                                content: '⚠️ Bot tidak punya permission **Manage Roles** untuk assign role otomatis!',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
                    }
                    break;
                }
                case 'remove': {
                    const position = interaction.options.getString('position');
                    const memberId = interaction.options.getString('member_id');
                    if (memberId === 'no_members' || memberId === 'not_found' || memberId === 'error') {
                        return interaction.reply({
                            content: '❌ Pilih member yang valid dari daftar autocomplete!',
                            ephemeral: true
                        });
                    }
                    const data = StrukturManager.loadStrukturData();
                    const memberData = data.positions[position]?.members.find(m => m.id === memberId);
                    const result = StrukturManager.removeMember(position, memberId);
                    logStrukturActivity('REMOVE', interaction.user, `Remove ${memberId} from ${position} result: ${result.success}`);
                    if (result.success) {
                        if (memberData && memberData.userId && interaction.guild) {
                            const member = await interaction.guild.members.fetch(memberData.userId).catch(() => null);
                            const roleId = POSITION_ROLE_MAP[position];
                            if (member && roleId && interaction.guild.roles.cache.has(roleId) && botCanManageRoles) {
                                if (member.roles.cache.has(roleId)) {
                                    await member.roles.remove(roleId).catch(() => { });
                                }
                                // Tidak perlu sync di remove, karena user sudah tidak ada di struktur
                            }
                        }
                        await interaction.reply({ content: '✅ Member berhasil dihapus!', ephemeral: true });
                        if (memberData && memberData.userId && interaction.guild && POSITION_ROLE_MAP[position] && !botCanManageRoles) {
                            await interaction.followUp({
                                content: '⚠️ Bot tidak punya permission **Manage Roles** untuk menghapus role otomatis!',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
                    }
                    break;
                }
                case 'update': {
                    const position = interaction.options.getString('position');
                    const memberId = interaction.options.getString('member_id');
                    const newName = interaction.options.getString('new_name');
                    const newUser = interaction.options.getUser('new_user');
                    if (memberId === 'no_members' || memberId === 'not_found' || memberId === 'error') {
                        return interaction.reply({
                            content: '❌ Pilih member yang valid dari daftar autocomplete!',
                            ephemeral: true
                        });
                    }
                    const updates = {};
                    if (newName) updates.name = newName;
                    if (newUser) updates.userId = newUser.id;
                    if (Object.keys(updates).length === 0) {
                        return interaction.reply({
                            content: '❌ Pilih minimal satu data yang akan diupdate!',
                            ephemeral: true
                        });
                    }
                    const data = StrukturManager.loadStrukturData();
                    const positionData = data.positions[position];
                    const oldMember = positionData?.members.find(m => m.id === memberId);
                    const oldUserId = oldMember?.userId;
                    const result = StrukturManager.updateMember(position, memberId, updates);
                    logStrukturActivity('UPDATE', interaction.user, `Update ${memberId} in ${position} result: ${result.success}`);
                    if (result.success) {
                        // Role management jika user Discord diubah
                        if (interaction.guild && updates.userId && oldUserId !== updates.userId) {
                            const roleId = POSITION_ROLE_MAP[position];
                            // Tambahkan role ke user baru jika belum punya
                            const newMember = await interaction.guild.members.fetch(updates.userId).catch(() => null);
                            if (newMember && roleId && interaction.guild.roles.cache.has(roleId) && botCanManageRoles) {
                                if (!newMember.roles.cache.has(roleId)) {
                                    await newMember.roles.add(roleId).catch(() => { });
                                }
                                // Sinkronisasi role user baru
                                const strukturData = StrukturManager.loadStrukturData();
                                await syncUserRolesWithStruktur(newMember, position, POSITION_ROLE_MAP, strukturData, interaction.guild);
                            }
                            // Hapus role dari user lama jika masih punya
                            if (oldUserId) {
                                const oldDiscordMember = await interaction.guild.members.fetch(oldUserId).catch(() => null);
                                if (oldDiscordMember && roleId && interaction.guild.roles.cache.has(roleId) && botCanManageRoles) {
                                    if (oldDiscordMember.roles.cache.has(roleId)) {
                                        await oldDiscordMember.roles.remove(roleId).catch(() => { });
                                    }
                                    // Sinkronisasi role user lama (harusnya tidak punya role posisi manapun)
                                    const strukturData = StrukturManager.loadStrukturData();
                                    await syncUserRolesWithStruktur(oldDiscordMember, null, POSITION_ROLE_MAP, strukturData, interaction.guild);
                                }
                            }
                        } else if (interaction.guild && updates.userId && oldUserId === updates.userId) {
                            // Jika hanya update nama, tetap sync role user
                            const roleId = POSITION_ROLE_MAP[position];
                            const member = await interaction.guild.members.fetch(updates.userId).catch(() => null);
                            if (member && roleId && interaction.guild.roles.cache.has(roleId) && botCanManageRoles) {
                                const strukturData = StrukturManager.loadStrukturData();
                                await syncUserRolesWithStruktur(member, position, POSITION_ROLE_MAP, strukturData, interaction.guild);
                            }
                        }
                        await interaction.reply({ content: '✅ Data member berhasil diupdate!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
                    }
                    break;
                }
                case 'move': {
                    const fromPosition = interaction.options.getString('from_position');
                    const toPosition = interaction.options.getString('to_position');
                    const memberId = interaction.options.getString('member_id');
                    if (memberId === 'no_members' || memberId === 'not_found' || memberId === 'error') {
                        return interaction.reply({
                            content: '❌ Pilih member yang valid dari daftar autocomplete!',
                            ephemeral: true
                        });
                    }
                    if (fromPosition === toPosition) {
                        return interaction.reply({
                            content: '❌ Posisi asal dan tujuan tidak boleh sama!',
                            ephemeral: true
                        });
                    }
                    const result = StrukturManager.moveMember(fromPosition, toPosition, memberId);
                    logStrukturActivity('MOVE', interaction.user, `Move ${memberId} from ${fromPosition} to ${toPosition} result: ${result.success}`);
                    if (result.success) {
                        if (result.member.userId && interaction.guild) {
                            const member = await interaction.guild.members.fetch(result.member.userId).catch(() => null);
                            const fromRole = POSITION_ROLE_MAP[fromPosition];
                            const toRole = POSITION_ROLE_MAP[toPosition];
                            if (member && botCanManageRoles) {
                                if (toRole && interaction.guild.roles.cache.has(toRole)) {
                                    if (!member.roles.cache.has(toRole)) {
                                        await member.roles.add(toRole).catch(e => {
                                            logStrukturActivity('MOVE_ROLE_ADD_FAIL', interaction.user, `Failed to add role ${toRole} to ${member.id}: ${e.message}`);
                                        });
                                    }
                                }
                                if (fromRole && interaction.guild.roles.cache.has(fromRole)) {
                                    if (member.roles.cache.has(fromRole)) {
                                        await member.roles.remove(fromRole).catch(e => {
                                            logStrukturActivity('MOVE_ROLE_REMOVE_FAIL', interaction.user, `Failed to remove role ${fromRole} from ${member.id}: ${e.message}`);
                                        });
                                    }
                                }
                                // Sinkronisasi role: hapus role lain yang tidak sesuai struktur
                                const strukturData = StrukturManager.loadStrukturData();
                                await syncUserRolesWithStruktur(member, toPosition, POSITION_ROLE_MAP, strukturData, interaction.guild);
                            }
                        }
                        await interaction.reply({ content: '✅ Member berhasil dipindah!', ephemeral: true });
                        if (result.member.userId && interaction.guild && (!botCanManageRoles)) {
                            await interaction.followUp({
                                content: '⚠️ Bot tidak punya permission **Manage Roles** untuk update role otomatis!',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
                    }
                    break;
                }
                case 'search': {
                    const query = interaction.options.getString('query');
                    const results = StrukturManager.searchMember(query);
                    if (results.length === 0) {
                        return interaction.reply({
                            content: `❌ Tidak ditemukan member dengan kata kunci: **${query}**`,
                            ephemeral: true
                        });
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(`🔍 Hasil Pencarian: "${query}"`)
                        .setColor(config.embedColor)
                        .setTimestamp();
                    results.slice(0, 10).forEach(member => {
                        embed.addFields({
                            name: member.name,
                            value: `**Posisi:** ${member.positionName}\n**ID:** ${member.id}${member.userId ? `\n**Discord:** <@${member.userId}>` : ''}`,
                            inline: true
                        });
                    });
                    if (results.length > 10) {
                        embed.setFooter({ text: `Menampilkan 10 dari ${results.length} hasil` });
                    }
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    logStrukturActivity('SEARCH', interaction.user, `Search "${query}" found: ${results.length}`);
                    break;
                }
                case 'stats': {
                    const stats = StrukturManager.getPositionStats();
                    const embed = new EmbedBuilder()
                        .setTitle('📊 Statistik Struktur Organisasi Castilla')
                        .setColor(config.embedColor)
                        .setTimestamp();
                    Object.entries(stats.positions).forEach(([key, stat]) => {
                        const progressBar = this.createProgressBar(stat.percentage);
                        embed.addFields({
                            name: stat.name.replace(/\*\*/g, ''),
                            value: `${stat.current}/${stat.max} members (${stat.percentage}%)\n${progressBar}`,
                            inline: false
                        });
                    });
                    embed.addFields(
                        { name: 'Total Members', value: `${stats.totalMembers}`, inline: true },
                        { name: 'Last Updated', value: `<t:${Math.floor(stats.lastUpdated / 1000)}:R>`, inline: true }
                    );
                    await interaction.reply({ embeds: [embed] });
                    logStrukturActivity('STATS', interaction.user, `View stats`);
                    break;
                }
                case 'list': {
                    const position = interaction.options.getString('position');
                    const data = StrukturManager.loadStrukturData();
                    const positionData = data.positions[position];
                    if (!positionData) {
                        return interaction.reply({ content: '❌ Posisi tidak valid!', ephemeral: true });
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(positionData.name.replace(/\*\*/g, ''))
                        .setDescription(positionData.description)
                        .setColor(config.embedColor)
                        .addFields(
                            { name: 'Kapasitas', value: `${positionData.members.length}/${positionData.maxMembers}`, inline: true }
                        )
                        .setTimestamp();
                    if (positionData.members.length === 0) {
                        embed.addFields({ name: 'Members', value: 'Tidak ada member', inline: false });
                    } else {
                        const memberList = positionData.members.map(member => {
                            const userMention = member.userId ? ` (<@${member.userId}>)` : '';
                            return `• **${member.name}**${userMention}\n  ID: \`${member.id}\``;
                        }).join('\n');
                        embed.addFields({ name: 'Members', value: memberList, inline: false });
                    }
                    await interaction.reply({ embeds: [embed] });
                    logStrukturActivity('LIST', interaction.user, `List ${position}`);
                    break;
                }
                case 'all': {
                    const data = StrukturManager.loadStrukturData();

                    // Cek dan hapus member double (userId sama di lebih dari satu posisi)
                    const userIdMap = new Map();
                    Object.entries(data.positions).forEach(([posKey, position]) => {
                        position.members = position.members.filter(member => {
                            if (!member.userId) return true;
                            if (userIdMap.has(member.userId)) {
                                // Sudah ada di posisi lain, hapus dari posisi ini
                                return false;
                            }
                            userIdMap.set(member.userId, posKey);
                            return true;
                        });
                    });
                    // Simpan perubahan jika ada duplikat yang dihapus
                    StrukturManager.saveStrukturData(data);

                    const embed = new EmbedBuilder()
                        .setTitle('📋 STRUKTUR ORGANISASI CASTILLA')
                        .setColor('#3498db')
                        .setTimestamp();

                    let description = '';
                    Object.entries(data.positions).forEach(([key, position]) => {
                        description += `**${position.name.replace(/\*\*/g, '')}**\n`;
                        if (position.members.length === 0) {
                            description += `Kosong\n\n`;
                        } else {
                            position.members.forEach(member => {
                                const userMention = member.userId ? ` <@${member.userId}>` : '';
                                description += `${member.name}${userMention}\n`;
                            });
                            description += '\n';
                        }
                    });
                    description += `**Total Member: ${data.metadata?.totalMembers || 0}**\n\n`;
                    embed.setDescription(description);

                    await interaction.reply({ embeds: [embed] });
                    logStrukturActivity('ALL', interaction.user, `View all`);
                    break;
                }
                case 'cekrolestruktur': {
                    if (!interaction.guild) {
                        return interaction.reply({ content: '❌ Command ini hanya bisa dijalankan di server.', ephemeral: true });
                    }
                    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                        return interaction.reply({ content: '❌ Bot tidak punya permission **Manage Roles**.', ephemeral: true });
                    }
                    await interaction.reply({ content: '⏳ Mengecek dan menyinkronkan role struktur, mohon tunggu...', ephemeral: true });
                    const strukturData = StrukturManager.loadStrukturData();
                    let totalChecked = 0, totalUpdated = 0, totalError = 0;
                    for (const [posKey, posData] of Object.entries(strukturData.positions)) {
                        for (const member of posData.members) {
                            if (!member.userId) continue;
                            try {
                                const guildMember = await interaction.guild.members.fetch(member.userId).catch(() => null);
                                if (!guildMember) continue;
                                totalChecked++;
                                // Sinkronisasi role
                                await syncUserRolesWithStruktur(guildMember, posKey, POSITION_ROLE_MAP, strukturData, interaction.guild);
                                // Pastikan role posisi diberikan
                                const roleId = POSITION_ROLE_MAP[posKey];
                                if (roleId && interaction.guild.roles.cache.has(roleId) && !guildMember.roles.cache.has(roleId)) {
                                    await guildMember.roles.add(roleId).catch(() => { });
                                    totalUpdated++;
                                }
                            } catch (e) {
                                totalError++;
                            }
                        }
                    }
                    await interaction.followUp({
                        content: `✅ Selesai cek role struktur!\nTotal dicek: **${totalChecked}**\nRole diperbaiki: **${totalUpdated}**\nError: **${totalError}**`,
                        ephemeral: true
                    });
                    logStrukturActivity('CEKROLESTRUKTUR', interaction.user, `Checked: ${totalChecked}, Updated: ${totalUpdated}, Error: ${totalError}`);
                    break;
                }
            }
        } catch (error) {
            console.error('Error in ms command:', error);
            logStrukturActivity('ERROR', interaction.user, `Error: ${error.message}`);
            await interaction.reply({
                content: '❌ Terjadi error saat mengelola struktur!',
                ephemeral: true
            });
        }
    },

    createProgressBar(percentage, length = 10) {
        const filled = Math.round((percentage / 100) * length);
        const empty = length - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }
};
