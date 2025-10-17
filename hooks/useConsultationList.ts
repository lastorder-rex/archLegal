import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { z } from 'zod';
import { consultationsResponseSchema } from '@/lib/validations/consultation';

type UseConsultationListOptions<T> = {
  initialData?: T[];
  endpoint?: string;
  schema?: z.ZodType<T[]>;
  queryKey?: QueryKey;
  onUnauthorized?: () => void;
};

type UseConsultationListResult<T> = {
  data: T[];
  setData: (updater: T[] | ((prev: T[]) => T[])) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<T[] | null>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useConsultationList<T extends { id: string }>(
  options: UseConsultationListOptions<T> = {}
): UseConsultationListResult<T> {
  const {
    initialData = [],
    endpoint = '/api/consultations',
    schema,
    queryKey,
    onUnauthorized
  } = options;

  const queryClient = useQueryClient();
  const [manualError, setManualError] = useState<string | null>(null);

  const parseItems = useCallback(
    (raw: unknown): T[] => {
      const target = Array.isArray(raw) ? raw : [];
      if (schema) {
        return schema.parse(target);
      }
      const parsed = consultationsResponseSchema.parse({ consultations: target }).consultations;
      return parsed as unknown as T[];
    },
    [schema]
  );

  const fetchConsultations = useCallback(async () => {
    const response = await fetch(endpoint, { credentials: 'include' });

    if (response.status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      const error = new Error('로그인이 필요합니다.');
      (error as any).status = 401;
      throw error;
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const message = json?.error || '상담 내역을 불러오지 못했습니다.';
      throw new Error(message);
    }

    const json = await response.json();
    return parseItems(json?.consultations ?? []);
  }, [endpoint, onUnauthorized, parseItems]);

  const resolvedQueryKey: QueryKey = queryKey ?? ['consultations', endpoint];

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch
  } = useQuery<T[]>({
    queryKey: resolvedQueryKey,
    queryFn: fetchConsultations,
    initialData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30
  });

  const setData = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      queryClient.setQueryData<T[]>(resolvedQueryKey, prev => {
        const previous = prev ?? [];
        if (typeof updater === 'function') {
          return (updater as (value: T[]) => T[])(previous);
        }
        return updater;
      });
    },
    [queryClient, resolvedQueryKey]
  );

  const refresh = useCallback(async () => {
    setManualError(null);
    const result = await refetch();
    if (result.error) {
      const message =
        result.error instanceof Error
          ? result.error.message
          : '상담 내역을 불러오지 못했습니다.';
      setManualError(message);
      return null;
    }
    return result.data ?? null;
  }, [refetch]);

  const normalizedError =
    manualError ??
    (error
      ? error instanceof Error
        ? error.message
        : '상담 내역을 불러오지 못했습니다.'
      : null);

  return useMemo(
    () => ({
      data: data ?? [],
      setData,
      loading: isLoading || isFetching,
      error: normalizedError,
      refresh,
      setError: setManualError
    }),
    [data, isLoading, isFetching, normalizedError, refresh, setData]
  );
}
