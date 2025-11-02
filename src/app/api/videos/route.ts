import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const visibility = searchParams.get('visibility') || 'PUBLIC'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isDeleted: false,
      status: 'READY',
    }

    if (visibility !== 'ALL') {
      where.visibility = visibility
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get videos with pagination
    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            }
          },
          _count: {
            select: {
              comments: true,
              views: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      db.video.count({ where })
    ])

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
      user: video.user,
    }))

    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Videos fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}