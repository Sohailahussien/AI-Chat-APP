declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(input: any): Promise<ConversionResult>;
  export function extractRawText(input: any): Promise<ConversionResult>;
  export function convertToMarkdown(input: any): Promise<ConversionResult>;
  export function convertToHtml(input: any, options?: any): Promise<ConversionResult>;
  export function extractRawText(input: any, options?: any): Promise<ConversionResult>;
  export function convertToMarkdown(input: any, options?: any): Promise<ConversionResult>;
} 