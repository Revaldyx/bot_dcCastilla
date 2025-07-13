const fs = require('fs');
const path = require('path');

const strukturDataPath = path.join(__dirname, '..', 'data', 'struktur.json');

class StrukturManager {
    static loadStrukturData() {
        try {
            if (fs.existsSync(strukturDataPath)) {
                const data = JSON.parse(fs.readFileSync(strukturDataPath, 'utf8'));
                if (data.positions.soldier) {
                    if (!data.positions.broker) data.positions.broker = { members: [] };
                    data.positions.broker.members = [
                        ...(data.positions.broker.members || []),
                        ...(data.positions.soldier.members || [])
                    ];
                    delete data.positions.soldier;
                }
                this.updateMetadata(data);
                return data;
            }
        } catch (error) {
            console.error('Error loading struktur data:', error);
        }
        return this.getDefaultStructure();
    }

    static saveStrukturData(data) {
        try {
            // Move all soldier members to broker if soldier exists before saving
            if (data.positions.soldier) {
                if (!data.positions.broker) data.positions.broker = { members: [] };
                data.positions.broker.members = [
                    ...(data.positions.broker.members || []),
                    ...(data.positions.soldier.members || [])
                ];
                delete data.positions.soldier;
            }
            const dataDir = path.dirname(strukturDataPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Update metadata before saving
            this.updateMetadata(data);

            fs.writeFileSync(strukturDataPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving struktur data:', error);
            return false;
        }
    }

    static updateMetadata(data) {
        let totalMembers = 0;
        Object.values(data.positions).forEach(position => {
            totalMembers += position.members.length;
        });

        data.metadata = {
            ...data.metadata,
            lastUpdated: Date.now(),
            totalMembers
        };
    }

    static addMember(positionKey, memberData, addedBy) {
        const data = this.loadStrukturData();

        if (!data.positions[positionKey]) {
            return { success: false, message: 'Posisi tidak valid!' };
        }

        const position = data.positions[positionKey];

        // Check if position is full
        if (position.members.length >= position.maxMembers) {
            return {
                success: false,
                message: `Posisi ${position.name} sudah penuh! (${position.members.length}/${position.maxMembers})`
            };
        }

        // Check if member already exists
        const existingMember = position.members.find(m =>
            m.id === memberData.id ||
            (memberData.userId && m.userId === memberData.userId)
        );

        if (existingMember) {
            return { success: false, message: 'Member sudah ada di posisi ini!' };
        }

        // Generate unique 4-digit ID if not provided
        if (!memberData.id) {
            let finalId;
            let counter = 0;
            do {
                finalId = Math.floor(1000 + Math.random() * 9000).toString();
                counter++;
                // Avoid infinite loop
                if (counter > 10000) break;
            } while (this.memberIdExists(finalId));
            memberData.id = finalId;
        }

        const newMember = {
            id: memberData.id,
            name: memberData.name,
            userId: memberData.userId || null,
            addedBy: addedBy,
            addedAt: Date.now()
        };

        position.members.push(newMember);

        if (this.saveStrukturData(data)) {
            return {
                success: true,
                message: `✅ ${memberData.name} berhasil ditambahkan ke ${position.name}`,
                member: newMember
            };
        } else {
            return { success: false, message: 'Gagal menyimpan data!' };
        }
    }

    static memberIdExists(id) {
        const data = this.loadStrukturData();
        for (const position of Object.values(data.positions)) {
            if (position.members.some(member => member.id === id)) {
                return true;
            }
        }
        return false;
    }

    static removeMember(positionKey, memberId) {
        const data = this.loadStrukturData();

        if (!data.positions[positionKey]) {
            return { success: false, message: 'Posisi tidak valid!' };
        }

        const position = data.positions[positionKey];
        const memberIndex = position.members.findIndex(m => m.id === memberId);

        if (memberIndex === -1) {
            return { success: false, message: 'Member tidak ditemukan!' };
        }

        const removedMember = position.members.splice(memberIndex, 1)[0];

        if (this.saveStrukturData(data)) {
            return {
                success: true,
                message: `✅ ${removedMember.name} berhasil dihapus dari ${position.name}`,
                member: removedMember
            };
        } else {
            return { success: false, message: 'Gagal menyimpan data!' };
        }
    }

    static updateMember(positionKey, memberId, updates) {
        const data = this.loadStrukturData();

        if (!data.positions[positionKey]) {
            return { success: false, message: 'Posisi tidak valid!' };
        }

        const position = data.positions[positionKey];
        const member = position.members.find(m => m.id === memberId);

        if (!member) {
            return { success: false, message: 'Member tidak ditemukan!' };
        }

        // Update member data
        if (updates.name) member.name = updates.name;
        if (updates.userId !== undefined) member.userId = updates.userId;
        member.lastUpdated = Date.now();

        if (this.saveStrukturData(data)) {
            return {
                success: true,
                message: `✅ Data ${member.name} berhasil diupdate`,
                member: member
            };
        } else {
            return { success: false, message: 'Gagal menyimpan data!' };
        }
    }

    static moveMember(fromPosition, toPosition, memberId) {
        const data = this.loadStrukturData();

        if (!data.positions[fromPosition] || !data.positions[toPosition]) {
            return { success: false, message: 'Posisi tidak valid!' };
        }

        const fromPos = data.positions[fromPosition];
        const toPos = data.positions[toPosition];

        // Check if target position is full
        if (toPos.members.length >= toPos.maxMembers) {
            return {
                success: false,
                message: `Posisi ${toPos.name} sudah penuh! (${toPos.members.length}/${toPos.maxMembers})`
            };
        }

        const memberIndex = fromPos.members.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            return { success: false, message: 'Member tidak ditemukan!' };
        }

        const member = fromPos.members.splice(memberIndex, 1)[0];
        member.movedAt = Date.now();
        toPos.members.push(member);

        if (this.saveStrukturData(data)) {
            return {
                success: true,
                message: `✅ ${member.name} berhasil dipindah dari ${fromPos.name} ke ${toPos.name}`,
                member: member
            };
        } else {
            return { success: false, message: 'Gagal menyimpan data!' };
        }
    }

    static searchMember(query) {
        const data = this.loadStrukturData();
        const results = [];

        Object.entries(data.positions).forEach(([posKey, position]) => {
            position.members.forEach(member => {
                if (member.name.toLowerCase().includes(query.toLowerCase()) ||
                    member.id.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        ...member,
                        position: posKey,
                        positionName: position.name
                    });
                }
            });
        });

