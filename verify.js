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

  // GET — check status of a code
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code required' });

    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) return res.status(404).json({ status: 'not_found' });
    return res.status(200).json(data);
  }

  // POST — create verification OR resolve it
  if (req.method === 'POST') {
    const { action, code, team_name, reto_id, reto_title } = req.body;

    // Create new pending verification
    if (action === 'create') {
      // Generate random 4-char code
      const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase
        .from('verifications')
        .insert({
          code: newCode,
          team_name,
          reto_id,
          reto_title,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ code: newCode });
    }

    // Resolve: approve or reject
    if (action === 'approve' || action === 'reject') {
      if (!code) return res.status(400).json({ error: 'code required' });

      // Check it exists and is pending
      const { data: existing } = await supabase
        .from('verifications')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'pending')
        .single();

      if (!existing) return res.status(404).json({ error: 'Code not found or already resolved' });

      const { data, error } = await supabase
        .from('verifications')
        .update({ status: action, resolved_at: new Date().toISOString() })
        .eq('code', code.toUpperCase())
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
