#!/bin/bash

# AWS App Runner Deployment Script
# This script builds and pushes Docker images to ECR

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
BACKEND_REPO="bm-gotyaback-backend"
FRONTEND_REPO="bm-gotyaback-frontend"

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

# ECR URIs
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
BACKEND_ECR="$ECR_URI/$BACKEND_REPO"
FRONTEND_ECR="$ECR_URI/$FRONTEND_REPO"

# Function to ensure repository exists
ensure_repository() {
    local REPO_NAME=$1

    print_info "Checking if ECR repository '$REPO_NAME' exists..."
    if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
        print_info "Repository doesn't exist. Creating..."
        aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION
        if [ $? -eq 0 ]; then
            print_info "✓ Repository '$REPO_NAME' created successfully"
        else
            print_error "Failed to create repository"
            exit 1
        fi
    else
        print_info "✓ Repository '$REPO_NAME' already exists"
    fi
}

# Login to ECR
print_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
if [ $? -ne 0 ]; then
    print_error "Failed to login to ECR"
    exit 1
fi
print_info "Successfully logged in to ECR"

# Function to build and push image
build_and_push() {
    local SERVICE=$1
    local REPO=$2
    local DIR=$3
    
    print_info "Building $SERVICE image..."
    cd $DIR
    
    docker build -t $SERVICE .
    if [ $? -ne 0 ]; then
        print_error "Failed to build $SERVICE image"
        exit 1
    fi
    
    print_info "Tagging $SERVICE image..."
    docker tag $SERVICE:latest $REPO:latest
    
    print_info "Pushing $SERVICE image to ECR..."
    docker push $REPO:latest
    if [ $? -ne 0 ]; then
        print_error "Failed to push $SERVICE image"
        exit 1
    fi
    
    print_info "✓ $SERVICE image pushed successfully"
    cd ..
}

# Parse command line arguments
DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

if [ $# -eq 0 ]; then
    # No arguments, deploy both
    DEPLOY_BACKEND=true
    DEPLOY_FRONTEND=true
else
    for arg in "$@"; do
        case $arg in
            backend)
                DEPLOY_BACKEND=true
                ;;
            frontend)
                DEPLOY_FRONTEND=true
                ;;
            *)
                print_error "Unknown argument: $arg"
                echo "Usage: $0 [backend] [frontend]"
                echo "  No arguments: Deploy both"
                echo "  backend: Deploy backend only"
                echo "  frontend: Deploy frontend only"
                exit 1
                ;;
        esac
    done
fi

# Deploy backend
if [ "$DEPLOY_BACKEND" = true ]; then
    print_info "=== Deploying Backend ==="
    ensure_repository "$BACKEND_REPO"
    build_and_push "backend" "$BACKEND_ECR" "backend"
fi

# Deploy frontend
if [ "$DEPLOY_FRONTEND" = true ]; then
    print_info "=== Deploying Frontend ==="
    ensure_repository "$FRONTEND_REPO"
    
    # Check if .env.production exists
    if [ ! -f "frontend/.env.production" ]; then
        print_warn "frontend/.env.production not found!"
        print_warn "Please create it with:"
        print_warn "  VITE_API_URL=https://your-backend-url.awsapprunner.com/api"
        print_warn "  VITE_STRIPE_PUBLIC_KEY=pk_live_..."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    build_and_push "frontend" "$FRONTEND_ECR" "frontend"
fi

print_info "=== Deployment Complete ==="
print_info "Backend ECR: $BACKEND_ECR:latest"
print_info "Frontend ECR: $FRONTEND_ECR:latest"
print_info ""
print_info "Next steps:"
print_info "1. Go to AWS App Runner console"
print_info "2. Create or update your services with these images"
print_info "3. Configure environment variables"
print_info "4. Deploy!"

