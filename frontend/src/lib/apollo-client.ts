import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import toast from 'react-hot-toast';

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
      toast.error(message);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    toast.error('Network error occurred');
  }
});

// HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:5000/graphql',
  credentials: 'include', // Send cookies
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});


