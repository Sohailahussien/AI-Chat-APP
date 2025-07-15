# AI Chat App

A real-time chat application built with Next.js and OpenAI.

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key to `.env.local`

```bash
# Windows
copy .env.example .env.local

# Unix/macOS
cp .env.example .env.local
```

4. Update `.env.local` with your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key (get it from [OpenAI Dashboard](https://platform.openai.com/api-keys))

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
