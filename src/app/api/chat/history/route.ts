import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: decoded.userId
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save or update a chat
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { chatId, title, messages } = await request.json();

    // Create or update chat
    const chat = await prisma.chat.upsert({
      where: {
        id: chatId
      },
      update: {
        title,
        updatedAt: new Date(),
        messages: {
          deleteMany: {},
          create: messages.map((msg: any, index: number) => ({
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp || new Date(),
            order: index
          }))
        }
      },
      create: {
        id: chatId,
        title,
        userId: decoded.userId,
        messages: {
          create: messages.map((msg: any, index: number) => ({
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp || new Date(),
            order: index
          }))
        }
      },
      include: {
        messages: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear all chats for user
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Delete all chats and their messages for the user
    await prisma.chat.deleteMany({
      where: {
        userId: decoded.userId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
