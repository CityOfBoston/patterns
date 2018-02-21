#!/bin/bash

set -o errexit -o nounset

# Invalidate CloudFront distribution
pip install --upgrade --user awscli
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths '/*'
