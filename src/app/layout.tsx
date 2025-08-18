
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'fallback',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
});

export const metadata: Metadata = {
  title: 'Cubi AI - Intelligent AI Assistant',
  description: 'Experience the future of AI-powered conversations with Cubi AI. Upload documents, chat with AI, and get intelligent responses.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  keywords: ['AI', 'Chat', 'Document Analysis', 'Artificial Intelligence', 'Cubi'],
  authors: [{ name: 'Cubi AI Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
