import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilemedi' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Kullanıcı getirilemedi' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'Kullanıcı başarıyla güncellendi', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Şifre güncellenemedi' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
};


