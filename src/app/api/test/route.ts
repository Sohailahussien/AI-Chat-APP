import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET() {
  return new Promise<Response>((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), 'src', 'services', 'ragPipelineService.py');
      const pythonPath = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
      
      console.log('Testing Python script execution...');
      console.log('Python path:', pythonPath);
      console.log('Script path:', scriptPath);
      
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        '--query',
        'multi-agent orchestration',
        '3'
      ], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONPATH: process.cwd() },
        timeout: 30000
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        console.log('Python script output:', stdout);
        console.log('Python script stderr:', stderr);
        console.log('Python process exited with code:', code);
        
        // Try to parse JSON from output
        let jsonOutput = stdout;
        const jsonMatch = stdout.match(/\{[^{}]*\}/g);
        if (jsonMatch && jsonMatch.length > 0) {
          jsonOutput = jsonMatch[jsonMatch.length - 1];
        }
        
        let parsedResult = null;
        try {
          parsedResult = JSON.parse(jsonOutput);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          parsedResult = { error: 'Failed to parse JSON', raw: stdout };
        }
        
        resolve(NextResponse.json({
          success: code === 0,
          pythonOutput: stdout,
          pythonStderr: stderr,
          exitCode: code,
          parsedResult: parsedResult,
          documentsFound: parsedResult?.documents?.length || 0
        }));
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        resolve(NextResponse.json({
          success: false,
          error: error.message,
          stdout: '',
          stderr: ''
        }));
      });
      
    } catch (error: any) {
      console.error('Test failed:', error);
      resolve(NextResponse.json({
        success: false,
        error: error.message,
        stdout: '',
        stderr: ''
      }));
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      status: 'POST request received',
      body 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid JSON body' 
    }, { 
      status: 400 
    });
  }
} 