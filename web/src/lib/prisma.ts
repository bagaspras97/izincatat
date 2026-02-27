import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Resolve publicId (CUID dari URL) → internal integer userId.
 * Return undefined jika tidak ditemukan.
 */
export async function resolveUserId(publicId: string | null | undefined): Promise<number | undefined> {
  if (!publicId) return undefined;
  const user = await prisma.user.findUnique({
    where: { publicId },
    select: { id: true },
  });
  return user?.id;
}

export default prisma;
