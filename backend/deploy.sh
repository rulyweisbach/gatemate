#!/usr/bin/env bash
#
# Deploy the GateMate backend (plain CloudFormation — no SAM transform).
# Zips the Lambda code, uploads it to an artifacts bucket, then deploys
# the stack in il-central-1.
#
set -euo pipefail

REGION="il-central-1"
STACK="gatemate-backend"
HERE="$(cd "$(dirname "$0")" && pwd)"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
ARTIFACT_BUCKET="gatemate-artifacts-${REGION}-${ACCOUNT}"

echo "▶ Ensuring artifacts bucket: $ARTIFACT_BUCKET"
if ! aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
fi

echo "▶ Packaging Lambda code"
rm -f "$HERE/code.zip"
( cd "$HERE/src" && zip -rq "$HERE/code.zip" . )
HASH="$(shasum -a 256 "$HERE/code.zip" | cut -c1-12)"
KEY="backend/${HASH}.zip"
aws s3 cp "$HERE/code.zip" "s3://${ARTIFACT_BUCKET}/${KEY}" >/dev/null
echo "  uploaded s3://${ARTIFACT_BUCKET}/${KEY}"

echo "▶ Deploying CloudFormation stack '$STACK'"
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK" \
  --template-file "$HERE/stack.yaml" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      CodeS3Bucket="$ARTIFACT_BUCKET" \
      CodeS3Key="$KEY"

echo ""
echo "✅ Deployed. Outputs:"
aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs" --output table
