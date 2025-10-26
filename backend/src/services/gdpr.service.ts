import { PrismaClient } from '@prisma/client';
import { encryptionService } from './encryption.service';

const prisma = new PrismaClient();

/**
 * GDPR Compliance Service
 */
class GDPRService {
  /**
   * Kullanıcı verilerini dışa aktar (Right to Data Portability)
   */
  async exportUserData(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          sales: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              customer: true,
            },
          },
          stockMovements: true,
          expenses: true,
          activityLogs: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Hassas bilgileri çıkar
      const exportData = {
        personalInfo: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        activities: {
          sales: user.sales.map(sale => ({
            id: sale.id,
            total: sale.total,
            date: sale.createdAt,
            itemsCount: sale.items.length,
          })),
          stockMovements: user.stockMovements.map(sm => ({
            id: sm.id,
            type: sm.type,
            quantity: sm.quantity,
            date: sm.createdAt,
          })),
          expenses: user.expenses.map(exp => ({
            id: exp.id,
            amount: exp.amount,
            description: exp.description,
            date: exp.date,
          })),
          activityLogs: user.activityLogs.map(log => ({
            action: log.action,
            date: log.createdAt,
            details: log.details,
          })),
        },
      };

      return exportData;
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıyı anonimleştir (Right to be Forgotten - Partial)
   */
  async anonymizeUser(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Kullanıcı bilgilerini anonimleştir
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: encryptionService.anonymizeEmail(user.email),
          name: encryptionService.anonymizeName(user.name),
          password: 'ANONYMIZED',
        },
      });

      // Activity logs'u temizle
      await prisma.activityLog.deleteMany({
        where: { userId },
      });

      return { success: true, message: 'User anonymized' };
    } catch (error) {
      console.error('Anonymize user error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıyı tamamen sil (Right to be Forgotten - Full)
   */
  async deleteUser(userId: number) {
    try {
      // Cascade delete için önce ilişkili kayıtları sil
      await prisma.activityLog.deleteMany({ where: { userId } });
      await prisma.stockMovement.deleteMany({ where: { userId } });
      await prisma.expense.deleteMany({ where: { userId } });
      
      // Satışları anonimleştir (silme, history için sakla)
      await prisma.sale.updateMany({
        where: { userId },
        data: { userId: null as any },
      });

      // Kullanıcıyı sil
      await prisma.user.delete({
        where: { id: userId },
      });

      return { success: true, message: 'User deleted' };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Müşteri verilerini dışa aktar
   */
  async exportCustomerData(customerId: number) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          sales: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return {
        personalInfo: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: customer.createdAt,
        },
        purchaseHistory: customer.sales.map(sale => ({
          id: sale.id,
          total: sale.total,
          date: sale.createdAt,
          items: sale.items.map(item => ({
            product: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
      };
    } catch (error) {
      console.error('Export customer data error:', error);
      throw error;
    }
  }

  /**
   * Müşteriyi anonimleştir
   */
  async anonymizeCustomer(customerId: number) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      await prisma.customer.update({
        where: { id: customerId },
        data: {
          name: encryptionService.anonymizeName(customer.name),
          email: customer.email ? encryptionService.anonymizeEmail(customer.email) : null,
          phone: customer.phone ? encryptionService.anonymizePhone(customer.phone) : null,
          address: 'ANONYMIZED',
        },
      });

      return { success: true, message: 'Customer anonymized' };
    } catch (error) {
      console.error('Anonymize customer error:', error);
      throw error;
    }
  }

  /**
   * Consent (Rıza) kaydı oluştur
   */
  async recordConsent(userId: number, consentType: string, granted: boolean) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: `CONSENT_${consentType.toUpperCase()}`,
          details: JSON.stringify({
            granted,
            timestamp: new Date(),
          }),
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Record consent error:', error);
      throw error;
    }
  }

  /**
   * Eski verileri temizle (Data Retention)
   */
  async cleanOldData(retentionDays: number = 365 * 2) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Eski activity logs'u sil
      const deletedLogs = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        success: true,
        deletedLogs: deletedLogs.count,
      };
    } catch (error) {
      console.error('Clean old data error:', error);
      throw error;
    }
  }
}

export const gdprService = new GDPRService();


