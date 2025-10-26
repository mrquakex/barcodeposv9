import gql from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar DateTime

  # User type
  type User {
    id: Int!
    email: String!
    name: String!
    role: String!
    createdAt: DateTime!
  }

  # Product type
  type Product {
    id: Int!
    name: String!
    barcode: String!
    price: Float!
    costPrice: Float
    stock: Int!
    minStock: Int
    description: String
    category: Category
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Category type
  type Category {
    id: Int!
    name: String!
    description: String
    products: [Product!]!
  }

  # Sale type
  type Sale {
    id: Int!
    total: Float!
    discount: Float
    paymentMethod: String!
    customer: Customer
    items: [SaleItem!]!
    createdAt: DateTime!
  }

  # Sale Item type
  type SaleItem {
    id: Int!
    quantity: Int!
    price: Float!
    product: Product!
  }

  # Customer type
  type Customer {
    id: Int!
    name: String!
    email: String
    phone: String
    address: String
    sales: [Sale!]!
  }

  # Statistics type
  type DashboardStats {
    totalSales: Float!
    totalOrders: Int!
    totalCustomers: Int!
    lowStockProducts: Int!
    todaySales: Float!
    monthlySales: Float!
  }

  # Sales Chart Data
  type SalesChartData {
    date: String!
    sales: Float!
  }

  # Queries
  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: Int!): User

    # Product queries
    products(
      limit: Int
      offset: Int
      search: String
      categoryId: Int
    ): [Product!]!
    product(id: Int!): Product
    productByBarcode(barcode: String!): Product
    lowStockProducts: [Product!]!

    # Category queries
    categories: [Category!]!
    category(id: Int!): Category

    # Sale queries
    sales(
      limit: Int
      offset: Int
      startDate: DateTime
      endDate: DateTime
    ): [Sale!]!
    sale(id: Int!): Sale

    # Customer queries
    customers(limit: Int, offset: Int): [Customer!]!
    customer(id: Int!): Customer

    # Dashboard queries
    dashboardStats: DashboardStats!
    salesChart(days: Int): [SalesChartData!]!
  }

  # Mutations
  type Mutation {
    # Product mutations
    createProduct(
      name: String!
      barcode: String!
      price: Float!
      costPrice: Float
      stock: Int!
      minStock: Int
      categoryId: Int
      description: String
    ): Product!

    updateProduct(
      id: Int!
      name: String
      price: Float
      stock: Int
      minStock: Int
      description: String
    ): Product!

    deleteProduct(id: Int!): Boolean!

    # Sale mutations
    createSale(
      items: [SaleItemInput!]!
      customerId: Int
      discount: Float
      paymentMethod: String!
    ): Sale!

    # Customer mutations
    createCustomer(
      name: String!
      email: String
      phone: String
      address: String
    ): Customer!

    updateCustomer(
      id: Int!
      name: String
      email: String
      phone: String
      address: String
    ): Customer!

    deleteCustomer(id: Int!): Boolean!
  }

  # Input types
  input SaleItemInput {
    productId: Int!
    quantity: Int!
    price: Float!
  }

  # Subscriptions (Real-time updates)
  type Subscription {
    saleCreated: Sale!
    stockUpdated: Product!
    lowStockAlert: Product!
  }
`;


