import { NextResponse } from 'next/server';
import { getPostById } from '@/app/lib/notion';

export async function GET(
  request: Request,
  context: { params: Promise<{ postId: string; }> }
) {
  const { postId } = await context.params;

  try {
    const post = await getPostById(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}