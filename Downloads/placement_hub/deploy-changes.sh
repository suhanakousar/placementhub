#!/bin/bash

# Deployment script to ensure all changes are committed and pushed

echo "🔍 Checking git status..."
git status

echo ""
echo "📦 Adding all modified and new files..."
git add client/src/components/Leaderboard/LeaderboardTable.jsx
git add client/src/pages/StudentProfileView.js
git add client/src/pages/Student/CompetitiveProfile.js
git add client/src/App.js
git add client/src/pages/Student/DashboardHome.js
git add client/src/components/Leaderboard/Leaderboard.jsx
git add client/src/components/Layout/Sidebar.js
git add client/src/pages/Student/StudentDashboard.js
git add server/routes/students.js
git add server/services/codingPlatformService.js

echo ""
echo "💾 Committing changes..."
git commit -m "Add competitive profile dashboard, leaderboard table, and clickable student profiles

- Add CompetitiveProfile component with rating cards and charts
- Add LeaderboardTable component for simple table view
- Add StudentProfileView for public profile access
- Make leaderboard rows clickable to open profiles in new tabs
- Optimize leaderboard API to use cached data
- Add public routes for student profile viewing"

echo ""
echo "🚀 Pushing to remote..."
git push origin master

echo ""
echo "✅ Deployment complete! Now:"
echo "1. Go to your deployment platform (Render/Vercel)"
echo "2. Clear build cache"
echo "3. Trigger a new deployment"
echo "4. Clear browser cache (Ctrl+Shift+R)"


