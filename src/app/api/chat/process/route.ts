import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { NextRequest } from 'next/server';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    console.log('TRADITIONAL API ROUTE HIT (PROCESS)');
    try {
        const formData = await req.formData();
        const files = formData.getAll('files');
        const instructions = formData.get('instructions');

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        const processingInstructions = instructions ? JSON.parse(instructions as string) : {};
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        // Create uploads directory if it doesn't exist
        try {
            await fs.access(uploadDir);
        } catch {
            await mkdir(uploadDir, { recursive: true });
        }

        const results = [];

        // Process each file
        for (const file of files) {
            if (!(file instanceof File)) {
                continue;
            }

            // Generate unique filename outside try block
            const fileName = `${uuidv4()}-${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            try {
                // Save file temporarily
                await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

                // Clear the database before processing new documents to prevent contamination
                const clearDbCommand = `python -c "
import chromadb
client = chromadb.PersistentClient(path='chroma_db')
try:
    client.delete_collection('documents')
    print('Database cleared successfully')
except:
    print('No existing collection to clear')
"`;
                
                try {
                    await execAsync(clearDbCommand);
                } catch (clearError) {
                    console.log('Database clear warning:', clearError);
                }

                // Process file with RAG pipeline
                const { stdout, stderr } = await execAsync(
                    `python src/services/ragPipelineService.py "${filePath}" '${JSON.stringify(processingInstructions)}'`
                );

                if (stderr) {
                    console.error('Processing error:', stderr);
                    results.push({
                        fileName: file.name,
                        status: 'error',
                        error: stderr
                    });
                    continue;
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    
                    // Check if the result contains an error
                    if (result.error) {
                        results.push({
                            fileName: file.name,
                            status: 'error',
                            error: result.error
                        });
                        continue;
                    }
                    
                    results.push({
                        fileName: file.name,
                        status: 'success',
                        ...result
                    });
                } catch (parseError) {
                    console.error('Error parsing Python output:', parseError, 'Raw output:', stdout);
                    results.push({
                        fileName: file.name,
                        status: 'error',
                        error: 'Failed to parse processing result'
                    });
                }

            } catch (error) {
                console.error('Error processing file:', error);
                results.push({
                    fileName: file.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error)
                });
            } finally {
                // Clean up temporary file
                try {
                    await fs.unlink(filePath);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in process route:', error);
        return NextResponse.json(
            { error: 'Failed to process files', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 