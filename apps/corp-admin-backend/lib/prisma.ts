// Control Plane backend uses Prisma client from main backend (same DB)
// Note: Run 'npm run prisma:generate' first, or ensure @prisma/client is installed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

