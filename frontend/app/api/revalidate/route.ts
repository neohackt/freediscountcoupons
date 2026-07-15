import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-revalidate-secret');

  if (authHeader !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paths, tags, type } = body;

    if (type === 'tag' && tags) {
      for (const tag of tags) {
        revalidateTag(tag, 'default');
      }
    }

    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path, 'layout');
      }
    }

    if (!paths && !tags) {
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
