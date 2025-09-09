#!/bin/bash

# AuditAlign Deployment Test Script
# This script helps test the SSH connection to your VM

echo "🚀 AuditAlign Deployment Test Script"
echo "=================================="

# Check if SSH key exists
if [ ! -f ~/.ssh/auditalign_deploy_key ]; then
    echo "❌ SSH key not found at ~/.ssh/auditalign_deploy_key"
    echo "Please run the SSH key generation first."
    exit 1
fi

echo "✅ SSH key found"

# Get VM details from user
read -p "Enter your VM IP address or hostname: " VM_HOST
read -p "Enter your VM username (e.g., ubuntu, root): " VM_USER
read -p "Enter SSH port (default 22): " VM_PORT
VM_PORT=${VM_PORT:-22}

echo ""
echo "Testing SSH connection..."
echo "Host: $VM_HOST"
echo "User: $VM_USER"
echo "Port: $VM_PORT"
echo ""

# Test SSH connection
ssh -i ~/.ssh/auditalign_deploy_key -p $VM_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VM_USER@$VM_HOST "echo 'SSH connection successful! 🎉'"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH connection test passed!"
    echo ""
    echo "Now add these GitHub Secrets:"
    echo "VM_HOST: $VM_HOST"
    echo "VM_USER: $VM_USER"
    echo "VM_PORT: $VM_PORT"
    echo "VM_SSH_KEY: (copy the private key from ~/.ssh/auditalign_deploy_key)"
    echo ""
    echo "Public key to add to your VM:"
    cat ~/.ssh/auditalign_deploy_key.pub
else
    echo ""
    echo "❌ SSH connection failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Make sure your VM is running and accessible"
    echo "2. Verify the IP address and username are correct"
    echo "3. Ensure the public key is added to ~/.ssh/authorized_keys on the VM"
    echo "4. Check if SSH service is running on the VM"
    echo "5. Verify firewall allows SSH connections"
    echo ""
    echo "To add the public key to your VM, run this on the VM:"
    echo "echo '$(cat ~/.ssh/auditalign_deploy_key.pub)' >> ~/.ssh/authorized_keys"
    echo "chmod 600 ~/.ssh/authorized_keys"
    echo "chmod 700 ~/.ssh"
fi
