import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export interface FileResult {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Pick a document from the device
 */
export async function pickDocument(options?: {
  type?: string | string[];
  multiple?: boolean;
}): Promise<FileResult[] | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options?.type || '*/*',
      copyToCacheDirectory: true,
      multiple: options?.multiple ?? false,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      }));
    }

    return null;
  } catch (error) {
    console.error('Error picking document:', error);
    Alert.alert('Error', 'Failed to pick document. Please try again.');
    return null;
  }
}

/**
 * Pick a PDF document
 */
export async function pickPDF(): Promise<FileResult | null> {
  const results = await pickDocument({ type: 'application/pdf' });
  return results ? results[0] : null;
}

/**
 * Pick an image document
 */
export async function pickImageDocument(): Promise<FileResult | null> {
  const results = await pickDocument({ type: 'image/*' });
  return results ? results[0] : null;
}

/**
 * Pick multiple documents
 */
export async function pickMultipleDocuments(options?: {
  type?: string | string[];
}): Promise<FileResult[] | null> {
  return pickDocument({ ...options, multiple: true });
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(file: FileResult, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Validate file type
 */
export function validateFileType(file: FileResult, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.mimeType.startsWith(category + '/');
    }
    return file.mimeType === type;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
