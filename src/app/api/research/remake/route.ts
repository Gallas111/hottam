import { NextRequest } from "next/server";
import { fetchSourceVideo, generateRemakePlan } from "@/lib/research/remake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }
  try {
    const source = await fetchSourceVideo(videoId);
    if (!source) {
      return Response.json({ error: "video not found" }, { status: 404 });
    }
    return Response.json({ source });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    videoId?: string;
    productName?: string;
    productCategory?: string;
    targetAudience?: string;
    tone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { videoId, productName } = body;
  if (!videoId || !productName) {
    return Response.json(
      { error: "videoId and productName are required" },
      { status: 400 }
    );
  }

  try {
    const source = await fetchSourceVideo(videoId);
    if (!source) {
      return Response.json({ error: "source video not found" }, { status: 404 });
    }
    const plan = await generateRemakePlan({
      source,
      productName,
      productCategory: body.productCategory,
      targetAudience: body.targetAudience,
      tone: body.tone,
    });
    return Response.json({ plan, source });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
