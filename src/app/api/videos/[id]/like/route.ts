import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth'

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

    // Check if user already liked this video
    const existingLike = await db.like.findFirst({
      where: {
        videoId: videoId,
        userId: user.id
      }
    })

    let liked = false
    let likeCount = video.likeCount

    if (existingLike) {
      // Unlike
      await db.like.delete({
        where: { id: existingLike.id }
      })
      await db.video.update({
        where: { id: videoId },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })
      likeCount--
    } else {
      // Like
      await db.like.create({
        data: {
          videoId: videoId,
          userId: user.id
        }
      })
      await db.video.update({
        where: { id: videoId },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })
      liked = true
      likeCount++
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount
    })

  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}