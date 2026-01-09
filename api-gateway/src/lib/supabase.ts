import { createClient } from '@supabase/supabase-js';

export const masterDB = createClient(
  process.env.MASTER_URL!,
  process.env.MASTER_SERVICE_KEY!
);

export const freelancerDB = createClient(
  process.env.FREELANCER_URL!,
  process.env.FREELANCER_SERVICE_KEY!
);

export const careerDB = createClient(
  process.env.CAREER_URL!,
  process.env.CAREER_SERVICE_KEY!
);