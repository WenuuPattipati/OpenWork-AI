#!/bin/bash

# Security Check Script for OpenWork AI
# Run this before pushing to GitHub

echo "🔒 Running Security Checks..."
echo ""

# Check 1: Verify .env.local is not tracked
echo "✓ Checking if .env.local is ignored..."
if git ls-files | grep -q ".env.local"; then
    echo "❌ ERROR: .env.local is tracked by git!"
    echo "   Run: git rm --cached .env.local"
    exit 1
else
    echo "✅ .env.local is properly ignored"
fi

# Check 2: Search for Gemini/Google API keys
echo ""
echo "✓ Checking for Gemini/Google API keys..."
if git grep -qE "['\"[:space:]]sk-(proj-)?[A-Za-z0-9]{20,}" -- ':!scripts/check-security.sh' 2>/dev/null; then
    echo "❌ ERROR: Gemini/Google API key found in tracked files!"
    git grep -E "['\"[:space:]]sk-(proj-)?[A-Za-z0-9]{20,}" -- ':!scripts/check-security.sh'
    exit 1
else
    echo "✅ No Gemini/Google API keys found"
fi

# Check 3: Search for Tavily API keys
echo ""
echo "✓ Checking for Tavily API keys..."
if git grep -q "tvly-" -- ':!scripts/check-security.sh' 2>/dev/null; then
    echo "❌ ERROR: Tavily API key found in tracked files!"
    git grep "tvly-" -- ':!scripts/check-security.sh'
    exit 1
else
    echo "✅ No Tavily API keys found"
fi

# Check 4: Search for NCBI API keys
echo ""
echo "✓ Checking for NCBI API keys..."
if git grep -qE "[a-f0-9]{32}" 2>/dev/null; then
    echo "⚠️  WARNING: Potential NCBI API key pattern found. Please review:"
    git grep -E "[a-f0-9]{32}"
else
    echo "✅ No NCBI API key patterns found"
fi

# Check 5: Search for Serper API keys
echo ""
echo "✓ Checking for Serper API keys..."
if git grep -qE "[a-f0-9]{40}" 2>/dev/null; then
    echo "⚠️  WARNING: Potential Serper API key pattern found. Please review:"
    git grep -E "[a-f0-9]{40}"
else
    echo "✅ No Serper API key patterns found"
fi

# Check 6: Search for generic API key patterns
echo ""
echo "✓ Checking for generic API key patterns..."
if git grep -iE "(api[_-]?key|secret[_-]?key|access[_-]?key).*=.*['\"][a-zA-Z0-9]{20,}['\"]" 2>/dev/null; then
    echo "⚠️  WARNING: Potential API keys found. Please review:"
    git grep -iE "(api[_-]?key|secret[_-]?key|access[_-]?key).*=.*['\"][a-zA-Z0-9]{20,}['\"]"
else
    echo "✅ No generic API key patterns found"
fi

# Check 7: Verify .env.local.example has no real keys
echo ""
echo "✓ Checking .env.local.example..."
if grep -qE "AIzaSy|tvly-|sk-" .env.local.example 2>/dev/null; then
    echo "❌ ERROR: Real API keys found in .env.local.example!"
    exit 1
else
    echo "✅ .env.local.example is clean"
fi

# Check 8: Verify LICENSE file exists
echo ""
echo "✓ Checking for LICENSE file..."
if [ -f "LICENSE" ]; then
    echo "✅ LICENSE file exists"
else
    echo "❌ ERROR: LICENSE file missing!"
    exit 1
fi

# Check 9: Verify .kiro directory exists
echo ""
echo "✓ Checking for .kiro directory..."
if [ -d ".kiro" ]; then
    echo "✅ .kiro directory exists"
else
    echo "⚠️  WARNING: .kiro directory missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Security checks passed!"
echo "✅ Safe to push to GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
