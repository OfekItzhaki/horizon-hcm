# Secrets Rotation Guide

## Overview

Regular rotation of secrets is a critical security practice that limits the window of opportunity for compromised credentials. This guide provides step-by-step procedures for rotating all types of secrets used in Horizon-HCM.

## General Rotation Process

1. **Generate new secret** - Create the new credential
2. **Update secret store** - Store the new secret in AWS Secrets Manager or GitHub Secrets
3. **Deploy with new secret** - Update the application to use the new secret
4. **Verify functionality** - Ensure the application works with the new secret
5. **Revoke old secret** - Disable or delete the old credential
6. **Document rotation** - Log the rotation date and any issues

## Database Password Rotation

### Automated Rotation (AWS Secrets Manager)

AWS Secrets Manager can automatically rotate database passwords.

**Setup:**

```bash
# Enable automatic rotation
aws secretsmanager rotate-secret \
    --secret-id horizon-hcm/production/database \
    --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:SecretsManagerRotation \
    --rotation-rules AutomaticallyAfterDays=90
```

### Manual Rotation

**Steps:**

1. **Create new password:**
   ```bash
   NEW_PASSWORD=$(openssl rand -base64 32)
   echo "New password: $NEW_PASSWORD"
   ```

2. **Update database user:**
   ```sql
   -- Connect to database as admin
   ALTER USER horizon_hcm_user WITH PASSWORD 'NEW_PASSWORD';
   ```

3. **Update secret in AWS Secrets Manager:**
   ```bash
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/database \
       --secret-string "{\"username\":\"horizon_hcm_user\",\"password\":\"$NEW_PASSWORD\",\"host\":\"db.example.com\",\"port\":\"5432\",\"database\":\"horizon_hcm\"}"
   ```

4. **Update GitHub Secret:**
   - Go to GitHub repository → Settings → Secrets
   - Update `DATABASE_URL_PRODUCTION` with new connection string

5. **Deploy application:**
   ```bash
   ./scripts/deploy.sh production
   ```

6. **Verify connectivity:**
   ```bash
   # Check application logs
   pm2 logs horizon-hcm --lines 50
   
   # Test database connection
   curl http://localhost:3000/health
   ```

## Redis Password Rotation

**Steps:**

1. **Update Redis configuration:**
   ```bash
   # Connect to Redis server
   redis-cli -h redis.example.com
   
   # Set new password
   CONFIG SET requirepass "NEW_SECURE_PASSWORD"
   CONFIG REWRITE
   ```

