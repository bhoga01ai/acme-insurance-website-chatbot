#!/bin/bash

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "You need to login to Vercel first"
    vercel login
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete! Your site should be live soon."