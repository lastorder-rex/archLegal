'use client';

import { createContext, useContext } from 'react';
import type { MyPageContextValue } from '@/types/mypage';

const MyPageContext = createContext<MyPageContextValue | null>(null);

type MyPageProviderProps = {
  value: MyPageContextValue;
  children: React.ReactNode;
};

export function MyPageProvider({ value, children }: MyPageProviderProps) {
  return <MyPageContext.Provider value={value}>{children}</MyPageContext.Provider>;
}

export function useMyPageContext() {
  const context = useContext(MyPageContext);
  if (!context) {
    throw new Error('useMyPageContext must be used within a MyPageProvider');
  }
  return context;
}
