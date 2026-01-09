require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const masterDB = createClient(
  process.env.MASTER_URL,
  process.env.MASTER_SERVICE_KEY
);

async function addPasswords() {
  const { data: users } = await masterDB.from('unified_users').select('id, email');
  
  for (const user of users) {
    const hash = await bcrypt.hash('test123', 10);
    await masterDB.from('unified_users').update({ password_hash: hash }).eq('id', user.id);
    console.log(`✅ Added password for ${user.email}`);
  }
  
  console.log('✅ Done!');
}

addPasswords();