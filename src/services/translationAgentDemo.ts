/**
 * Translation Agent Demo
 * Demonstrates the Translation Agent capabilities
 */

import { translationAgent, TranslationRequest } from './translationAgent';
import { translationChains } from './translationChains';
import { AgentOrchestrator } from './agentOrchestrator';

export class TranslationAgentDemo {
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  /**
   * Demo 1: Simple Translation
   */
  async demoSimpleTranslation(): Promise<void> {
    console.log('🌐 Demo 1: Simple Translation');
    console.log('=' .repeat(50));

    const sampleText = `
    Dragons are legendary creatures that appear in the folklore of multiple cultures worldwide. 
    They are typically depicted as large, serpentine creatures with various features depending on the culture.
    Eastern dragons are usually depicted as wingless, four-legged, serpentine creatures with above-average intelligence.
    `;

    const request: TranslationRequest = {
      content: sampleText,
      targetLanguage: 'spanish',
      preserveFormatting: true
    };

    try {
      console.log('📝 Original Text:');
      console.log(sampleText);
      console.log('\n🔄 Translating to Spanish...');

      const result = await translationAgent.translate(request);

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
  }

  /**
   * Demo 2: Translation Chain
   */
  async demoTranslationChain(): Promise<void> {
    console.log('\n🌐 Demo 2: Translation Chain');
    console.log('=' .repeat(50));

    const sampleContent = `
    The word "dragon" entered the English language in the early 13th century from Old French "dragon", 
    which comes from Latin "draco" meaning "huge serpent, dragon", from Ancient Greek "δράκων" meaning "serpent".
    `;

    try {
      console.log('📝 Original Content:');
      console.log(sampleContent);
      console.log('\n🔄 Executing translation chain...');

      const result = await translationChains.executeTranslation(
        sampleContent,
        'spanish',
        'simple'
      );

      console.log('\n✅ Chain Execution Result:');
      console.log(`Success: ${result.success}`);
      console.log(`Execution Time: ${result.executionTime}ms`);
      console.log(`Results:`, result.results);
      console.log(`Audit Trail Entries: ${result.auditTrail.length}`);

      // Show audit trail
      console.log('\n📋 Audit Trail:');
      result.auditTrail.forEach((entry: any, index: number) => {
        console.log(`${index + 1}. ${entry.stepId} - ${entry.action} (${entry.duration}ms)`);
      });

    } catch (error) {
      console.error('❌ Translation chain failed:', error);
    }
  }

  /**
   * Demo 3: Multiple Languages
   */
  async demoMultipleLanguages(): Promise<void> {
    console.log('\n🌐 Demo 3: Multiple Languages');
    console.log('=' .repeat(50));

    const sampleText = "Dragons are legendary creatures found in folklore worldwide.";
    const languages = ['spanish', 'french', 'german'];

    for (const language of languages) {
      try {
        console.log(`\n🔄 Translating to ${language.toUpperCase()}...`);

        const request: TranslationRequest = {
          content: sampleText,
          targetLanguage: language
        };

        const result = await translationAgent.translate(request);

        console.log(`✅ ${language.toUpperCase()}: ${result.translatedText}`);
        console.log(`   Confidence: ${result.confidence}, Service: ${result.service}`);

      } catch (error) {
        console.error(`❌ ${language} translation failed:`, error);
      }
    }
  }

  /**
   * Demo 4: Language Detection
   */
  async demoLanguageDetection(): Promise<void> {
    console.log('\n🌐 Demo 4: Language Detection');
    console.log('=' .repeat(50));

    const texts = [
      "Dragons are legendary creatures.",
      "Los dragones son criaturas legendarias.",
      "Les dragons sont des créatures légendaires.",
      "Drachen sind legendäre Kreaturen."
    ];

    for (const text of texts) {
      try {
        const detectedLanguage = await translationAgent.detectLanguage(text);
        console.log(`Text: "${text}"`);
        console.log(`Detected Language: ${detectedLanguage}`);
        console.log('---');
      } catch (error) {
        console.error(`Language detection failed for: "${text}"`, error);
      }
    }
  }

  /**
   * Demo 5: Translation Quality
   */
  async demoTranslationQuality(): Promise<void> {
    console.log('\n🌐 Demo 5: Translation Quality');
    console.log('=' .repeat(50));

    const technicalText = `
    The dragon's morphological features include reptilian scales, mammalian intelligence, 
    and avian flight capabilities. These hybrid characteristics make dragons unique among 
    mythological creatures, combining elements from multiple animal kingdoms.
    `;

    const request: TranslationRequest = {
      content: technicalText,
      targetLanguage: 'spanish',
      preserveFormatting: true,
      context: 'Technical document about dragon biology'
    };

    try {
      console.log('📝 Technical Text:');
      console.log(technicalText);
      console.log('\n🔄 Translating with context awareness...');

      const result = await translationAgent.translate(request);

      console.log('\n✅ Translation Result:');
      console.log(`Translated: ${result.translatedText}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Word Count: ${result.wordCount}`);
      console.log(`Processing Time: ${result.processingTime}ms`);

    } catch (error) {
      console.error('❌ Quality translation failed:', error);
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos(): Promise<void> {
    console.log('🚀 Translation Agent Demo Suite');
    console.log('=' .repeat(50));

    await this.demoSimpleTranslation();
    await this.demoTranslationChain();
    await this.demoMultipleLanguages();
    await this.demoLanguageDetection();
    await this.demoTranslationQuality();

    console.log('\n🎉 All demos completed!');
  }

  /**
   * Get available translation services
   */
  getAvailableServices(): void {
    console.log('\n🔧 Available Translation Services:');
    console.log('=' .repeat(50));

    const languages = translationAgent.getSupportedLanguages();
    console.log('Supported Languages:');
    Object.entries(languages).forEach(([name, code]) => {
      console.log(`  ${name}: ${code}`);
    });

    console.log('\nAvailable Chains:');
    const chains = translationChains.getAvailableChains();
    chains.forEach((chain, index) => {
      console.log(`${index + 1}. ${chain.name}`);
      console.log(`   Description: ${chain.description}`);
      console.log(`   Languages: ${chain.targetLanguages.join(', ')}`);
    });
  }
}

// Export demo instance
export const translationAgentDemo = new TranslationAgentDemo();

// Run demos if this file is executed directly
if (require.main === module) {
  translationAgentDemo.runAllDemos().catch(console.error);
} 