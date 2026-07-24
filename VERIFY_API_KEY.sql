-- ============================================
-- Drishti Kavach — Verify API Key
-- ============================================
-- Run this in Supabase SQL Editor to check if the API key is correct

-- Get the website
SELECT id, domain, status FROM websites WHERE domain = 'quickkaam.in';

-- The API key in index.html
SELECT 'dk_fc370748404c447454d76ff96f347075ed1c4930d941e80d' AS provided_api_key;

-- The expected hash (SHA512 of the API key)
SELECT encode(sha512('dk_fc370748404c447454d76ff96f347075ed1c4930d941e80d'::bytea), 'hex') AS expected_hash;

-- Check if the website has this hash
SELECT 
  id,
  domain,
  api_key_hash,
  CASE 
    WHEN api_key_hash = encode(sha512('dk_fc370748404c447454d76ff96f347075ed1c4930d941e80d'::bytea), 'hex') 
    THEN 'MATCH' 
    ELSE 'NO MATCH' 
  END AS match_status
FROM websites 
WHERE domain = 'quickkaam.in';

-- List all websites and their API key hashes
SELECT id, domain, status, 
       SUBSTRING(api_key_hash, 1, 20) || '...' AS api_key_hash_short
FROM websites;
