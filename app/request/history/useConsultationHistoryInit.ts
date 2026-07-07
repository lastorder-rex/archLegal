import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseConsultationHistoryInitParams {
  refreshConsultations: () => Promise<unknown>;
  consultationsError: string | null;
  setConsultationsError: (message: string | null) => void;
}

export function useConsultationHistoryInit({
  refreshConsultations,
  consultationsError,
  setConsultationsError,
}: UseConsultationHistoryInitParams) {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setPageError(null);
        setConsultationsError(null);

        const userResponse = await fetch('/api/user/me', {
          credentials: 'include'
        });

        if (userResponse.status === 401) {
          if (!cancelled) {
            setPageError('로그인이 필요합니다.');
            router.push('/login?redirect=/request/history');
          }
          return;
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (!cancelled) {
            setUser({ id: userData.user_id });
          }
        }

        await refreshConsultations();
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : '상담 내역을 가져오지 못했습니다.';
          setPageError(message);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    initialize().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [refreshConsultations, router, setConsultationsError]);

  useEffect(() => {
    if (consultationsError) {
      setPageError(consultationsError);
    }
  }, [consultationsError]);

  return { initializing, pageError, user };
}
