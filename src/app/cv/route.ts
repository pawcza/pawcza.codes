import { join } from 'path';
import { promises as fs } from 'fs';
export async function GET() {
    try {
        const filePath = join(
            process.cwd(),
            'public',
            'CV - Pawel Czarniecki.pdf',
        );
        const fileContent = await fs.readFile(filePath);

        return new Response(fileContent, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition':
                    'inline; filename="CV - Pawel Czarniecki.pdf"',
            },
        });
    } catch (error) {
        console.error('Error reading file:', error);
        return new Response('File not found', { status: 404 });
    }
}