2. **Update secrets:**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/redis \
       --secret-string "{\"host\":\"redis.example.com\",\"port\":\"6379\",\"password\":\"NEW_SECURE_PASSWORD\"}"
   
   # GitHub Secrets
   # Update REDIS_PASSWORD in GitHub UI
   ```

3. **Deploy and verify:**
   ```bash
   ./scripts/deploy.sh production
   curl http://localhost:3000/health
   ```

## JWT Keys Rotation

JWT key rotation requires a transition period where both old and new keys are valid.

**Steps:**

1. **Generate new key pair:**
   ```bash
   # Generate new RSA key pair
   openssl genrsa -out jwt_private_new.pem 2048
   openssl rsa -in jwt_private_new.pem -pubout -out jwt_public_new.pem
   
   # Convert to single-line format for environment variables
   JWT_PRIVATE_KEY_NEW=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' jwt_private_new.pem)
   JWT_PUBLIC_KEY_NEW=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' jwt_public_new.pem)
   ```

2. **Add new keys alongside old keys:**
   ```bash
   # Update secrets with both old and new keys
   # The application should validate tokens with both keys during transition
   
   # AWS Secrets Manager
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/jwt-keys \
       --secret-string "{\"private_key\":\"$JWT_PRIVATE_KEY_NEW\",\"public_key\":\"$JWT_PUBLIC_KEY_NEW\",\"private_key_old\":\"$JWT_PRIVATE_KEY_OLD\",\"public_key_old\":\"$JWT_PUBLIC_KEY_OLD\"}"
   ```

3. **Deploy with dual-key support:**
   ```bash
   # Application should sign with new key but validate with both keys
   ./scripts/deploy.sh production
   ```

4. **Wait for token expiration:**
   ```bash
   # Wait for all tokens signed with old key to expire
   # Default: 15 minutes for access tokens, 7 days for refresh tokens
   # Wait at least 7 days
   ```

5. **Remove old keys:**
   ```bash
   # Update secrets to only include new keys
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/jwt-keys \
       --secret-string "{\"private_key\":\"$JWT_PRIVATE_KEY_NEW\",\"public_key\":\"$JWT_PUBLIC_KEY_NEW\"}"
   
   # Deploy again
   ./scripts/deploy.sh production
   ```

## API Keys Rotation

### Firebase Cloud Messaging (FCM)

**Steps:**

1. **Generate new service account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Extract credentials:**
   ```bash
   # Extract from downloaded JSON
   FCM_PROJECT_ID=$(jq -r '.project_id' service-account.json)
   FCM_PRIVATE_KEY=$(jq -r '.private_key' service-account.json)
   FCM_CLIENT_EMAIL=$(jq -r '.client_email' service-account.json)
   ```

3. **Update secrets:**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/fcm \
       --secret-string "{\"project_id\":\"$FCM_PROJECT_ID\",\"private_key\":\"$FCM_PRIVATE_KEY\",\"client_email\":\"$FCM_CLIENT_EMAIL\"}"
   
   # GitHub Secrets
   # Update FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL
   ```

4. **Deploy and test:**
   ```bash
   ./scripts/deploy.sh production
   
   # Test notification sending
   npm run test:notifications
   ```

5. **Revoke old service account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Delete the old service account

### Apple Push Notification Service (APNS)

**Steps:**

1. **Generate new key:**
   - Go to Apple Developer → Certificates, Identifiers & Profiles → Keys
   - Create new key with Apple Push Notifications service enabled
   - Download the .p8 file

2. **Update secrets:**
   ```bash
   APNS_PRIVATE_KEY=$(cat AuthKey_XXXXXXXXXX.p8)
   
   # AWS Secrets Manager
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/apns \
       --secret-string "{\"key_id\":\"XXXXXXXXXX\",\"team_id\":\"YYYYYYYYYY\",\"private_key\":\"$APNS_PRIVATE_KEY\"}"
   ```

3. **Deploy and test:**
   ```bash
   ./scripts/deploy.sh production
   npm run test:notifications
   ```

4. **Revoke old key:**
   - Go to Apple Developer → Keys
   - Revoke the old key

### AWS Access Keys

**Steps:**

1. **Create new access key:**
   ```bash
   # Using AWS CLI
   aws iam create-access-key --user-name horizon-hcm-service
   
   # Save the output
   # AccessKeyId: AKIAIOSFODNN7EXAMPLE
   # SecretAccessKey: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

2. **Update secrets:**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/aws-credentials \
       --secret-string "{\"access_key_id\":\"AKIAIOSFODNN7EXAMPLE\",\"secret_access_key\":\"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\"}"
   
   # GitHub Secrets
   # Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   ```

3. **Deploy and verify:**
   ```bash
   ./scripts/deploy.sh production
   
   # Test S3 access
   curl -X POST http://localhost:3000/api/v1/files/upload \
       -H "Authorization: Bearer $TOKEN" \
       -F "file=@test.jpg"
   ```

4. **Deactivate old key:**
   ```bash
   # Deactivate (can be reactivated if needed)
   aws iam update-access-key \
       --access-key-id OLD_ACCESS_KEY_ID \
       --status Inactive \
       --user-name horizon-hcm-service
   
   # After verification, delete permanently
   aws iam delete-access-key \
       --access-key-id OLD_ACCESS_KEY_ID \
       --user-name horizon-hcm-service
   ```

## Encryption Keys Rotation

**Steps:**

