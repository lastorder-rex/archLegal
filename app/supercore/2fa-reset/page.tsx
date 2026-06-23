'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'identify' | 'scan' | 'complete';

export default function TwoFactorResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [step, setStep] = useState<Step>('identify');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrepare = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('재설정 링크가 유효하지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/2fa/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          token,
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '본인 확인에 실패했습니다.');
        return;
      }

      setQrCode(data.qrCode);
      setManualEntryKey(data.manualEntryKey);
      setPassword('');
      setStep('scan');
    } catch (prepareError) {
      console.error('2FA reset prepare error:', prepareError);
      setError('2FA 재설정 준비 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/2fa/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          token,
          code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '인증 코드 확인에 실패했습니다.');
        return;
      }

      setStep('complete');
    } catch (confirmError) {
      console.error('2FA reset confirm error:', confirmError);
      setError('2FA 재설정 완료 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">관리자 2FA 재설정</h1>
          <p className="mt-2 text-sm text-slate-600">
            관리자에게 받은 링크로 Google Authenticator를 다시 설정합니다.
          </p>
        </div>

        {!token ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            재설정 링크가 유효하지 않습니다.
          </div>
        ) : step === 'identify' ? (
          <form onSubmit={handlePrepare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? '확인 중...' : '본인 확인'}
            </Button>
          </form>
        ) : step === 'scan' ? (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Google Authenticator 앱에서 QR 코드를 스캔한 뒤 6자리 코드를 입력하세요.
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <Image src={qrCode} alt="QR Code" width={256} height={256} />
              </div>
            )}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1 text-xs text-slate-600">수동 입력 키</p>
              <p className="break-all font-mono text-sm text-slate-900">{manualEntryKey}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">인증 코드</Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? '확인 중...' : '2FA 재설정 완료'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              2FA가 재설정되었습니다. 이제 새 Google Authenticator 코드로 로그인할 수 있습니다.
            </div>
            <Button type="button" variant="primary" onClick={() => router.push('/supercore')}>
              로그인 화면으로 이동
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
