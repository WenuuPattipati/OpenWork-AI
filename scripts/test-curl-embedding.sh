#!/bin/bash
# Load env vars
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "Testing text-embedding-004..."
curl -s -X POST -H "Content-Type: application/json" -H "x-goog-api-key: $GEMINI_API_KEY" \
  -d '{"content": {"parts":[{"text": "Hello world"}]}}' \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"

echo -e "\n\nTesting gemini-2.0-flash-exp..."
curl -s -X POST -H "Content-Type: application/json" -H "x-goog-api-key: $GEMINI_API_KEY" \
  -d '{"content": {"parts":[{"text": "Hello world"}]}}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:embedContent"
