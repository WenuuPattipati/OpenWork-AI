#!/bin/bash

# Open Work Setup Script for Limitless.ai Project
# Sets up Google Cloud connection and Indian Guidelines processing

set -e  # Exit on any error

echo "🚀 Setting up Open Work - Evidence-First Medical Research Platform"
echo "📊 Project: Limitless.ai"
echo "🗂️  Focus: Indian Treatment Guidelines Priority"
echo "=" * 60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found!"
    echo "Please ensure .env.local is configured with:"
    echo "  - GOOGLE_CLOUD_PROJECT_ID=limitless-ai"
    echo "  - GOOGLE_CLOUD_STORAGE_BUCKET=limitless-ai-indian-guidelines"
    echo "  - GEMINI_API_KEY=your_api_key"
    exit 1
fi

print_status ".env.local file found"

# Check if service account key exists
if [ ! -f "gcp-service-account.json" ]; then
    print_warning "Google Cloud service account key not found"
    echo "Please follow these steps:"
    echo "1. Go to Google Cloud Console"
    echo "2. Navigate to IAM & Admin > Service Accounts"
    echo "3. Create or select the open-work-service account"
    echo "4. Create a new key (JSON format)"
    echo "5. Download and save as 'gcp-service-account.json' in project root"
    echo ""
    echo "Required permissions:"
    echo "  - Storage Object Viewer (for guidelines bucket)"
    echo "  - Firestore User (for vector database)"
    echo "  - AI Platform User (for embeddings)"
    echo ""
    read -p "Press Enter when service account key is ready..."
fi

if [ -f "gcp-service-account.json" ]; then
    print_status "Service account key found"
else
    print_error "Service account key still not found. Exiting."
    exit 1
fi

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
if command -v npm &> /dev/null; then
    npm install
    print_status "Node.js dependencies installed"
else
    print_error "npm not found. Please install Node.js first."
    exit 1
fi

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    print_error "Python not found. Please install Python 3.8+ first."
    exit 1
fi

print_status "Python found: $PYTHON_CMD"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    print_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv .venv
    print_status "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source .venv/bin/activate

# Install Python dependencies
print_info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_status "Python dependencies installed"

# Test Google Cloud connection
print_info "Testing Google Cloud Platform connection..."
if $PYTHON_CMD scripts/test-gcp-connection.py; then
    print_status "Google Cloud connection test passed"
else
    print_error "Google Cloud connection test failed"
    echo "Please check:"
    echo "1. Service account key is valid"
    echo "2. Required APIs are enabled"
    echo "3. IAM permissions are correct"
    echo "4. Bucket 'limitless-ai-indian-guidelines' exists"
    exit 1
fi

# Check if guidelines bucket has content
print_info "Checking Indian Guidelines bucket content..."
BUCKET_CHECK=$(gsutil ls gs://limitless-ai-indian-guidelines/ 2>/dev/null | wc -l || echo "0")

if [ "$BUCKET_CHECK" -gt "100" ]; then
    print_status "Guidelines bucket contains $BUCKET_CHECK files (expected ~120 PDFs)"
else
    print_warning "Guidelines bucket contains only $BUCKET_CHECK files"
    echo "Expected ~120 PDF files with Indian treatment guidelines"
    echo "Please ensure the bucket is populated with guideline PDFs"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p logs
mkdir -p model_cache
mkdir -p temp
print_status "Directories created"

# Set up Git hooks (optional)
if [ -d ".git" ]; then
    print_info "Setting up Git hooks to prevent credential commits..."
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to prevent committing sensitive files

if git diff --cached --name-only | grep -E "(service-account|credentials|\.env)" > /dev/null; then
    echo "❌ ERROR: Attempting to commit sensitive files!"
    echo "Files that should not be committed:"
    git diff --cached --name-only | grep -E "(service-account|credentials|\.env)"
    echo ""
    echo "Please remove these files from staging:"
    echo "git reset HEAD <filename>"
    exit 1
fi
EOF
    chmod +x .git/hooks/pre-commit
    print_status "Git hooks configured"
fi

# Final setup summary
echo ""
echo "🎉 Open Work setup completed successfully!"
echo "=" * 60
echo ""
echo "📋 Next Steps:"
echo "1. Verify Gemini API key is working:"
echo "   npm run test:gcp"
echo ""
echo "2. Process Indian Guidelines (if not already done):"
echo "   npm run embed:guidelines"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Test the complete pipeline:"
echo "   Open http://localhost:3000"
echo "   Try query: 'What are the Indian guidelines for diabetes management?'"
echo ""
echo "🔧 Configuration Summary:"
echo "  Project: limitless-ai"
echo "  Bucket: limitless-ai-indian-guidelines"
echo "  Primary Model: Gemini 3.0 Pro (synthesis)"
echo "  Fallback Model: Gemini 3.0 Flash"
echo "  Priority: Indian Guidelines → PubMed → Others"
echo ""
echo "📚 Documentation:"
echo "  Setup Guide: gcp-setup-guide.md"
echo "  Project Overview: project.md"
echo "  Skills Reference: skills.md"
echo ""
print_status "Setup complete! Ready for medical evidence synthesis."