        return results;
    }

    static getPositionStats() {
        const data = this.loadStrukturData();
        const stats = {};

        Object.entries(data.positions).forEach(([key, position]) => {
            stats[key] = {
                name: position.name,
                current: position.members.length,
                max: position.maxMembers,
                percentage: Math.round((position.members.length / position.maxMembers) * 100)
            };
        });

        return {
            positions: stats,
            totalMembers: data.metadata.totalMembers,
            lastUpdated: data.metadata.lastUpdated
        };
    }

    static getDefaultStructure() {
        return {
            positions: {
                boss: { name: "👑 **Le Patron (Boss)**", members: [], maxMembers: 1, description: "Pemimpin tertinggi keluarga Castilla" },
                godmother: { name: "💎 **La Marraine (Godmother)**", members: [], maxMembers: 1, description: "Ibu baptis keluarga Castilla" },
                advisor: { name: "🎯 **Le Conseiller (Advisor)**", members: [], maxMembers: 5, description: "Penasihat keluarga Castilla" },
                captain: { name: "⚔️ **Les Capitaines (Captains)**", members: [], maxMembers: 5, description: "Kapten operasional keluarga Castilla" },
                broker: { name: "💼 **Les Brokers (Brokers)**", members: [], maxMembers: 35, description: "Perantara bisnis keluarga Castilla" },
                recruit: { name: "🤝 **Les Recrues (Recruit)**", members: [], maxMembers: 50, description: "Recruit keluarga Castilla" }
            },
            metadata: {
                lastUpdated: Date.now(),
                version: "1.0.0",
                totalMembers: 0
            }
        };
    }
}

module.exports = StrukturManager;
