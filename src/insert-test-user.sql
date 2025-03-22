-- Connect to the correct database
\c ghostpay;

-- Insert a test creator
INSERT INTO users (
  id, 
  email, 
  name, 
  role, 
  status, 
  alias, 
  "emailVerified", 
  "phoneVerified", 
  "mfaMethod", 
  "mfaEnabled", 
  "highSecurityMode", 
  "trustedDevices", 
  "loginHistory", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(), 
  'test_email', 
  'Test Creator', 
  'CREATOR', 
  'ACTIVE', 
  'test_creator', 
  TRUE, 
  FALSE, 
  'NONE', 
  FALSE, 
  FALSE, 
  '[]', 
  '[]', 
  NOW(), 
  NOW()
) RETURNING id;

-- After running the above, copy the returned ID and use it below:
-- INSERT INTO wallets (
--   id, 
--   balance, 
--   "userId", 
--   "createdAt", 
--   "updatedAt"
-- ) VALUES (
--   gen_random_uuid(), 
--   1000, 
--   'YOUR_USER_ID_HERE', 
--   NOW(), 
--   NOW()
-- ); 