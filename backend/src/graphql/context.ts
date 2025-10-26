import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Context {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  prisma: PrismaClient;
}

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return { prisma };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    return {
      user: user || undefined,
      prisma,
    };
  } catch (error) {
    return { prisma };
  }
}


