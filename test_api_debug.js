const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Python script output...');

const pythonProcess = spawn(
  path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'),
  [path.join(process.cwd(), 'src', 'services', 'ragPipelineService.py'), '--query', 'test document', '3'],
  {
    cwd: process.cwd(),
    env: { ...process.env, PYTHONPATH: process.cwd() }
  }
);

let stdout = '';
let stderr = '';

pythonProcess.stdout.on('data', (data) => {
  stdout += data.toString();
});

pythonProcess.stderr.on('data', (data) => {
  stderr += data.toString();
});

pythonProcess.on('close', (code) => {
  console.log('Python process exited with code:', code);
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  
  // Try to extract JSON
  const jsonMatch = stdout.match(/\{[^{}]*"documents"[^{}]*\}/);
  if (jsonMatch) {
    console.log('Found JSON:', jsonMatch[0]);
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed successfully:', parsed);
      console.log('Documents count:', parsed.documents?.length || 0);
    } catch (e) {
      console.log('Failed to parse JSON:', e);
    }
  } else {
    console.log('No JSON found in output');
  }
});

pythonProcess.on('error', (error) => {
  console.error('Python process error:', error);
}); 