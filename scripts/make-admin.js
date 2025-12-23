const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const user = await prisma.user.update({
            where: { username: 'admin' },
            data: { role: 'ADMIN' },
        });
        console.log(`✅ User '${user.username}' is now an ADMIN!`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
