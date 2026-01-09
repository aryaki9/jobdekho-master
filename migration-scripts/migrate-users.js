require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
const masterDB = createClient(
  process.env.MASTER_URL,
  process.env.MASTER_SERVICE_KEY
);

const freelancerDB = createClient(
  process.env.FREELANCER_URL,
  process.env.FREELANCER_SERVICE_KEY
);

const careerDB = createClient(
  process.env.CAREER_URL,
  process.env.CAREER_SERVICE_KEY
);

async function migrateUsers() {
  console.log('🚀 Starting user migration...\n');

  try {
    // Step 1: Get all users from Freelancer
    console.log('📊 Fetching Freelancer users...');
    const { data: freelancerUsers, error: freelancerError } = await freelancerDB
      .from('profiles')
      .select('id, email, first_name, last_name, phone, created_at');

    if (freelancerError) {
      console.error('❌ Error fetching Freelancer users:', freelancerError);
      return;
    }

    console.log(`✅ Found ${freelancerUsers.length} Freelancer users\n`);

    // Step 2: Get all users from Career Copilot
    console.log('📊 Fetching Career Copilot users...');
    const { data: careerUsers, error: careerError } = await careerDB
      .from('user_profiles')
      .select('id, full_name, current_role, target_role, created_at');

    if (careerError) {
      console.error('❌ Error fetching Career Copilot users:', careerError);
      return;
    }

    console.log(`✅ Found ${careerUsers.length} Career Copilot users\n`);

    // Step 3: Migrate Freelancer users
    console.log('🔄 Migrating Freelancer users to Master DB...\n');

    for (const user of freelancerUsers) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
      const email = user.email || `freelancer_${user.id}@placeholder.com`;

      try {
        // Check if user already exists in master DB
        const { data: existing } = await masterDB
          .from('unified_users')
          .select('id')
          .eq('email', email)
          .single();

        let unifiedUserId;

        if (existing) {
          console.log(`⏭️  User already exists: ${email}`);
          unifiedUserId = existing.id;
        } else {
          // Create unified user
          const { data: newUser, error: createError } = await masterDB
            .from('unified_users')
            .insert({
              email: email,
              full_name: fullName,
              phone: user.phone,
              has_freelancer_profile: true,
              created_at: user.created_at
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ Error creating user ${email}:`, createError.message);
            continue;
          }

          unifiedUserId = newUser.id;
          console.log(`✅ Created unified user: ${email} (${unifiedUserId})`);
        }

        // Create platform link
        const { error: linkError } = await masterDB
          .from('user_platform_links')
          .insert({
            unified_user_id: unifiedUserId,
            platform: 'freelancer',
            platform_user_id: user.id,
            is_primary: true
          });

        if (linkError && linkError.code !== '23505') { // Ignore duplicate key errors
          console.error(`❌ Error linking user:`, linkError.message);
          continue;
        }

        // Update Freelancer profile with unified_user_id
        const { error: updateError } = await freelancerDB
          .from('profiles')
          .update({ unified_user_id: unifiedUserId })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating Freelancer profile:`, updateError.message);
        } else {
          console.log(`🔗 Linked Freelancer user: ${user.id} → ${unifiedUserId}`);
        }

      } catch (err) {
        console.error(`❌ Failed to migrate ${email}:`, err.message);
      }

      console.log('---');
    }

    // Step 4: Migrate Career Copilot users
    console.log('\n🔄 Migrating Career Copilot users to Master DB...\n');

    for (const user of careerUsers) {
      const fullName = user.full_name || 'Unknown';
      const email = `career_${user.id}@placeholder.com`; // Career Copilot doesn't have email in user_profiles

      try {
        // Check if user already exists
        const { data: existing } = await masterDB
          .from('unified_users')
          .select('id')
          .eq('email', email)
          .single();

        let unifiedUserId;

        if (existing) {
          console.log(`⏭️  User already exists: ${fullName}`);
          unifiedUserId = existing.id;
        } else {
          // Create unified user
          const { data: newUser, error: createError } = await masterDB
            .from('unified_users')
            .insert({
              email: email,
              full_name: fullName,
              has_learning_profile: true,
              created_at: user.created_at
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ Error creating user ${fullName}:`, createError.message);
            continue;
          }

          unifiedUserId = newUser.id;
          console.log(`✅ Created unified user: ${fullName} (${unifiedUserId})`);
        }

        // Create platform link
        const { error: linkError } = await masterDB
          .from('user_platform_links')
          .insert({
            unified_user_id: unifiedUserId,
            platform: 'career_copilot',
            platform_user_id: user.id,
            is_primary: !existing // First platform is primary
          });

        if (linkError && linkError.code !== '23505') {
          console.error(`❌ Error linking user:`, linkError.message);
          continue;
        }

        // Update Career Copilot profile with unified_user_id
        const { error: updateError } = await careerDB
          .from('user_profiles')
          .update({ unified_user_id: unifiedUserId })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating Career profile:`, updateError.message);
        } else {
          console.log(`🔗 Linked Career user: ${user.id} → ${unifiedUserId}`);
        }

      } catch (err) {
        console.error(`❌ Failed to migrate ${fullName}:`, err.message);
      }

      console.log('---');
    }

    // Step 5: Show summary
    console.log('\n📊 Migration Summary:');
    
    const { data: totalUnified } = await masterDB
      .from('unified_users')
      .select('id', { count: 'exact' });
    
    const { data: totalLinks } = await masterDB
      .from('user_platform_links')
      .select('id', { count: 'exact' });

    console.log(`✅ Total unified users: ${totalUnified?.length || 0}`);
    console.log(`✅ Total platform links: ${totalLinks?.length || 0}`);
    
    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateUsers();