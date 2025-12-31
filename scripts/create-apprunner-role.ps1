# Create IAM Role for App Runner to access ECR
# This script creates the necessary IAM role and attaches the required policy

Write-Host "[INFO] Creating IAM role for App Runner ECR access..." -ForegroundColor Green

# Create trust policy document with both required service principals
$TrustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "build.apprunner.amazonaws.com",
          "tasks.apprunner.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

# Save trust policy to temp file
$TrustPolicyFile = "trust-policy.json"
$TrustPolicy | Out-File -FilePath $TrustPolicyFile -Encoding utf8

try {
    # Check if role exists
    $RoleExists = aws iam get-role --role-name AppRunnerECRAccessRole 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[INFO] Role already exists. Updating trust policy..." -ForegroundColor Yellow
        # Update the trust policy
        aws iam update-assume-role-policy `
            --role-name AppRunnerECRAccessRole `
            --policy-document file://$TrustPolicyFile

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] ✓ Trust policy updated" -ForegroundColor Green
        }
    } else {
        # Create the role
        Write-Host "[INFO] Creating role 'AppRunnerECRAccessRole'..." -ForegroundColor Green
        aws iam create-role `
            --role-name AppRunnerECRAccessRole `
            --assume-role-policy-document file://$TrustPolicyFile `
            --description "Allows App Runner to access ECR repositories"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] ✓ Role created" -ForegroundColor Green
        } else {
            throw "Failed to create role"
        }
    }
    
    # Attach the AWS managed policy for ECR access
    Write-Host "[INFO] Attaching ECR access policy..." -ForegroundColor Green
    aws iam attach-role-policy `
        --role-name AppRunnerECRAccessRole `
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] ✓ IAM role created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Role ARN: arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AppRunnerECRAccessRole" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go back to App Runner console" -ForegroundColor White
        Write-Host "2. In 'Source and deployment' section:" -ForegroundColor White
        Write-Host "   - Deployment settings: Automatic or Manual" -ForegroundColor White
        Write-Host "   - ECR access role: Select 'AppRunnerECRAccessRole'" -ForegroundColor White
        Write-Host "3. Continue with the rest of the configuration" -ForegroundColor White
        Write-Host "4. Deploy!" -ForegroundColor White
    } else {
        Write-Host "[ERROR] Failed to attach policy" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to create role: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file
    if (Test-Path $TrustPolicyFile) {
        Remove-Item $TrustPolicyFile
    }
}