1. **Generate new encryption key:**
   ```bash
   NEW_ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

2. **Implement dual-key decryption:**
   ```typescript
   // Application should decrypt with old key, re-encrypt with new key
   // This allows gradual migration of encrypted data
   ```

3. **Update secrets:**
   ```bash
   # Add new key alongside old key
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/encryption \
       --secret-string "{\"current_key\":\"$NEW_ENCRYPTION_KEY\",\"previous_key\":\"$OLD_ENCRYPTION_KEY\"}"
   ```

4. **Deploy with migration logic:**
   ```bash
   ./scripts/deploy.sh production
   ```

5. **Run data migration:**
   ```bash
   # Re-encrypt all data with new key
   npm run migrate:re-encrypt
   ```

6. **Remove old key:**
   ```bash
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/encryption \
       --secret-string "{\"current_key\":\"$NEW_ENCRYPTION_KEY\"}"
   ```

## HMAC Secret Rotation

**Steps:**

1. **Generate new HMAC secret:**
   ```bash
   NEW_HMAC_SECRET=$(openssl rand -base64 32)
   ```

2. **Update secrets with both old and new:**
   ```bash
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/hmac \
       --secret-string "{\"current\":\"$NEW_HMAC_SECRET\",\"previous\":\"$OLD_HMAC_SECRET\"}"
   ```

3. **Deploy with dual-validation:**
   ```bash
   # Application validates signatures with both secrets during transition
   ./scripts/deploy.sh production
   ```

4. **Notify API consumers:**
   ```bash
   # Send email to API consumers about new HMAC secret
   # Provide 30-day transition period
   ```

5. **Remove old secret after transition:**
   ```bash
   aws secretsmanager update-secret \
       --secret-id horizon-hcm/production/hmac \
       --secret-string "{\"current\":\"$NEW_HMAC_SECRET\"}"
   ```

## Rotation Checklist

Use this checklist for each rotation:

- [ ] Generate new secret/credential
- [ ] Update secret in AWS Secrets Manager
- [ ] Update secret in GitHub Secrets (if applicable)
- [ ] Deploy application with new secret
- [ ] Verify application functionality
- [ ] Monitor logs for errors
- [ ] Test affected features
- [ ] Wait for transition period (if applicable)
- [ ] Revoke/delete old secret
- [ ] Document rotation in rotation log
- [ ] Update rotation schedule

## Rotation Log

Maintain a log of all secret rotations:

```
Date: 2024-01-15
Secret: Database Password (Production)
Rotated By: admin@example.com
Method: Manual
Status: Success
Notes: Routine 90-day rotation

Date: 2024-01-20
Secret: JWT Keys (Production)
Rotated By: admin@example.com
Method: Manual
Status: Success
Notes: Annual rotation, 7-day transition period
```

## Emergency Rotation

If a secret is compromised, rotate immediately:

1. **Assess impact** - Determine which systems are affected
2. **Rotate immediately** - Don't wait for scheduled rotation
3. **Revoke old secret** - Disable compromised credential immediately
4. **Monitor for abuse** - Check logs for unauthorized access
5. **Notify stakeholders** - Inform security team and affected users
6. **Document incident** - Record details for post-mortem

## Automation

Consider automating rotation for frequently rotated secrets:

```bash
# Example: Automated database password rotation script
#!/bin/bash
# rotate-db-password.sh

NEW_PASSWORD=$(openssl rand -base64 32)

# Update database
psql -h db.example.com -U admin -c "ALTER USER horizon_hcm_user WITH PASSWORD '$NEW_PASSWORD';"

# Update AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id horizon-hcm/production/database \
    --secret-string "{\"username\":\"horizon_hcm_user\",\"password\":\"$NEW_PASSWORD\",\"host\":\"db.example.com\",\"port\":\"5432\",\"database\":\"horizon_hcm\"}"

# Trigger deployment
./scripts/deploy.sh production

# Log rotation
echo "$(date): Database password rotated successfully" >> /var/log/rotation.log
```

## References

- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
