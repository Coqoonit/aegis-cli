import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { ValidationError } from "./errors.js";

/**
 * MIME types accepted by the Aegis backend (mirrors
 * packages/common/src/errors.ts ALLOWED_DOCUMENT_MIMES).
 */
const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function loadFileAsBlob(filePath: string): Promise<{
  file: File;
  size: number;
  mimeType: string;
  filename: string;
}> {
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(filePath);
  } catch (err) {
    throw new ValidationError(
      `File not found: ${filePath}`,
      err instanceof Error ? err.message : String(err),
    );
  }
  if (!info.isFile()) {
    throw new ValidationError(`Not a regular file: ${filePath}`);
  }
  if (info.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File too large: ${info.size} bytes (max ${MAX_FILE_SIZE})`,
    );
  }
  const buffer = await readFile(filePath);
  const filename = basename(filePath);
  const ext = extname(filename).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ValidationError(
      `Unsupported file type "${ext || "<no extension>"}". Accepted: PDF, JPEG, PNG, WEBP, TIFF, DOC, DOCX, XLS, XLSX, TXT`,
    );
  }
  const file = new File([buffer], filename, { type: mimeType });
  return { file, size: info.size, mimeType, filename };
}
