# AWS App Runner Deployment Script (PowerShell)
# This script builds and pushes Docker images to ECR

param(
    [switch]$Backend,
    [switch]$Frontend,
    [string]$Region = "us-east-1"
)

# Configuration
$BackendRepo = "bm-gotyaback-backend"
$FrontendRepo = "bm-gotyaback-frontend"

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

# ECR URIs
$EcrUri = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"
$BackendEcr = "$EcrUri/$BackendRepo"
$FrontendEcr = "$EcrUri/$FrontendRepo"

# Function to ensure repository exists
function Ensure-Repository {
    param([string]$RepoName)

    Write-Info "Checking if ECR repository '$RepoName' exists..."
    try {
        $RepoExists = aws ecr describe-repositories --repository-names $RepoName --region $Region 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Repository doesn't exist. Creating..."
            aws ecr create-repository --repository-name $RepoName --region $Region
            if ($LASTEXITCODE -eq 0) {
                Write-Info "✓ Repository '$RepoName' created successfully"
            } else {
                throw "Failed to create repository"
            }
        } else {
            Write-Info "✓ Repository '$RepoName' already exists"
        }
    } catch {
        Write-Error-Custom "Failed to check/create repository: $_"
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

# Function to build and push image
function Build-And-Push {
    param(
        [string]$Service,
        [string]$Repo,
        [string]$Dir
    )
    
    Write-Info "Building $Service image..."
    Push-Location $Dir
    
    try {
        docker build -t $Service .
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        Write-Info "Tagging $Service image..."
        docker tag "${Service}:latest" "${Repo}:latest"
        
        Write-Info "Pushing $Service image to ECR..."
        docker push "${Repo}:latest"
        if ($LASTEXITCODE -ne 0) {
            throw "Docker push failed"
        }
        
        Write-Info "✓ $Service image pushed successfully"
    } catch {
        Write-Error-Custom "Failed to build/push $Service : $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Determine what to deploy
$DeployBackend = $Backend
$DeployFrontend = $Frontend

if (-not $Backend -and -not $Frontend) {
    # No arguments, deploy both
    $DeployBackend = $true
    $DeployFrontend = $true
}

# Deploy backend
if ($DeployBackend) {
    Write-Info "=== Deploying Backend ==="
    Ensure-Repository -RepoName $BackendRepo
    Build-And-Push -Service "backend" -Repo $BackendEcr -Dir "backend"
}

# Deploy frontend
if ($DeployFrontend) {
    Write-Info "=== Deploying Frontend ==="
    Ensure-Repository -RepoName $FrontendRepo
    
    # Check if .env.production exists
    if (-not (Test-Path "frontend\.env.production")) {
        Write-Warn "frontend\.env.production not found!"
        Write-Warn "Please create it with:"
        Write-Warn "  VITE_API_URL=https://your-backend-url.awsapprunner.com/api"
        Write-Warn "  VITE_STRIPE_PUBLIC_KEY=pk_live_..."
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    }
    
    Build-And-Push -Service "frontend" -Repo $FrontendEcr -Dir "frontend"
}

Write-Info "=== Deployment Complete ==="
Write-Info "Backend ECR: ${BackendEcr}:latest"
Write-Info "Frontend ECR: ${FrontendEcr}:latest"
Write-Info ""
Write-Info "Next steps:"
Write-Info "1. Go to AWS App Runner console"
Write-Info "2. Create or update your services with these images"
Write-Info "3. Configure environment variables"
Write-Info "4. Deploy!"

