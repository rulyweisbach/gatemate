#!/usr/bin/env bash
#
# One-time AWS infrastructure bootstrap for GateMate Phase 1.
# Creates: private S3 bucket + CloudFront CDN + GitHub OIDC deploy role.
#
# Prerequisites:
#   - AWS CLI installed and configured (`aws configure`)
#   - Permissions to create S3, CloudFront, and IAM resources
#
# Usage:
#   ./infra/deploy-infra.sh
#
set -euo pipefail

STACK_NAME="gatemate-frontend"
# S3 origin lives here. CloudFront + OIDC + IAM are global (region-independent).
# The ACM cert for CloudFront is the one exception — it must be in us-east-1.
REGION="${AWS_REGION:-il-central-1}"
GITHUB_ORG="rulyweisbach"
GITHUB_REPO="gatemate"
GITHUB_BRANCH="main"

# Custom domain (leave DOMAIN_NAME empty to deploy without a custom domain).
# The ACM cert must be ISSUED and in us-east-1.
DOMAIN_NAME="${DOMAIN_NAME:-gatemate.vip}"
ACM_CERT_ARN="${ACM_CERT_ARN:-arn:aws:acm:us-east-1:532993682128:certificate/ad22c34c-4bf9-4163-9dbc-4e60e082ad4c}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-Z06861331G5R0EU7AQEGT}"

echo "▶ Deploying CloudFormation stack '$STACK_NAME' in $REGION ..."

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$(dirname "$0")/cloudformation.yml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      GitHubOrg="$GITHUB_ORG" \
      GitHubRepo="$GITHUB_REPO" \
      GitHubBranch="$GITHUB_BRANCH" \
      DomainName="$DOMAIN_NAME" \
      AcmCertificateArn="$ACM_CERT_ARN" \
      HostedZoneId="$HOSTED_ZONE_ID"

echo ""
echo "✅ Stack deployed. Fetching outputs ..."
echo ""

aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

echo ""
echo "Next: add these as GitHub repo secrets (Settings → Secrets → Actions):"
echo "  AWS_DEPLOY_ROLE_ARN          = DeployRoleArn output above"
echo "  S3_BUCKET                    = SiteBucketName output above"
echo "  CLOUDFRONT_DISTRIBUTION_ID   = DistributionId output above"
echo "  AWS_REGION                   = $REGION"
echo ""
echo "Then push to main and GitHub Actions will deploy automatically."
