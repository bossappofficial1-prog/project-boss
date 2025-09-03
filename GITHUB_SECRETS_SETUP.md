# GitHub Actions Secrets Setup Guide

## Required Secrets for Staging Deployment

### 1. Docker Hub Credentials

```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_password
```

### 2. SSH Access to Staging Server

```
STAGING_SSH_PRIVATE_KEY=your_private_ssh_key
STAGING_SSH_HOST=your_staging_server_ip_or_domain
STAGING_SSH_USER=your_ssh_username
STAGING_SSH_PORT=22
```

## How to Setup Secrets

### Step 1: Generate SSH Key Pair

```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-actions@yourproject.com" -f ~/.ssh/staging_deploy_key

# Display the public key (copy this to your server)
cat ~/.ssh/staging_deploy_key.pub
```

### Step 2: Add Public Key to Staging Server

```bash
# On your staging server, add the public key to authorized_keys
echo "your_public_key_here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Setup GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the following values:

#### Required Secrets:

**DOCKER_USERNAME**

- Value: Your Docker Hub username

**DOCKER_PASSWORD**

- Value: Your Docker Hub password or access token

**STAGING_SSH_PRIVATE_KEY**

- Value: The entire private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

**STAGING_SSH_HOST**

- Value: Your staging server IP address or domain name (e.g., `staging.yourdomain.com` or `123.456.789.0`)

**STAGING_SSH_USER**

- Value: SSH username for your staging server (usually `root` or your sudo user)

**STAGING_SSH_PORT**

- Value: SSH port (usually `22`, but can be different if you changed it)

### Step 4: Verify SSH Connection

```bash
# Test SSH connection from your local machine
ssh -i ~/.ssh/staging_deploy_key -p 22 your_user@your_staging_server_ip

# If successful, you should be able to connect without password
```

### Step 5: Setup Staging Server

Before running the deployment, make sure your staging server has:

- Ubuntu/Debian Linux
- SSH access configured
- Sudo privileges for the SSH user

Run the setup script on your staging server:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/PitokDf/project-boss/develop/setup-staging-server.sh
chmod +x setup-staging-server.sh
sudo ./setup-staging-server.sh
```

## Troubleshooting

### Common Issues:

1. **"Permission denied (publickey)"**

   - Check if the public key is correctly added to `~/.ssh/authorized_keys`
   - Verify the SSH key format (should be OpenSSH format)
   - Ensure correct file permissions: `chmod 600 ~/.ssh/authorized_keys`

2. **"Host key verification failed"**

   - Add the staging server to known hosts: `ssh-keyscan -H your_staging_server_ip >> ~/.ssh/known_hosts`

3. **"Connection refused"**

   - Check if SSH service is running on the staging server
   - Verify the SSH port is correct and not blocked by firewall

4. **"Permission denied (password)"**
   - Ensure you're using the correct SSH key
   - Check if the SSH key is properly formatted in the GitHub secret

### Testing Secrets:

After setting up all secrets, you can test the deployment by:

1. Pushing to the `develop` branch
2. Checking the GitHub Actions logs
3. Verifying the deployment on your staging server

## Security Notes:

- Never commit SSH private keys to your repository
- Use dedicated SSH keys for deployment (don't reuse personal keys)
- Regularly rotate SSH keys and passwords
- Limit SSH user permissions on the staging server
