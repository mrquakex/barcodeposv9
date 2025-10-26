import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    // User queries
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return context.user;
    },

    users: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return prisma.user.findMany();
    },

    user: async (_: any, { id }: { id: number }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }
      return prisma.user.findUnique({ where: { id } });
    },

    // Product queries
    products: async (
      _: any,
      { limit = 50, offset = 0, search, categoryId }: any
    ) => {
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { barcode: { contains: search } },
        ];
      }
      
      if (categoryId) {
        where.categoryId = categoryId;
      }

      return prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    product: async (_: any, { id }: { id: number }) => {
      return prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });
    },

    productByBarcode: async (_: any, { barcode }: { barcode: string }) => {
      return prisma.product.findUnique({
        where: { barcode },
        include: { category: true },
      });
    },

    lowStockProducts: async () => {
      return prisma.product.findMany({
        where: {
          stock: {
            lte: prisma.product.fields.minStock,
          },
        },
        include: { category: true },
      });
    },

    // Category queries
    categories: async () => {
      return prisma.category.findMany({
        include: { products: true },
      });
    },

    category: async (_: any, { id }: { id: number }) => {
      return prisma.category.findUnique({
        where: { id },
        include: { products: true },
      });
    },

    // Sale queries
    sales: async (
      _: any,
      { limit = 50, offset = 0, startDate, endDate }: any
    ) => {
      const where: any = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      return prisma.sale.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    sale: async (_: any, { id }: { id: number }) => {
      return prisma.sale.findUnique({
        where: { id },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });
    },

    // Customer queries
    customers: async (_: any, { limit = 50, offset = 0 }: any) => {
      return prisma.customer.findMany({
        take: limit,
        skip: offset,
        include: { sales: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    customer: async (_: any, { id }: { id: number }) => {
      return prisma.customer.findUnique({
        where: { id },
        include: { sales: true },
      });
    },

    // Dashboard queries
    dashboardStats: async () => {
      const [totalSales, totalOrders, totalCustomers, lowStockCount] = await Promise.all([
        prisma.sale.aggregate({
          _sum: { total: true },
        }),
        prisma.sale.count(),
        prisma.customer.count(),
        prisma.product.count({
          where: {
            stock: { lte: 10 }, // minStock yerine sabit değer
          },
        }),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySalesData = await prisma.sale.aggregate({
        where: {
          createdAt: { gte: today },
        },
        _sum: { total: true },
      });

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlySalesData = await prisma.sale.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth },
        },
        _sum: { total: true },
      });

      return {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        totalCustomers,
        lowStockProducts: lowStockCount,
        todaySales: todaySalesData._sum.total || 0,
        monthlySales: monthlySalesData._sum.total || 0,
      };
    },

    salesChart: async (_: any, { days = 7 }: { days: number }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          total: true,
          createdAt: true,
        },
      });

      // Günlük bazda grupla
      const grouped: Record<string, number> = {};
      sales.forEach((sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + sale.total;
      });

      return Object.entries(grouped).map(([date, sales]) => ({
        date,
        sales,
      }));
    },
  },

  Mutation: {
    // Product mutations
    createProduct: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return prisma.product.create({
        data: {
          name: args.name,
          barcode: args.barcode,
          price: args.price,
          costPrice: args.costPrice,
          stock: args.stock,
          minStock: args.minStock || 10,
          description: args.description,
          categoryId: args.categoryId,
        },
        include: { category: true },
      });
    },

    updateProduct: async (_: any, { id, ...data }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return prisma.product.update({
        where: { id },
        data,
        include: { category: true },
      });
    },

    deleteProduct: async (_: any, { id }: { id: number }, context: any) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError('Not authorized');
      }

      await prisma.product.delete({ where: { id } });
      return true;
    },

    // Sale mutations
    createSale: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const sale = await prisma.sale.create({
        data: {
          total: args.items.reduce((sum: number, item: any) => 
            sum + (item.price * item.quantity), 0
          ),
          discount: args.discount || 0,
          paymentMethod: args.paymentMethod,
          customerId: args.customerId,
          userId: context.user.id,
          items: {
            create: args.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });

      // Stok güncelle
      for (const item of args.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    },

    // Customer mutations
    createCustomer: async (_: any, args: any) => {
      return prisma.customer.create({
        data: args,
      });
    },

    updateCustomer: async (_: any, { id, ...data }: any) => {
      return prisma.customer.update({
        where: { id },
        data,
      });
    },

    deleteCustomer: async (_: any, { id }: { id: number }, context: any) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError('Not authorized');
      }

      await prisma.customer.delete({ where: { id } });
      return true;
    },
  },
};


