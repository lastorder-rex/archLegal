import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate 2FA secret and QR code
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify admin authentication
    const adminCookie = cookieStore.get('admin_session');
    if (!adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse admin cookie to get admin ID
    let adminId;
    try {
      const cookieData = JSON.parse(adminCookie.value);
      adminId = cookieData.adminId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get admin info
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('username, two_factor_enabled')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ArchLegal Admin (${admin.username})`,
      issuer: 'ArchLegal'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Return secret and QR code (secret will be saved only after verification)
    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('Error in POST /api/admin/auth/2fa/setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
