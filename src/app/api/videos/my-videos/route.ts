import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
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

    // Fetch user's videos
    const videos = await db.video.findMany({
      where: {
        userId: user.id,
        isDeleted: false
      },
      include: {
        _count: {
          select: {
            comments: true,
            views: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format videos for response
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailPath: video.thumbnailPath,
      duration: video.duration,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video._count.comments,
      visibility: video.visibility,
      status: video.status,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    }))

    return NextResponse.json({
      success: true,
      videos: formattedVideos
    })

  } catch (error) {
    console.error('My videos fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}