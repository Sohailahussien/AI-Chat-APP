import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  const health: Record<string, any> = {
    node: true,
    python: false,
    chromadb: false,
    details: {},
  };

  // Check Python script health
  try {
    const scriptPath = path.join(process.cwd(), 'src', 'services', 'ragPipelineService.py');
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" --query "healthcheck" 1`);
    if (stderr) {
      health.details.python_stderr = stderr;
    }
    // Try to parse output as JSON
    try {
      const result = JSON.parse(stdout);
      health.python = true;
      // If ChromaDB returns a valid structure, mark as healthy
      if (result && typeof result === 'object' && 'documents' in result) {
        health.chromadb = true;
      } else {
        health.details.chromadb_output = result;
      }
    } catch (e) {
      health.details.python_output = stdout;
      health.details.python_json_error = String(e);
    }
  } catch (err: any) {
    health.details.python_error = err.stderr || String(err.error || err);
  }

  return NextResponse.json(health);
} 