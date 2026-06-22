export interface EmbeddedSessionFile {
    mime: string;
    data: string;
}

export type EmbeddedSessionFiles = Record<string, EmbeddedSessionFile>;

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function base64ToBytes(data: string): Uint8Array {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export async function fileToEmbeddedSessionFile(file: File): Promise<EmbeddedSessionFile> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
        mime: file.type || 'application/octet-stream',
        data: bytesToBase64(bytes)
    };
}

export function embeddedSessionFileToFile(filename: string, embedded: EmbeddedSessionFile): File {
    return new File([base64ToBytes(embedded.data) as unknown as BlobPart], filename, {
        type: embedded.mime || 'application/octet-stream'
    });
}

export function embeddedSessionFilesToRecord(embeddedFiles: unknown): Record<string, File> {
    if (!embeddedFiles || typeof embeddedFiles !== 'object') return {};
    const files: Record<string, File> = {};
    for (const [filename, embedded] of Object.entries(embeddedFiles as EmbeddedSessionFiles)) {
        if (!embedded || typeof embedded.data !== 'string') continue;
        files[filename] = embeddedSessionFileToFile(filename, embedded);
    }
    return files;
}
