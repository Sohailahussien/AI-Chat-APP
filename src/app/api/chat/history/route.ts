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

    // Validate input
    if (!chatId || !title || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Check if chat exists first
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    let chat;
    if (existingChat) {
      // Update existing chat
      chat = await prisma.chat.update({
        where: { id: chatId },
        data: {
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
        include: {
          messages: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
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
    }

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
