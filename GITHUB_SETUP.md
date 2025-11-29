# GitHub Repository Setup

Your theme is ready to push to GitHub! Follow these steps:

## Option 1: Using GitHub CLI (if installed)

```bash
cd "/Users/dennisdang/Downloads/Shopify Theme"
gh repo create shopify-theme --public --source=. --remote=origin --push
```

## Option 2: Manual Setup

### 1. Create Repository on GitHub
- Go to https://github.com/new
- Repository name: `shopify-theme` (or your choice)
- Choose Public or Private
- **DO NOT** initialize with README, .gitignore, or license
- Click "Create repository"

### 2. Connect and Push
```bash
cd "/Users/dennisdang/Downloads/Shopify Theme"
git remote add origin https://github.com/YOUR_USERNAME/shopify-theme.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Connect to Shopify

Once your repo is on GitHub:

1. Go to your Shopify Partners account: https://partners.shopify.com
2. Select your store
3. Go to **Online Store > Themes**
4. Click **"Add theme" > "Connect from GitHub"**
5. Authorize Shopify to access your GitHub
6. Select your repository
7. Choose the branch (usually `main`)
8. Click **"Connect theme"**

Now any push to GitHub will automatically sync to your Shopify store!

## Quick Commands Reference

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull from GitHub
git pull
```

