import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-revalidate-secret');

  if (authHeader !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { success: false, message: 'Invalid revalidation secret' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { paths = [], tags = [] } = body;

    if (!Array.isArray(paths) || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, message: 'paths and tags must be arrays' },
        { status: 400 }
      );
    }

    // Deduplicate
    const uniquePaths = [...new Set(paths)];
    const uniqueTags = [...new Set(tags)];

    const revalidated: string[] = [];
    const failed: { path: string; error: string }[] = [];

    // Revalidate paths. Dynamic route patterns (paths containing '[') MUST use
    // the 'page' type per Next.js 16 revalidatePath semantics; 'layout' is kept
    // for concrete paths to also purge nested layouts beneath them.
    for (const path of uniquePaths) {
      try {
        const isPattern = path.includes('[');
        revalidatePath(path, isPattern ? 'page' : 'layout');
        revalidated.push(path);
      } catch (error) {
        failed.push({ path, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Revalidate tags
    for (const tag of uniqueTags) {
      try {
        revalidateTag(tag, 'default');
        revalidated.push(`tag:${tag}`);
      } catch (error) {
        failed.push({ path: `tag:${tag}`, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      revalidated,
      failed: failed.length > 0 ? failed : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to revalidate', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}