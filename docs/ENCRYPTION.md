# End-to-End Encryption in GhostPay API

This document outlines the encryption strategy implemented in the GhostPay API to secure sensitive user data.

## Overview

GhostPay implements end-to-end encryption for sensitive data in the database and in transit. This ensures that sensitive information like user emails, wallet balances, and payment details are protected from unauthorized access.

## Components

### 1. HTTPS Enforcement

All API traffic is enforced to use HTTPS to encrypt data in transit:

- HTTP requests are automatically redirected to HTTPS
- HSTS (HTTP Strict Transport Security) headers are set
- Additional security headers are implemented to prevent common web vulnerabilities

### 2. Database Encryption

Sensitive data stored in the database is encrypted using AES-256-GCM:

- **Encrypted fields include**:
  - User data: email, name, phone number
  - Wallet: balance
  - Payments: amount, description, invoice details, receipt data

### 3. Implementation Details

#### Encryption Service

The `EncryptionService` provides AES-256-GCM encryption and decryption functionality:

- Uses a secure randomly generated encryption key
- Implements authenticated encryption with GCM mode
- Stores initialization vectors (IV) and authentication tags with encrypted data

#### Entity Column Encryption

Encryption is applied at the entity level using TypeORM transformers:

- `EncryptedColumnTransformer` automatically encrypts data before saving to the database
- Data is automatically decrypted when retrieved from the database
- Type conversion is handled transparently

## Security Considerations

### Key Management

- The encryption key is stored in the `.env` file as `ENCRYPTION_KEY`
- In production, consider using a secret management service like AWS Secrets Manager
- **WARNING**: Loss of the encryption key will result in permanent data loss

### Database Considerations

- Encrypted columns are stored as text type in the database
- For querying encrypted fields, we use hash indices (specifically for emails)
- Full-text search on encrypted fields is not supported

## Setup Instructions

### 1. Generate Encryption Key

```
npm run generate:key
```

This will create a secure random key and add it to your `.env` file.

### 2. Run Database Migrations

```
npm run migration:run
```

This will update your database schema to support encrypted columns.

### 3. Configuration

In `.env`, ensure the following settings are configured:

```
# Required for encryption
ENCRYPTION_KEY=[your-generated-key]

# For HTTPS enforcement
NODE_ENV=production
```

## Best Practices

1. **Backup Your Encryption Key**: Store backup copies of your encryption key in secure locations.
2. **Rotate Keys Periodically**: Implement a key rotation strategy for long-term security.
3. **Limit Access**: Restrict access to the encryption key to only essential personnel.
4. **Monitor Usage**: Log and audit access to encrypted data for security monitoring.

## Recommendations for Production

1. Use a proper secret management service (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
2. Consider using Hardware Security Modules (HSMs) for key storage
3. Implement key rotation procedures
4. Use a reverse proxy (NGINX, Cloudflare) with proper TLS configuration
