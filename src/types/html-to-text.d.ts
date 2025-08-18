declare module 'html-to-text' {
  export interface HtmlToTextOptions {
    wordwrap?: number;
    longWordSplit?: {
      wrapCharacters?: string[];
      forceWrapOnLimit?: boolean;
    };
    preserveNewlines?: boolean;
    formatters?: Record<string, any>;
    selectors?: Array<{
      selector: string;
      format: string;
    }>;
  }

  export function convert(html: string, options?: HtmlToTextOptions): string;
} 