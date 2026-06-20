# GateMate Infrastructure — Phase 1 (Frontend Hosting)

This sets up secure, low-cost static hosting for the GateMate React app on AWS.

## Architecture

```
GitHub (push to main)
   └─> GitHub Actions  ──OIDC (keyless)──>  AWS
                                              ├─ S3 (private bucket, React build)
                                              └─ CloudFront (global CDN + HTTPS + SPA routing)
```

**No long-lived AWS keys are stored anywhere.** GitHub Actions authenticates to AWS
using OIDC and assumes a scoped IAM role that can only touch this project's bucket
and CloudFront distribution, only from the `main` branch.

## One-time setup

### 1. Configure the AWS CLI
```bash
aws configure
# enter your AWS access key, secret, and set region to us-east-1
```

### 2. Deploy the infrastructure
```bash
./infra/deploy-infra.sh
```
This creates the S3 bucket, CloudFront distribution, and GitHub OIDC role.
It prints three values you'll need next.

### 3. Add the outputs as GitHub repo secrets
Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value (from stack outputs) |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn` |
| `S3_BUCKET` | `SiteBucketName` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `DistributionId` |
| `AWS_REGION` | `us-east-1` |

### 4. Deploy
Push to `main` (or run the workflow manually). GitHub Actions builds the app and
deploys it. Your app will be live at the CloudFront URL (`SiteURL` output).

## Cost
At ~100 users this runs within the AWS free tier — roughly **$0–2/month**.

## Updating
Every push to `main` auto-deploys. To change infrastructure, edit
`cloudformation.yml` and re-run `./infra/deploy-infra.sh`.
