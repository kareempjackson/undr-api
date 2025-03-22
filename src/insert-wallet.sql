-- Connect to the correct database
\c ghostpay;

-- Insert wallet for the test creator
INSERT INTO wallets (
  id, 
  balance, 
  "userId", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(), 
  1000, 
  '16a8b4db-7dd1-453d-bac5-fefd6a722dc4', 
  NOW(), 
  NOW()
); 