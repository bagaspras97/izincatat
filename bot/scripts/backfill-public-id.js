/**
 * Backfill publicId untuk user yang belum punya.
 * Dijalankan sekali setelah menambah kolom public_id ke tabel users.
 */
const { createId } = require('@paralleldrive/cuid2');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { publicId: null } });
  console.log(`Users to backfill: ${users.length}`);

  for (const u of users) {
    const pid = createId();
    await prisma.user.update({
      where: { id: u.id },
      data: { publicId: pid },
    });
    console.log(`  User #${u.id} → ${pid}`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
