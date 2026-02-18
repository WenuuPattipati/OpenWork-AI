
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

async function checkEmbedding() {
    console.log('🧪 Testing Gemini Embedding Dimension...');
    
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in env');
        return;
    }

    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = 'models/text-embedding-004';
        
        console.log(`   Model: ${model}`);
        console.log('   Generating embedding for: "cancer treatment guidelines"');

        const result = await genAI.models.embedContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: "cancer treatment guidelines" }] }],
            config: {
                outputDimensionality: 768
            }
        });

        const values = result.embeddings?.[0]?.values;
        if (values) {
            console.log(`\n   ✅ Embedding Generated!`);
            console.log(`   📏 Dimensions: ${values.length}`);
            
            if (values.length === 768) {
                console.log('   ✅ PASSED: 768 dimensions confirmed.');
            } else {
                console.error(`   ❌ FAILED: Expected 768, got ${values.length}`);
            }
        } else {
            console.error('   ❌ No embedding values returned.');
        }

    } catch (error) {
        console.error('❌ Embedding Test Failed:', error.message);
    }
}

checkEmbedding();
