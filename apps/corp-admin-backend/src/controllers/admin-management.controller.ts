import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

export const listAdmins = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [admins, total] = await Promise.all([
      prisma.corpAdmin.findMany({
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.corpAdmin.count(),
    ]);

    res.json({
      admins,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const createAdmin = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await prisma.corpAdmin.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.corpAdmin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'CORP_SUPPORT',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'CREATE',
      resource: 'ADMIN',
      resourceId: admin.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ admin });
  } catch (error: any) {
    console.error('Create admin error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

export const updateAdmin = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, role, isActive, password } = req.body;

    const before = await prisma.corpAdmin.findUnique({ where: { id } });
    if (!before) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.corpAdmin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'UPDATE',
      resource: 'ADMIN',
      resourceId: id,
      ipAddress: req.ip,
    });

    res.json({ admin });
  } catch (error: any) {
    console.error('Update admin error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update admin' });
  }
};

export const deleteAdmin = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await prisma.corpAdmin.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await prisma.corpAdmin.delete({ where: { id } });

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'DELETE',
      resource: 'ADMIN',
      resourceId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
};

