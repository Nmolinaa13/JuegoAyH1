import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://epmegaaswtbpfhvnhgca.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbWVnYWFzd3RicGZodm5oZ2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkwMTAwNSwiZXhwIjoyMDkzNDc3MDA1fQ.OFT25crmccQZ6B-Rf0zAX05_1-1jzf3T87825q637Ts'
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return all team scores
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('score', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — upsert team score
  if (req.method === 'POST') {
    const { team_name, members, score, completed } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name required' });

    const { data, error } = await supabase
      .from('teams')
      .upsert(
        { team_name, members, score, completed, updated_at: new Date().toISOString() },
        { onConflict: 'team_name' }
      )
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
