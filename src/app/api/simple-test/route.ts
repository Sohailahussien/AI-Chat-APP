import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET() {
  return new Promise<Response>((resolve) => {
    try {
      console.log('Testing simple Python execution...');
      
      const pythonProcess = spawn('python', ['--version'], {
        cwd: process.cwd()
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
        console.log('Python version output:', stdout);
        console.log('Python version stderr:', stderr);
        console.log('Python process exited with code:', code);
        
        resolve(NextResponse.json({
          success: code === 0,
          pythonVersion: stdout.trim(),
          stderr: stderr,
          exitCode: code
        }));
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        resolve(NextResponse.json({
          success: false,
          error: error.message
        }));
      });
      
    } catch (error: any) {
      console.error('Test failed:', error);
      resolve(NextResponse.json({
        success: false,
        error: error.message
      }));
    }
  });
} 