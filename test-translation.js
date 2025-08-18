/**
 * Translation Agent Test
 * Simple test to demonstrate translation functionality
 */

console.log('🚀 Translation Agent Test');
console.log('=' .repeat(50));

// Mock Translation Agent for demonstration
class MockTranslationAgent {
  constructor() {
    console.log('🤖 Mock Translation Agent initialized');
  }

  async translate(request) {
    console.log(`🌐 Translating to ${request.targetLanguage}...`);
    
    const { content, targetLanguage } = request;
    
    // Simple translation patterns
    const translations = {
      'spanish': {
        'dragon': 'dragón',
        'legendary': 'legendario',
        'creature': 'criatura',
        'folklore': 'folclore',
        'culture': 'cultura',
        'worldwide': 'mundial',
        'winged': 'alado',
        'fire-breathing': 'que respira fuego',
        'eastern': 'oriental',
        'western': 'occidental',
        'serpentine': 'serpentino',
        'intelligence': 'inteligencia',
        'reptilian': 'reptiliano',
        'mammalian': 'mamífero',
        'avian': 'aviar',
        'features': 'características',
        'word': 'palabra',
        'language': 'idioma',
        'century': 'siglo',
        'meaning': 'significado',
        'serpent': 'serpiente',
        'mythological': 'mitológico'
      },
      'french': {
        'dragon': 'dragon',
        'legendary': 'légendaire',
        'creature': 'créature',
        'folklore': 'folklore',
        'culture': 'culture',
        'worldwide': 'mondial',
        'winged': 'ailé',
        'fire-breathing': 'qui crache du feu',
        'eastern': 'oriental',
        'western': 'occidental',
        'serpentine': 'serpentin',
        'intelligence': 'intelligence',
        'reptilian': 'reptilien',
        'mammalian': 'mammifère',
        'avian': 'avien',
        'features': 'caractéristiques',
        'word': 'mot',
        'language': 'langue',
        'century': 'siècle',
        'meaning': 'signification',
        'serpent': 'serpent',
        'mythological': 'mythologique'
      },
      'german': {
        'dragon': 'Drache',
        'legendary': 'legendär',
        'creature': 'Kreatur',
        'folklore': 'Folklore',
        'culture': 'Kultur',
        'worldwide': 'weltweit',
        'winged': 'geflügelt',
        'fire-breathing': 'feuerspeiend',
        'eastern': 'östlich',
        'western': 'westlich',
        'serpentine': 'schlangenartig',
        'intelligence': 'Intelligenz',
        'reptilian': 'reptilisch',
        'mammalian': 'säugetierartig',
        'avian': 'vogelartig',
        'features': 'Merkmale',
        'word': 'Wort',
        'language': 'Sprache',
        'century': 'Jahrhundert',
        'meaning': 'Bedeutung',
        'serpent': 'Schlange',
        'mythological': 'mythologisch'
      }
    };

    let translatedText = content;
    const patterns = translations[targetLanguage.toLowerCase()] || {};
    
    for (const [english, translation] of Object.entries(patterns)) {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation);
    }

    return {
      translatedText,
      sourceLanguage: 'en',
      targetLanguage,
      confidence: 0.8,
      service: 'mock_translation_agent',
      wordCount: translatedText.split(/\s+/).length,
      processingTime: Math.random() * 1000 + 500
    };
  }

  async detectLanguage(text) {
    const patterns = {
      'spanish': /[áéíóúñü]/i,
      'french': /[àâäéèêëïîôöùûüÿç]/i,
      'german': /[äöüß]/i,
      'chinese': /[\u4e00-\u9fff]/,
      'japanese': /[\u3040-\u309f\u30a0-\u30ff]/,
      'korean': /[\uac00-\ud7af]/,
      'arabic': /[\u0600-\u06ff]/,
      'russian': /[\u0400-\u04ff]/
    };

    for (const [language, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return language;
      }
    }
    return 'en';
  }
}

// Test the Translation Agent
async function testTranslationAgent() {
  const agent = new MockTranslationAgent();

  console.log('\n📝 Test 1: Simple Translation');
  console.log('-' .repeat(30));

  const sampleText = `
  Dragons are legendary creatures that appear in the folklore of multiple cultures worldwide. 
  They are typically depicted as large, serpentine creatures with various features depending on the culture.
  Eastern dragons are usually depicted as wingless, four-legged, serpentine creatures with above-average intelligence.
  `;

  console.log('Original Text:');
  console.log(sampleText);

  const request = {
    content: sampleText,
    targetLanguage: 'spanish',
    preserveFormatting: true
  };

  try {
    const result = await agent.translate(request);
    
    console.log('\n✅ Translation Result:');
    console.log(`Translated Text: ${result.translatedText}`);
    console.log(`Source Language: ${result.sourceLanguage}`);
    console.log(`Target Language: ${result.targetLanguage}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Service: ${result.service}`);
    console.log(`Word Count: ${result.wordCount}`);
    console.log(`Processing Time: ${result.processingTime}ms`);

  } catch (error) {
    console.error('❌ Translation failed:', error);
  }

  console.log('\n📝 Test 2: Multiple Languages');
  console.log('-' .repeat(30));

  const shortText = "Dragons are legendary creatures found in folklore worldwide.";
  const languages = ['spanish', 'french', 'german'];

  for (const language of languages) {
    try {
      console.log(`\n🔄 Translating to ${language.toUpperCase()}...`);
      
      const result = await agent.translate({
        content: shortText,
        targetLanguage: language
      });

      console.log(`✅ ${language.toUpperCase()}: ${result.translatedText}`);
      console.log(`   Confidence: ${result.confidence}, Service: ${result.service}`);

    } catch (error) {
      console.error(`❌ ${language} translation failed:`, error);
    }
  }

  console.log('\n📝 Test 3: Language Detection');
  console.log('-' .repeat(30));

  const texts = [
    "Dragons are legendary creatures.",
    "Los dragones son criaturas legendarias.",
    "Les dragons sont des créatures légendaires.",
    "Drachen sind legendäre Kreaturen."
  ];

  for (const text of texts) {
    try {
      const detectedLanguage = await agent.detectLanguage(text);
      console.log(`Text: "${text}"`);
      console.log(`Detected Language: ${detectedLanguage}`);
      console.log('---');
    } catch (error) {
      console.error(`Language detection failed for: "${text}"`, error);
    }
  }

  console.log('\n🎉 Translation Agent Test Completed!');
  console.log('=' .repeat(50));
}

// Run the test
testTranslationAgent().catch(console.error); 