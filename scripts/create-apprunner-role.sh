#!/bin/bash

# Create IAM Role for App Runner to access ECR
# This script creates the necessary IAM role and attaches the required policy

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}[INFO] Creating IAM role for App Runner ECR access...${NC}"

# Create trust policy document
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
echo -e "${GREEN}[INFO] Creating role 'AppRunnerECRAccessRole'...${NC}"
if aws iam create-role \
    --role-name AppRunnerECRAccessRole \
    --assume-role-policy-document file://trust-policy.json \
    --description "Allows App Runner to access ECR repositories" 2>/dev/null; then
    echo -e "${GREEN}[INFO] Role created successfully${NC}"
else
    echo -e "${YELLOW}[WARN] Role might already exist, continuing...${NC}"
fi

# Attach the AWS managed policy for ECR access
echo -e "${GREEN}[INFO] Attaching ECR access policy...${NC}"
aws iam attach-role-policy \
    --role-name AppRunnerECRAccessRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${GREEN}[SUCCESS] ✓ IAM role created successfully!${NC}"
echo ""
echo -e "${CYAN}Role ARN: arn:aws:iam::${ACCOUNT_ID}:role/AppRunnerECRAccessRole${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go back to App Runner console"
echo "2. In 'Source and deployment' section:"
echo "   - Deployment settings: Automatic or Manual"
echo "   - ECR access role: Select 'AppRunnerECRAccessRole'"
echo "3. Continue with the rest of the configuration"
echo "4. Deploy!"

# Clean up
rm -f trust-policy.json

