import { NextRequest, NextResponse } from 'next/server';
import { masterDB, freelancerDB, careerDB } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    const userId = payload.userId;

    // Get unified user from master DB
    const { data: unifiedUser, error: userError } = await masterDB
      .from('unified_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !unifiedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get platform links
    const { data: links } = await masterDB
      .from('user_platform_links')
      .select('platform, platform_user_id')
      .eq('unified_user_id', userId);

    const platforms: any = {};
    links?.forEach(link => {
      platforms[link.platform] = link.platform_user_id;
    });

    // Fetch Freelancer data
    let freelancerData = null;
    if (platforms.freelancer) {
      const { data: profile } = await freelancerDB
        .from('profiles')
        .select('*')
        .eq('id', platforms.freelancer)
        .single();
      
      const { data: freelancerProfile } = await freelancerDB
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', platforms.freelancer)
        .maybeSingle();

      freelancerData = {
        profile,
        freelancerProfile
      };
    }

    // Fetch Career Copilot data
    let careerData = null;
    if (platforms.career_copilot) {
      const { data: profile } = await careerDB
        .from('user_profiles')
        .select('*')
        .eq('id', platforms.career_copilot)
        .single();
      
      const { data: learningPlans } = await careerDB
        .from('learning_plans')
        .select('*')
        .eq('user_id', platforms.career_copilot);

      careerData = {
        profile,
        learningPlans: learningPlans || []
      };
    }

    // Build unified response
    return NextResponse.json({
      success: true,
      data: {
        identity: {
          id: unifiedUser.id,
          email: unifiedUser.email,
          full_name: unifiedUser.full_name,
          phone: unifiedUser.phone,
          created_at: unifiedUser.created_at,
          last_login_at: unifiedUser.last_login_at
        },
        platforms: {
          freelancer: {
            active: unifiedUser.has_freelancer_profile,
            data: freelancerData
          },
          career_copilot: {
            active: unifiedUser.has_learning_profile,
            data: careerData
          }
        },
        stats: {
          active_platforms: Object.keys(platforms),
          total_platforms: 2
        }
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}