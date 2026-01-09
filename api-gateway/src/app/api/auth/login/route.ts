import { NextRequest, NextResponse } from 'next/server';
import { masterDB } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password required' },
        { status: 400 }
      );
    }

    // Get user from master DB
    const { data: user, error } = await masterDB
      .from('unified_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get platform links
    const { data: links } = await masterDB
      .from('user_platform_links')
      .select('platform, platform_user_id')
      .eq('unified_user_id', user.id);

    const platforms: any = {};
    links?.forEach(link => {
      platforms[link.platform] = link.platform_user_id;
    });

    // Update last login
    await masterDB
      .from('unified_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      platforms
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          platforms: Object.keys(platforms),
          has_freelancer_profile: user.has_freelancer_profile,
          has_learning_profile: user.has_learning_profile
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}