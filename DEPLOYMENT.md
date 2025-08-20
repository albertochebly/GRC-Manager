# AuditAlign Deployment Configuration

## SSH Keys Setup

### 1. SSH Key Generated
- **Private Key Location**: `~/.ssh/auditalign_deploy_key`
- **Public Key Location**: `~/.ssh/auditalign_deploy_key.pub`

### 2. Public Key (Add this to your VM)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINlSRzyCvwoyCGsIn9SsXEOtxl3IldJeyUM0caHkGivh deploy@auditalign
```

**On your remote VM, run:**
```bash
# Add the public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINlSRzyCvwoyCGsIn9SsXEOtxl3IldJeyUM0caHkGivh deploy@auditalign" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets:
- **VM_HOST**: 46.165.254.175
- **VM_USER**: root
- **VM_SSH_KEY**: The private key content (copy from `~/.ssh/auditalign_deploy_key`)
- **VM_PORT**: 15753

### Private Key Content for GitHub Secret:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAt
zc2gtZW                                                        QyNTUxOQAAACDZUkc8gr8KMghrCJ/UrFxDrcZdyJXSXslDNHGh5Bor4QAAAJgCZ
Uv9AmVL                                                        /QAAAAtzc2gtZWQyNTUxOQAAACDZUkc8gr8KMghrCJ/UrFxDrcZdyJXSXslDNHG
h5Bor4Q                                                        AAAEC9MQ3+HNEFtswkVgxyJTtQpczsI8L5E0/0sMR8ZOnlMNlSRzyCvwoyCGsIn
9SsXEOt                                                        xl3IldJeyUM0caHkGivhAAAAEWRlcGxveUBhdWRpdGFsaWduAQIDBA==
-----END OPENSSH PRIVATE KEY-----
```

## VM Setup Requirements

### Prerequisites on your VM:
1. **Ubuntu/Debian** (recommended) or similar Linux distribution
2. **SSH access** enabled
3. **sudo privileges** for the deployment user

### The deployment will automatically install:
- Node.js 18.x
- PM2 (process manager)
- Application dependencies

## Environment Configuration

### On your VM, create `/opt/auditalign/.env.production`:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret_here
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password
```

## Deployment Workflow

### Automatic Deployment:
- Triggered on push to `main` or `production` branches
- Runs tests first, then deploys if tests pass
- Can be manually triggered via GitHub Actions

### Manual Deployment:
1. Go to GitHub Actions in your repository
2. Select "Deploy to Remote VM" workflow
3. Click "Run workflow"

## Application Management on VM

### Check application status:
```bash
pm2 status
pm2 logs auditalign
```

### Restart application:
```bash
pm2 restart auditalign
```

### Stop application:
```bash
pm2 stop auditalign
```

### View logs:
```bash
pm2 logs auditalign --lines 100
```

## Firewall Configuration

Make sure your VM allows traffic on the application port:
```bash
# Ubuntu/Debian with ufw
sudo ufw allow 3000/tcp
sudo ufw allow ssh

# Or with iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

## Testing the Deployment

### 1. Test SSH Connection:
```bash
ssh -i ~/.ssh/auditalign_deploy_key -p 15753 root@46.165.254.175
```

### 2. Manual Deployment Test:
After setting up GitHub secrets, push a commit to the main branch and check the Actions tab.

### 3. Verify Application:
Once deployed, check if the application is running:
```bash
curl http://46.165.254.175:3000
```

## Security Recommendations

1. **Use a non-root user** for deployment
2. **Configure firewall** to only allow necessary ports
3. **Use strong passwords** and secure JWT secrets
4. **Regular security updates** on the VM
5. **Monitor logs** for suspicious activity
6. **Use HTTPS** in production (consider adding nginx reverse proxy)

## Troubleshooting

### Common Issues:
1. **SSH connection failed**: Check VM_HOST, VM_USER, and VM_SSH_KEY secrets
2. **Permission denied**: Ensure the public key is correctly added to VM's authorized_keys
3. **Build failed**: Check if all dependencies are properly defined in package.json
4. **Application won't start**: Check the environment variables and database connection

### Debugging:
- Check GitHub Actions logs for detailed error messages
- SSH into the VM and check PM2 logs: `pm2 logs auditalign`
- Verify the application files are in `/opt/auditalign`
