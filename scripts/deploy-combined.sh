#!/bin/bash

# Single Instance Deployment Script (Bash)
# Builds and pushes the combined frontend+backend Docker image to ECR

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
REPO_NAME="bm-gotyaback-combined"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    exit 1
fi

# Get AWS account ID
print_info "Getting AWS account ID..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    print_error "Failed to get AWS account ID. Please check your AWS credentials."
    exit 1
fi
print_info "AWS Account ID: $AWS_ACCOUNT_ID"

# ECR URI
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_URI="$ECR_URI/$REPO_NAME"

# Check if ECR repository exists, create if not
print_info "Checking if ECR repository exists..."
if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
    print_info "Repository doesn't exist. Creating..."
    aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION
    if [ $? -eq 0 ]; then
        print_info "✓ Repository created successfully"
    else
        print_error "Failed to create repository"
        exit 1
    fi
else
    print_info "✓ Repository already exists"
fi

# Check if frontend .env.production exists
if [ ! -f "frontend/.env.production" ]; then
    print_warn "frontend/.env.production not found!"
    print_warn "The frontend will be built without environment variables."
    print_warn "You can create it with:"
    print_warn "  VITE_API_URL=/api"
    print_warn "  VITE_STRIPE_PUBLIC_KEY=pk_..."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Login to ECR
print_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
if [ $? -ne 0 ]; then
    print_error "Failed to login to ECR"
    exit 1
fi
print_info "Successfully logged in to ECR"

# Build combined image
print_info "Building combined image (this may take a few minutes)..."
docker build -f docker/Dockerfile.combined -t $REPO_NAME .
if [ $? -ne 0 ]; then
    print_error "Failed to build image"
    exit 1
fi
print_info "✓ Image built successfully"

# Tag image
print_info "Tagging image..."
docker tag $REPO_NAME:latest $IMAGE_URI:latest

# Push to ECR
print_info "Pushing image to ECR..."
docker push $IMAGE_URI:latest
if [ $? -ne 0 ]; then
    print_error "Failed to push image"
    exit 1
fi
print_info "✓ Image pushed successfully"

print_info "=== Deployment Complete ==="
print_info "Image URI: $IMAGE_URI:latest"
print_info ""
print_info "Next steps:"
print_info "1. Go to AWS App Runner console"
print_info "2. Create a new service (or update existing)"
print_info "3. Use image: $IMAGE_URI:latest"
print_info "4. Set port: 8080"
print_info "5. Configure environment variables"
print_info "6. Set health check path: /health"
print_info "7. Deploy!"
print_info ""
print_info "Recommended resources:"
print_info "  - CPU: 1 vCPU"
print_info "  - Memory: 2 GB"
print_info "  - Cost: ~\$25/month"

