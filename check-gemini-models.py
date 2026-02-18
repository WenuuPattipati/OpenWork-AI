#!/usr/bin/env python3
"""
Check what Gemini models are available through Google AI Studio
"""

import os
import json
import urllib.request
import ssl

# Fix SSL certificate issues on macOS
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def load_env_file():
    """Load environment variables from .env.local"""
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def check_gemini_models():
    """Check available Gemini models through Google AI Studio"""
    
    load_env_file()
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        print("❌ No GEMINI_API_KEY found")
        return
    
    print("🤖 Checking Gemini Models via Google AI Studio")
    print("=" * 50)
    print(f"API Key: {gemini_key[:10]}...{gemini_key[-4:]}")
    print()
    
    try:
        # List models
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
        
        req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        models = result.get('models', [])
        
        if not models:
            print("❌ No models found")
            return
        
        print(f"✅ Found {len(models)} models")
        print()
        
        # Categorize models
        flash_models = []
        pro_models = []
        embedding_models = []
        other_models = []
        
        for model in models:
            name = model.get('name', '').replace('models/', '')
            display_name = model.get('displayName', '')
            supported_methods = model.get('supportedGenerationMethods', [])
            
            if 'flash' in name.lower():
                flash_models.append((name, display_name, supported_methods))
            elif 'pro' in name.lower():
                pro_models.append((name, display_name, supported_methods))
            elif 'embedding' in name.lower():
                embedding_models.append((name, display_name, supported_methods))
            else:
                other_models.append((name, display_name, supported_methods))
        
        # Print Flash models
        print("⚡ Flash Models:")
        for name, display_name, methods in flash_models:
            methods_str = ', '.join(methods)
            print(f"  - {name}")
            print(f"    Display: {display_name}")
            print(f"    Methods: {methods_str}")
            print()
        
        # Print Pro models
        print("🚀 Pro Models:")
        for name, display_name, methods in pro_models:
            methods_str = ', '.join(methods)
            print(f"  - {name}")
            print(f"    Display: {display_name}")
            print(f"    Methods: {methods_str}")
            print()
        
        # Print Embedding models
        print("🔤 Embedding Models:")
        for name, display_name, methods in embedding_models:
            methods_str = ', '.join(methods)
            print(f"  - {name}")
            print(f"    Display: {display_name}")
            print(f"    Methods: {methods_str}")
            print()
        
        # Test a working model
        if flash_models:
            test_model = flash_models[0][0]
            print(f"🧪 Testing model: {test_model}")
            
            test_url = f"https://generativelanguage.googleapis.com/v1beta/models/{test_model}:generateContent?key={gemini_key}"
            
            data = {
                "contents": [{
                    "parts": [{"text": "Say 'Hello from Gemini!'"}]
                }],
                "generationConfig": {
                    "temperature": 0,
                    "maxOutputTokens": 10
                }
            }
            
            data_json = json.dumps(data).encode('utf-8')
            
            req = urllib.request.Request(
                test_url,
                data=data_json,
                headers={'Content-Type': 'application/json'}
            )
            
            try:
                with urllib.request.urlopen(req, context=ssl_context) as response:
                    result = json.loads(response.read().decode('utf-8'))
                
                candidates = result.get('candidates', [])
                if candidates:
                    text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    print(f"✅ Test successful: '{text.strip()}'")
                else:
                    print(f"❌ No response: {result}")
            
            except Exception as e:
                print(f"❌ Test failed: {e}")
        
        print()
        print("🎯 Recommendations:")
        if flash_models:
            print(f"Use Flash model: {flash_models[0][0]}")
        if pro_models:
            print(f"Use Pro model: {pro_models[0][0]}")
        if embedding_models:
            print(f"Use Embedding model: {embedding_models[0][0]}")
    
    except Exception as e:
        print(f"❌ Error checking models: {e}")

if __name__ == "__main__":
    check_gemini_models()