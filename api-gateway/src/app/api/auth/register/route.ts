import { NextRequest, NextResponse } from 'next/server';
import { masterDB, freelancerDB, careerDB } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, platform } = body;

    // Validation
    if (!email || !password || !full_name || !platform) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['freelancer', 'career_copilot', 'both'].includes(platform)) {
      return NextResponse.json(
        { success: false, message: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await masterDB
      .from('unified_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create unified user
    const { data: unifiedUser, error: createError } = await masterDB
      .from('unified_users')
      .insert({
        email,
        full_name,
        password_hash: passwordHash,
        has_freelancer_profile: platform === 'freelancer' || platform === 'both',
        has_learning_profile: platform === 'career_copilot' || platform === 'both',
        email_verified: true // Auto-verify for demo
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }

    const platforms: any = {};

    // Create platform-specific profiles
    if (platform === 'freelancer' || platform === 'both') {
      // Create Supabase Auth user in Freelancer
      const { data: authData, error: authError } = await freelancerDB.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (!authError && authData.user) {
        // Create profile
        await freelancerDB.from('profiles').insert({
          id: authData.user.id,
          email,
          first_name: full_name.split(' ')[0],
          last_name: full_name.split(' ').slice(1).join(' ') || '',
          user_type: 'freelancer',
          unified_user_id: unifiedUser.id
        });

        // Link platform
        await masterDB.from('user_platform_links').insert({
          unified_user_id: unifiedUser.id,
          platform: 'freelancer',
          platform_user_id: authData.user.id,
          is_primary: true
        });

        platforms.freelancer = authData.user.id;
      }
    }

    if (platform === 'career_copilot' || platform === 'both') {
      // Create Supabase Auth user in Career Copilot
      const { data: authData, error: authError } = await careerDB.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (!authError && authData.user) {
        // Create profile
        await careerDB.from('user_profiles').insert({
          id: authData.user.id,
          full_name,
          unified_user_id: unifiedUser.id
        });

        // Link platform
        await masterDB.from('user_platform_links').insert({
          unified_user_id: unifiedUser.id,
          platform: 'career_copilot',
          platform_user_id: authData.user.id,
          is_primary: platform === 'career_copilot'
        });

        platforms.career_copilot = authData.user.id;
      }
    }

    // Generate JWT
    const token = signToken({
      userId: unifiedUser.id,
      email: unifiedUser.email,
      platforms
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: unifiedUser.id,
          email: unifiedUser.email,
          full_name: unifiedUser.full_name,
          platforms: Object.keys(platforms)
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}