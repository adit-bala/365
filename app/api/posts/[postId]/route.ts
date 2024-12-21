import { NextResponse } from 'next/server'
import { getPostById } from '@/app/lib/notion'

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const { postId } = await params

  try {
    const post = await getPostById(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

