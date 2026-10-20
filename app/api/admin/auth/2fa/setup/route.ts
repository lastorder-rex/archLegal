import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { verifyAdminSession } from '@/lib/admin/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Generate 2FA secret and QR code
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get target admin ID from request body
    const body = await request.json();
    const targetAdminId = body.targetAdminId;

    if (!targetAdminId) {
      return NextResponse.json({ error: 'Target admin ID is required' }, { status: 400 });
    }

    // Get admin info
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('username, two_factor_enabled')
      .eq('id', targetAdminId)
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
