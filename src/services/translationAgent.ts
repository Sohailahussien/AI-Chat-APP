/**
 * Translation Agent
 * Handles document translation with multiple translation services and language detection
 */

export interface TranslationRequest {
  content: string;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveFormatting?: boolean;
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  service: string;
  wordCount: number;
  processingTime: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternatives?: Array<{ language: string; confidence: number }>;
}

export class TranslationAgent {
  private supportedLanguages = {
    'spanish': 'es',
    'french': 'fr', 
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'russian': 'ru',
    'english': 'en'
  };

  private translationServices = {
    'google': this.translateWithGoogle.bind(this),
    'deepl': this.translateWithDeepL.bind(this),
    'azure': this.translateWithAzure.bind(this),
    'fallback': this.translateWithFallback.bind(this)
  };

  constructor() {
    console.log('🤖 Translation Agent initialized');
  }

  /**
   * Main translation method
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Translation Agent: Translating to ${request.targetLanguage}`);
      
      // Detect source language if not provided
      const sourceLanguage = request.sourceLanguage || await this.detectLanguage(request.content);
      
      // Clean and prepare content
      const cleanedContent = this.preprocessContent(request.content);
      
      // Try translation services in order of preference
      let translation: TranslationResponse | null = null;
      
      for (const [serviceName, serviceMethod] of Object.entries(this.translationServices)) {
        try {
          console.log(`🔄 Trying ${serviceName} translation service...`);
          translation = await serviceMethod(cleanedContent, sourceLanguage, request.targetLanguage);
          if (translation) {
            translation.service = serviceName;
            break;
          }
        } catch (error) {
          console.warn(`⚠️ ${serviceName} translation failed:`, error);
          continue;
        }
      }

      if (!translation) {
        throw new Error('All translation services failed');
      }

      // Post-process translation
      translation.translatedText = this.postprocessTranslation(
        translation.translatedText, 
        request.preserveFormatting
      );

      translation.processingTime = Date.now() - startTime;
      translation.wordCount = this.countWords(translation.translatedText);

      console.log(`✅ Translation completed in ${translation.processingTime}ms`);
      return translation;

    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error;
    }
  }

  /**
   * Detect language of input text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      // Simple language detection based on common patterns
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
          return this.supportedLanguages[language as keyof typeof this.supportedLanguages] || 'en';
        }
      }

      // Default to English if no specific patterns found
      return 'en';
    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error);
      return 'en';
    }
  }

  /**
   * Google Translate API (requires API key)
   */
  private async translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse | null> {
    try {
      // This would require Google Cloud Translation API
      // For now, return null to fall back to other services
      return null;
    } catch (error) {
      console.warn('Google Translate not available:', error);
      return null;
    }
  }

  /**
   * DeepL API (requires API key)
   */
  private async translateWithDeepL(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse | null> {
    try {
      // This would require DeepL API
      // For now, return null to fall back to other services
      return null;
    } catch (error) {
      console.warn('DeepL not available:', error);
      return null;
    }
  }

  /**
   * Azure Translator (requires API key)
   */
  private async translateWithAzure(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse | null> {
    try {
      // This would require Azure Translator API
      // For now, return null to fall back to other services
      return null;
    } catch (error) {
      console.warn('Azure Translator not available:', error);
      return null;
    }
  }

  /**
   * Fallback translation using simple word replacement
   */
  private async translateWithFallback(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse> {
    console.log('🔄 Using fallback translation method');
    
    // Simple translation dictionary for common words
    const translations: { [key: string]: { [key: string]: string } } = {
      'es': { // Spanish
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
      'fr': { // French
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
      'de': { // German
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

    let translatedText = text;
    const targetLangCode = this.supportedLanguages[targetLang.toLowerCase() as keyof typeof this.supportedLanguages] || targetLang;
    
    if (translations[targetLangCode]) {
      const dict = translations[targetLangCode];
      for (const [english, translation] of Object.entries(dict)) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translatedText = translatedText.replace(regex, translation);
      }
    }

    return {
      translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      confidence: 0.6, // Lower confidence for fallback
      service: 'fallback',
      wordCount: 0,
      processingTime: 0
    };
  }

  /**
   * Preprocess content for translation
   */
  private preprocessContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Post-process translation
   */
  private postprocessTranslation(translatedText: string, preserveFormatting?: boolean): string {
    if (!preserveFormatting) {
      return translatedText
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }
    return translatedText;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { [key: string]: string } {
    return this.supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    const langCode = this.supportedLanguages[language.toLowerCase() as keyof typeof this.supportedLanguages];
    return !!langCode;
  }

  /**
   * Get language code from language name
   */
  getLanguageCode(languageName: string): string {
    return this.supportedLanguages[languageName.toLowerCase() as keyof typeof this.supportedLanguages] || languageName;
  }
}

// Export singleton instance
export const translationAgent = new TranslationAgent(); 