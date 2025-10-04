'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';

interface Admin {
  id: string;
  username: string;
  created_at: string;
  two_factor_enabled: boolean;
}

export default function AdminsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
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
  const [currentAdminFor2FA, setCurrentAdminFor2FA] = useState<Admin | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadAdmins();
      } else {
        router.push('/supercore');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdmins = async () => {
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
  };

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
        loadAdmins();
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
        loadAdmins();
      } else {
        alert(data.error || '관리자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      alert('관리자 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSetup2FA = async (admin: Admin) => {
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
        alert('2FA가 활성화되었습니다!');
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

  const handleDisable2FA = async (admin: Admin) => {
    const password = prompt(`"${admin.username}"의 2FA를 비활성화하려면 비밀번호를 입력하세요:`);
    if (!password) return;

    try {
      const response = await fetch('/api/admin/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('2FA가 비활성화되었습니다.');
        loadAdmins();
      } else {
        alert(data.error || '2FA 비활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      alert('2FA 비활성화 중 오류가 발생했습니다.');
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
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <SupercoreLayout title="관리자 계정">
      <div className="space-y-6">
        {/* 2FA Setup Modal */}
        {show2FASetup && currentAdminFor2FA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Google Authenticator 설정
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Google Authenticator 앱으로 아래 QR 코드를 스캔하세요.
              </p>

              {qrCode && (
                <div className="mb-4 flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
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
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(admin.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {admin.two_factor_enabled ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  활성화
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => handleDisable2FA(admin)}
                                >
                                  비활성화
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  비활성화
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleSetup2FA(admin)}
                                >
                                  설정
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
                                    <div className="relative">
                                      <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="기존 비밀번호"
                                        required
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                      >
                                        {showCurrentPassword ? (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editNewPassword">신규 비밀번호</Label>
                                    <div className="relative">
                                      <Input
                                        id="editNewPassword"
                                        type={showEditNewPassword ? "text" : "password"}
                                        value={editNewPassword}
                                        onChange={(e) => setEditNewPassword(e.target.value)}
                                        placeholder="신규 비밀번호"
                                        required
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowEditNewPassword(!showEditNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                      >
                                        {showEditNewPassword ? (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">신규 비밀번호 확인</Label>
                                    <div className="relative">
                                      <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="신규 비밀번호 확인"
                                        required
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                      >
                                        {showConfirmPassword ? (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
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
