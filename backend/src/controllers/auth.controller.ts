import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Kullanıcı var mı kontrol et
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tenant oluştur ve kullanıcıyı ADMIN olarak bağla, 7 günlük trial
    const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: email.split('@')[0] } });
      const u = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          tenantId: tenant.id,
          trialEndsAt: trialEnds
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
      await tx.license.create({ data: { tenantId: tenant.id, status: 'ACTIVE', plan: 'STANDARD', trial: true, trialEndsAt: trialEnds } });
      return u;
    });

    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu', user: result });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt işlemi başarısız' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    // Aktif mi kontrol et
    if (!user.isActive) {
      return res.status(403).json({ error: 'Hesabınız devre dışı' });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' as any }
    );

    // Cookie'ye token ekle
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    });

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Çıkış başarılı' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı' });
  }
};


