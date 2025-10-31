import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const listUsers = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', search = '', tenantId } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (tenantId) {
      where.tenantId = tenantId as string;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUser = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { email, password, name, role, tenantId, branchId, isActive } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password with bcrypt
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'CASHIER',
        tenantId: tenantId || null,
        branchId: branchId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({ user });
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, role, tenantId, branchId, isActive, password } = req.body;

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (tenantId !== undefined) updateData.tenantId = tenantId;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      const bcrypt = (await import('bcryptjs')).default;
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            shifts: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has related data
    if (user._count.sales > 0 || user._count.shifts > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing sales or shifts',
        details: {
          sales: user._count.sales,
          shifts: user._count.shifts,
        },
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

