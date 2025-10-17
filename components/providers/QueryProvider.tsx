'use client';

import { ReactNode, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryClientConfig
} from '@tanstack/react-query';

type QueryProviderProps = {
  children: ReactNode;
  clientConfig?: QueryClientConfig;
};

export default function QueryProvider({ children, clientConfig }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 30,
            ...clientConfig?.defaultOptions?.queries
          },
          mutations: {
            retry: 1,
            ...clientConfig?.defaultOptions?.mutations
          }
        },
        ...clientConfig
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
