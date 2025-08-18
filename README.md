# AI Chat App

A real-time chat application built with Next.js and ChromaDB.

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
pip install chromadb
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Anthropic API key to `.env.local`

```bash
# Windows
copy .env.example .env.local

# Unix/macOS
cp .env.example .env.local
```

4. Update `.env.local` with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The following environment variables are required:

- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `ANTHROPIC_MODEL`: The Anthropic model to use (defaults to claude-3-opus-20240229)
- `CHROMA_COLLECTION_NAME`: Name of the ChromaDB collection (defaults to 'documents')
- `CHROMA_EMBEDDING_MODEL`: Model to use for embeddings (defaults to Xenova/all-MiniLM-L6-v2)

## Security Note

Never commit `.env.local` or any other files containing real API keys to version control. The `.env.local` file is listed in `.gitignore` for your security.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
