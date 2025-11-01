import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(1000)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    const comments = await db.comment.findMany({
      where: {
        videoId: videoId,
        isDeleted: false,
        parentId: null, // Only top-level comments
        isHidden: false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        replies: {
          where: {
            isDeleted: false,
            isHidden: false
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user,
      replies: comment.replies
    }))

    return NextResponse.json({
      success: true,
      comments: formattedComments
    })

  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await AuthService.verifyAccessToken(token)

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = commentSchema.parse(body)

    // Check if video exists
    const video = await db.video.findFirst({
      where: {
        id: videoId,
        isDeleted: false,
        status: 'READY'
      }
    })

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check visibility
    const isOwner = user.id === video.userId
    if (video.visibility === 'PRIVATE' && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Video is private' },
        { status: 403 }
      )
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        videoId: videoId,
        userId: user.id,
        content: validatedData.content
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      }
    })

    // Update video comment count
    await db.video.update({
      where: { id: videoId },
      data: {
        commentCount: {
          increment: 1
        }
      }
    })

    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user,
      replies: []
    }

    return NextResponse.json({
      success: true,
      comment: formattedComment
    })

  } catch (error) {
    console.error('Comment creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}