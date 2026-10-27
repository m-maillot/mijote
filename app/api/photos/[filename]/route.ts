import { NextResponse } from "next/server";
import { getPhoto } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[\w-]+\.\w+$/.test(filename)) {
    return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
  }

  try {
    const photo = await getPhoto(`photos/${filename}`);
    if (!photo) return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });

    const headers: Record<string, string> = {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    if (photo.contentLength !== undefined) headers["Content-Length"] = String(photo.contentLength);
    return new NextResponse(photo.body, { headers });
  } catch (err) {
    if ((err as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
    }
    console.error("[storage] lecture photo:", err);
    return NextResponse.json({ error: "Erreur de stockage" }, { status: 500 });
  }
}
