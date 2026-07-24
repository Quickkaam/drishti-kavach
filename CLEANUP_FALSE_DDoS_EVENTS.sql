-- ============================================
-- Drishti Kavach — Cleanup False DDoS Events
-- ============================================
-- Run this in Supabase SQL Editor to clear false DDoS events

-- Delete all false positive traffic spike events from 7/23/2026
DELETE FROM ddos_events 
WHERE attack_type = 'traffic_spike' 
  AND severity = 'critical'
  AND created_at >= '2026-07-23T17:57:00Z';

-- Delete associated mitigations
DELETE FROM ddos_mitigations 
WHERE ddos_event_id IN (
  SELECT id FROM ddos_events 
  WHERE attack_type = 'traffic_spike' 
    AND severity = 'critical'
);

-- Clear the Cloudflare under attack mode if it was enabled
-- Go to Cloudflare Dashboard > Security > Overview
-- Disable "Under Attack Mode" if it's enabled

-- Verify the cleanup
SELECT 'Remaining DDoS events:', COUNT(*) FROM ddos_events WHERE status = 'active';
SELECT 'Resolved DDoS events:', COUNT(*) FROM ddos_events WHERE status = 'resolved';
SELECT 'Active blocked IPs:', COUNT(*) FROM ip_block_list WHERE is_active = true;
