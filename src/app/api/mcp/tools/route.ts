import { NextRequest } from 'next/server';
import { DocumentTools } from '@/mcp/tools/documentTools';
import { PostgreSQLMCPServer } from '@/mcp/servers/postgresqlServer';

const documentTools = new DocumentTools();

// Initialize PostgreSQL server if environment variables are available
let postgresqlServer: PostgreSQLMCPServer | null = null;

if (process.env.POSTGRES_HOST && process.env.POSTGRES_DB) {
  postgresqlServer = new PostgreSQLMCPServer({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
  });
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('MCP TOOLS ROUTE HIT');
  try {
    const body = await req.json();
    const { tool, params, serverType = 'chromadb' } = body;
    
    console.log('Tool requested:', tool);
    console.log('Server type:', serverType);
    console.log('Params:', JSON.stringify(params, null, 2));
    
    let result;
    
    // Route to appropriate server based on serverType
    if (serverType === 'postgresql' && postgresqlServer) {
      console.log('Using PostgreSQL server');
      switch (tool) {
        case 'queryDocuments':
          result = await postgresqlServer.queryDocuments(params);
          break;
        case 'addDocument':
          result = await postgresqlServer.addDocument(params);
          break;
        case 'processDocument':
          result = await postgresqlServer.processDocument(params);
          break;
        case 'getDocumentHistory':
          result = await postgresqlServer.getDocumentHistory(params.limit);
          break;
        case 'searchQueries':
          result = await postgresqlServer.searchQueries(params.query, params.limit);
          break;
        default:
          return new Response(JSON.stringify({ error: `Unknown PostgreSQL tool: ${tool}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } else {
      console.log('Using ChromaDB server');
      // Fallback to ChromaDB tools
      switch (tool) {
        case 'queryDocuments':
          console.log('Calling queryDocuments with params:', params);
          result = await documentTools.queryDocuments(params);
          break;
        case 'addDocument':
          console.log('Calling addDocument with params:', params);
          result = await documentTools.addDocument(params);
          break;
        case 'processDocument':
          console.log('Calling processDocument with params:', params);
          result = await documentTools.processDocument(params);
          break;
        default:
          return new Response(JSON.stringify({ error: `Unknown tool: ${tool}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    console.log('Tool result:', JSON.stringify(result, null, 2));
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('MCP Tools API error:', error);
    return new Response(JSON.stringify({ 
      error: 'MCP tools request failed', 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 