import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, platform } = body;

    console.log('🔄 Exchange request received');
    console.log('📍 Platform:', platform);
    console.log('🔑 Token length:', token?.length);

    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Verify unified token
    console.log('🔍 Verifying token...');
    let payload;
    try {
      payload = verifyToken(token);
      console.log('✅ Token verified successfully');
      console.log('👤 User:', payload.email);
      console.log('🎯 Platforms in token:', payload.platforms);
    } catch (verifyError: any) {
      console.error('❌ Token verification failed:', verifyError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid token: ' + verifyError.message },
        { status: 401, headers: corsHeaders() }
      );
    }

    if (platform === 'freelancer') {
      if (!payload.platforms?.freelancer) {
        console.error('❌ No freelancer platform in token');
        return NextResponse.json(
          { success: false, message: 'User does not have freelancer access' },
          { status: 403, headers: corsHeaders() }
        );
      }

      console.log('✅ Freelancer access granted');
      return NextResponse.json({
        success: true,
        user_id: payload.platforms.freelancer,
        email: payload.email
      }, { headers: corsHeaders() });
    }

    if (platform === 'career_copilot') {
      if (!payload.platforms?.career_copilot) {
        console.error('❌ No career_copilot platform in token');
        return NextResponse.json(
          { success: false, message: 'User does not have career copilot access' },
          { status: 403, headers: corsHeaders() }
        );
      }

      console.log('✅ Career Copilot access granted');
      return NextResponse.json({
        success: true,
        user_id: payload.platforms.career_copilot,
        email: payload.email
      }, { headers: corsHeaders() });
    }

    console.error('❌ Unknown platform:', platform);
    return NextResponse.json(
      { success: false, message: 'Unknown platform: ' + platform },
      { status: 404, headers: corsHeaders() }
    );

  } catch (error: any) {
    console.error('❌ Exchange error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}