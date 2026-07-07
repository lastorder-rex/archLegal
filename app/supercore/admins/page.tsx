'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import PasswordInput from '@/components/supercore/PasswordInput';
import { Shield, ShieldOff } from 'lucide-react';
import type { AdminAccount } from '@/types/admin';

export default function AdminsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Create admin form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit admin form
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showEditNewPassword, setShowEditNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 2FA setup
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [setup2FAError, setSetup2FAError] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [currentAdminFor2FA, setCurrentAdminFor2FA] = useState<AdminAccount | null>(null);
  const [resetLinkInfo, setResetLinkInfo] = useState<{
    username: string;
    resetUrl: string;
    expiresAt: string;
    copied: boolean;
  } | null>(null);
  const [isCreatingResetLinkFor, setIsCreatingResetLinkFor] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      const response = await fetch('/api/admin/admins', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        console.error('Failed to load admins');
      }
    } catch (error) {
      console.error('Load admins error:', error);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        setIsAuthenticated(true);
        await loadAdmins();
      } else {
        router.push('/supercore');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  }, [loadAdmins, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateForm(false);
        setNewUsername('');
        setNewPassword('');
        await loadAdmins();
      } else {
        setCreateError(data.error || '관리자 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Create admin error:', error);
      setCreateError('관리자 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    // Validate password match
    if (editNewPassword !== confirmPassword) {
      setEditError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(editNewPassword)) {
      setEditError('비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/admins/${editingAdminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword: editNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingAdminId(null);
        setCurrentPassword('');
        setEditNewPassword('');
        setConfirmPassword('');
        alert('비밀번호가 변경되었습니다.');
      } else {
        setEditError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Update admin error:', error);
      setEditError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (!confirm(`정말로 "${username}" 관리자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        alert('관리자가 삭제되었습니다.');
        await loadAdmins();
      } else {
        alert(data.error || '관리자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      alert('관리자 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSetup2FA = async (admin: AdminAccount) => {
    if (admin.two_factor_enabled) {
      const shouldReset = confirm(
        `"${admin.username}" 관리자의 2FA를 재설정하시겠습니까?\n\n새 QR 코드로 인증을 완료하면 기존 Google Authenticator 코드는 더 이상 사용할 수 없습니다.`
      );

      if (!shouldReset) {
        return;
      }
    }

    setCurrentAdminFor2FA(admin);
    setSetup2FAError('');
    setIsSettingUp2FA(true);

    try {
      const response = await fetch('/api/admin/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetAdminId: admin.id })
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShow2FASetup(true);
      } else {
        alert(data.error || '2FA 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Setup 2FA error:', error);
      alert('2FA 설정 중 오류가 발생했습니다.');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetup2FAError('');
    setIsSettingUp2FA(true);

    if (!currentAdminFor2FA) {
      setSetup2FAError('관리자 정보를 찾을 수 없습니다.');
      setIsSettingUp2FA(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          secret,
          token: verifyCode,
          targetAdminId: currentAdminFor2FA.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(currentAdminFor2FA.two_factor_enabled ? '2FA가 재설정되었습니다!' : '2FA가 활성화되었습니다!');
        setShow2FASetup(false);
        setQrCode('');
        setSecret('');
        setVerifyCode('');
        setCurrentAdminFor2FA(null);
        loadAdmins();
      } else {
        setSetup2FAError(data.error || '2FA 활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      setSetup2FAError('2FA 활성화 중 오류가 발생했습니다.');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleCreate2FAResetLink = async (admin: AdminAccount) => {
    const shouldCreate = confirm(
      `"${admin.username}" 관리자에게 보낼 원격 2FA 재설정 링크를 생성하시겠습니까?\n\n기존에 발급된 미사용 링크는 폐기됩니다.`
    );

    if (!shouldCreate) {
      return;
    }

    setIsCreatingResetLinkFor(admin.id);

    try {
      const response = await fetch('/api/admin/auth/2fa/reset-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetAdminId: admin.id,
          expiresInHours: 72
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '2FA 재설정 링크 생성에 실패했습니다.');
        return;
      }

      let copied = false;
      try {
        await navigator.clipboard.writeText(data.resetUrl);
        copied = true;
      } catch {
        copied = false;
      }

      setResetLinkInfo({
        username: data.username,
        resetUrl: data.resetUrl,
        expiresAt: data.expiresAt,
        copied
      });
    } catch (error) {
      console.error('Create 2FA reset link error:', error);
      alert('2FA 재설정 링크 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingResetLinkFor(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return <AdminLoadingScreen />;
  }

  return (
    <SupercoreLayout title="관리자 계정">
      <div className="space-y-6">
        {/* 2FA Setup Modal */}
        {show2FASetup && currentAdminFor2FA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Google Authenticator {currentAdminFor2FA.two_factor_enabled ? '재설정' : '설정'}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {currentAdminFor2FA.username} 관리자의 Google Authenticator 앱으로 아래 QR 코드를 스캔하세요.
              </p>

              {qrCode && (
                <div className="mb-4 flex justify-center">
                  <Image src={qrCode} alt="QR Code" width={256} height={256} />
                </div>
              )}

              <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">수동 입력 키:</p>
                <p className="text-sm font-mono break-all">{secret}</p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verifyCode">인증 코드</Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="6자리 코드 입력"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>

                {setup2FAError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {setup2FAError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShow2FASetup(false);
                      setQrCode('');
                      setSecret('');
                      setVerifyCode('');
                      setCurrentAdminFor2FA(null);
                      setSetup2FAError('');
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isSettingUp2FA}
                  >
                    {isSettingUp2FA ? '확인 중...' : '활성화'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remote 2FA Reset Link Modal */}
        {resetLinkInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                원격 2FA 재설정 링크
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {resetLinkInfo.username} 관리자에게 아래 링크를 전달하세요. 링크를 받은 관리자는 아이디와 비밀번호 확인 후 본인 브라우저에서 QR 코드를 스캔합니다.
              </p>

              <div className="space-y-2 mb-4">
                <Label htmlFor="resetLink">재설정 링크</Label>
                <Input
                  id="resetLink"
                  value={resetLinkInfo.resetUrl}
                  readOnly
                  className="font-mono text-xs"
                  onFocus={(e) => e.target.select()}
                />
                <p className="text-xs text-slate-500">
                  만료: {formatDateTime(resetLinkInfo.expiresAt)}
                  {resetLinkInfo.copied ? ' · 클립보드에 복사됨' : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setResetLinkInfo(null)}
                >
                  닫기
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(resetLinkInfo.resetUrl);
                      setResetLinkInfo({ ...resetLinkInfo, copied: true });
                    } catch {
                      alert('자동 복사에 실패했습니다. 링크 입력칸을 선택해 직접 복사해주세요.');
                    }
                  }}
                >
                  링크 복사
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">새 관리자 생성</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">아이디</Label>
                  <Input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <PasswordInput
                    id="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="new-password"
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                  />
                </div>
              </div>

              {createError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  variant="primary"
                >
                  {isCreating ? '생성 중...' : '생성'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-slate-900 flex-[6] md:flex-[8]">
                관리자 목록 <span className="text-sm text-slate-600 font-normal">({admins.length}명)</span>
              </h2>
              <div className="flex-[4] md:flex-[2] flex justify-end">
                <Button
                  onClick={() => {
                    if (!showCreateForm) {
                      setNewUsername('');
                      setNewPassword('');
                      setCreateError('');
                    }
                    setShowCreateForm(!showCreateForm);
                  }}
                  variant="primary"
                  className="h-10 px-8 whitespace-nowrap"
                >
                  {showCreateForm ? '취소' : '+ 관리자 추가'}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoadingAdmins ? (
              <div className="text-center py-12 text-slate-600">
                관리자 목록을 불러오는 중...
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                등록된 관리자가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        아이디
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-semibold text-slate-900 sm:table-cell">
                        생성일시
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        2FA 상태
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {admins.map((admin) => (
                      <>
                        <tr key={admin.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {admin.username}
                          </td>
                          <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                            {formatDateTime(admin.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {admin.two_factor_enabled ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-green-700 min-w-[80px]">
                                  <Shield className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium whitespace-nowrap">활성화</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                                  onClick={() => handleSetup2FA(admin)}
                                >
                                  재설정
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                                  disabled={isCreatingResetLinkFor === admin.id}
                                  onClick={() => handleCreate2FAResetLink(admin)}
                                >
                                  {isCreatingResetLinkFor === admin.id ? '생성 중' : '원격 링크'}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-slate-500 min-w-[80px]">
                                  <ShieldOff className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium whitespace-nowrap">비활성화</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                                  onClick={() => handleSetup2FA(admin)}
                                >
                                  설정
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                                  disabled={isCreatingResetLinkFor === admin.id}
                                  onClick={() => handleCreate2FAResetLink(admin)}
                                >
                                  {isCreatingResetLinkFor === admin.id ? '생성 중' : '원격 링크'}
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-16"
                                onClick={() => {
                                  setEditingAdminId(admin.id);
                                  setCurrentPassword('');
                                  setEditNewPassword('');
                                  setConfirmPassword('');
                                  setEditError('');
                                }}
                              >
                                편집
                              </Button>
                              {admin.username !== 'rex' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-16 text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                                >
                                  삭제
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {editingAdminId === admin.id && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 bg-slate-50">
                              <form onSubmit={handleEditAdmin} className="space-y-4">
                                <h4 className="font-semibold text-slate-900 mb-3">
                                  비밀번호 변경 - {admin.username}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="currentPassword">기존 비밀번호</Label>
                                    <PasswordInput
                                      id="currentPassword"
                                      value={currentPassword}
                                      onChange={(e) => setCurrentPassword(e.target.value)}
                                      placeholder="기존 비밀번호"
                                      show={showCurrentPassword}
                                      onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editNewPassword">신규 비밀번호</Label>
                                    <PasswordInput
                                      id="editNewPassword"
                                      value={editNewPassword}
                                      onChange={(e) => setEditNewPassword(e.target.value)}
                                      placeholder="신규 비밀번호"
                                      show={showEditNewPassword}
                                      onToggle={() => setShowEditNewPassword(!showEditNewPassword)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">신규 비밀번호 확인</Label>
                                    <PasswordInput
                                      id="confirmPassword"
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      placeholder="신규 비밀번호 확인"
                                      show={showConfirmPassword}
                                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                  </div>
                                </div>

                                <div className="text-xs text-slate-600">
                                  * 비밀번호는 영문 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 각각 하나 이상 포함해야 합니다.
                                </div>

                                {editError && (
                                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                    {editError}
                                  </div>
                                )}

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    onClick={() => setEditingAdminId(null)}
                                    variant="outline"
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    variant="primary"
                                  >
                                    {isUpdating ? '저장 중...' : '저장'}
                                  </Button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </SupercoreLayout>
  );
}
