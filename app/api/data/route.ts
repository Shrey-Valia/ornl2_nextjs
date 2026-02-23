import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "data-uploads");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_PREVIEW_LIMIT = 25;
const MAX_PREVIEW_LIMIT = 200;

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function normalizeFileName(name: string) {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseCsvLine(line: string) {
  return line.split(",").map((cell) => cell.trim().replace(/\"/g, ""));
}

function parseCsvMetadata(text: string, previewLimit = DEFAULT_PREVIEW_LIMIT) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rowCount: 0, preview: [] as string[][] };
  }

  const headers = parseCsvLine(lines[0]);
  const rowCount = Math.max(0, lines.length - 1);
  const previewLines = lines.slice(1, 1 + previewLimit);
  const preview = previewLines.map(parseCsvLine);

  return { headers, rowCount, preview };
}

function parsePreviewLimit(value: string | null, fallback = DEFAULT_PREVIEW_LIMIT) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_PREVIEW_LIMIT);
}

async function getFileMetadata(name: string) {
  const filePath = path.join(UPLOAD_DIR, name);
  const stat = await fs.stat(filePath);
  const text = await fs.readFile(filePath, "utf8");
  const { headers, rowCount, preview } = parseCsvMetadata(text);

  return {
    name,
    size: stat.size,
    uploadDate: stat.mtime.toISOString(),
    rowCount,
    columns: headers,
    preview,
  };
}

export async function GET(request: Request) {
  await ensureUploadDir();
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name");
  const download = searchParams.get("download") === "1";
  const previewLimit = parsePreviewLimit(searchParams.get("preview"));

  if (nameParam) {
    const safeName = normalizeFileName(nameParam);
    const filePath = path.join(UPLOAD_DIR, safeName);

    try {
      const fileData = await fs.readFile(filePath);

      if (download) {
        return new Response(fileData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=\"${safeName}\"`,
          },
        });
      }

      const text = fileData.toString("utf8");
      const meta = parseCsvMetadata(text, previewLimit);
      const stat = await fs.stat(filePath);

      return Response.json({
        name: safeName,
        size: stat.size,
        uploadDate: stat.mtime.toISOString(),
        rowCount: meta.rowCount,
        columns: meta.headers,
        preview: meta.preview,
      });
    } catch {
      return Response.json({ message: "File not found" }, { status: 404 });
    }
  }

  const entries = await fs.readdir(UPLOAD_DIR);
  const files = await Promise.all(
    entries
      .filter((file) => file.endsWith(".csv"))
      .map(async (file) => {
        try {
          const meta = await getFileMetadata(file);
          return {
            name: meta.name,
            size: meta.size,
            uploadDate: meta.uploadDate,
            rowCount: meta.rowCount,
            columns: meta.columns,
          };
        } catch {
          return null;
        }
      })
  );

  return Response.json({ files: files.filter(Boolean) });
}

export async function POST(request: Request) {
  await ensureUploadDir();
  const { searchParams } = new URL(request.url);
  const previewLimit = parsePreviewLimit(searchParams.get("preview"));

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ message: "No file uploaded" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return Response.json({ message: "Only CSV files are supported" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ message: "File exceeds 10MB limit" }, { status: 400 });
  }

  const safeName = normalizeFileName(file.name);
  let finalName = safeName;
  const targetPath = (name: string) => path.join(UPLOAD_DIR, name);

  try {
    await fs.access(targetPath(finalName));
    const timestamp = Date.now();
    const ext = path.extname(safeName);
    const base = safeName.replace(ext, "");
    finalName = `${base}_${timestamp}${ext}`;
  } catch {
    // file does not exist, safe to use
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(targetPath(finalName), buffer);

  const text = buffer.toString("utf8");
  const meta = parseCsvMetadata(text, previewLimit);

  return Response.json({
    name: finalName,
    size: file.size,
    uploadDate: new Date().toISOString(),
    rowCount: meta.rowCount,
    columns: meta.headers,
    preview: meta.preview,
  });
}

export async function DELETE(request: Request) {
  await ensureUploadDir();
  const body = await request.json().catch(() => null);
  const name = body?.name;

  if (!name || typeof name !== "string") {
    return Response.json({ message: "Missing file name" }, { status: 400 });
  }

  const safeName = normalizeFileName(name);
  const filePath = path.join(UPLOAD_DIR, safeName);

  try {
    await fs.unlink(filePath);
  } catch {
    return Response.json({ message: "File not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
