import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import express from 'express';

export async function createApolloServer(app: express.Application) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Development için
  });

  await server.start();

  // GraphQL endpoint
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: any) => createContext({ req }),
    })
  );

  console.log('🚀 GraphQL Server ready at /graphql');
}

