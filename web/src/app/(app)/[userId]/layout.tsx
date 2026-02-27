import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { publicId: userId },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  return <>{children}</>;
}
