# Single Instance Deployment Script (PowerShell)
# Builds and pushes the combined frontend+backend Docker image to ECR

param(
    [string]$Region = "us-east-1"
)

# Configuration
$RepoName = "bm-gotyaback-combined"

# Function to print colored output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if AWS CLI is installed
try {
    $null = aws --version
} catch {
    Write-Error-Custom "AWS CLI is not installed. Please install it first."
    exit 1
}

# Check if Docker is installed
try {
    $null = docker --version
} catch {
    Write-Error-Custom "Docker is not installed. Please install it first."
    exit 1
}

# Get AWS account ID
Write-Info "Getting AWS account ID..."
try {
    $AwsAccountId = aws sts get-caller-identity --query Account --output text
    if ([string]::IsNullOrEmpty($AwsAccountId)) {
        throw "Empty account ID"
    }
    Write-Info "AWS Account ID: $AwsAccountId"
} catch {
    Write-Error-Custom "Failed to get AWS account ID. Please check your AWS credentials."
    exit 1
}

# ECR URI
$EcrUri = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"
$ImageUri = "$EcrUri/$RepoName"

# Check if ECR repository exists, create if not
Write-Info "Checking if ECR repository exists..."
try {
    $RepoExists = aws ecr describe-repositories --repository-names $RepoName --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Repository doesn't exist. Creating..."
        aws ecr create-repository --repository-name $RepoName --region $Region
        if ($LASTEXITCODE -eq 0) {
            Write-Info "✓ Repository created successfully"
        } else {
            throw "Failed to create repository"
        }
    } else {
        Write-Info "✓ Repository already exists"
    }
} catch {
    Write-Error-Custom "Failed to check/create repository: $_"
    exit 1
}

# Check if frontend .env.production exists
if (-not (Test-Path "frontend\.env.production")) {
    Write-Warn "frontend\.env.production not found!"
    Write-Warn "The frontend will be built without environment variables."
    Write-Warn "You can create it with:"
    Write-Warn "  VITE_API_URL=/api"
    Write-Warn "  VITE_STRIPE_PUBLIC_KEY=pk_..."
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Login to ECR
Write-Info "Logging in to Amazon ECR..."
try {
    $LoginPassword = aws ecr get-login-password --region $Region
    $LoginPassword | docker login --username AWS --password-stdin $EcrUri
    if ($LASTEXITCODE -ne 0) {
        throw "Docker login failed"
    }
    Write-Info "Successfully logged in to ECR"
} catch {
    Write-Error-Custom "Failed to login to ECR: $_"
    exit 1
}

# Build combined image
Write-Info "Building combined image (this may take a few minutes)..."
try {
    docker build -f docker/Dockerfile.combined -t $RepoName .
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    Write-Info "✓ Image built successfully"
} catch {
    Write-Error-Custom "Failed to build image: $_"
    exit 1
}

# Tag image
Write-Info "Tagging image..."
docker tag "${RepoName}:latest" "${ImageUri}:latest"

# Push to ECR
Write-Info "Pushing image to ECR..."
try {
    docker push "${ImageUri}:latest"
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed"
    }
    Write-Info "✓ Image pushed successfully"
} catch {
    Write-Error-Custom "Failed to push image: $_"
    exit 1
}

Write-Info "=== Deployment Complete ==="
Write-Info "Image URI: ${ImageUri}:latest"
Write-Info ""
Write-Info "Next steps:"
Write-Info "1. Go to AWS App Runner console"
Write-Info "2. Create a new service (or update existing)"
Write-Info "3. Use image: ${ImageUri}:latest"
Write-Info "4. Set port: 8080"
Write-Info "5. Configure environment variables"
Write-Info "6. Set health check path: /health"
Write-Info "7. Deploy!"
Write-Info ""
Write-Info "Recommended resources:"
Write-Info "  - CPU: 1 vCPU"
Write-Info "  - Memory: 2 GB"
Write-Info "  - Cost: ~$25/month"

