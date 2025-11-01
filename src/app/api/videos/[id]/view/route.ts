import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth'
import { createHash } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id
    const authHeader = request.headers.get('authorization')
    
    // Get client IP for view tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const ipHash = createHash('md5').update(ip).digest('hex')

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
    let isOwner = false
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = await AuthService.verifyAccessToken(token)
        isOwner = decoded.userId === video.userId
        userId = decoded.userId
      } catch (error) {
        // Invalid token, continue with public check
      }
    }

    if (video.visibility === 'PRIVATE' && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Video is private' },
        { status: 403 }
      )
    }

    // Check if user has already viewed this video (by IP or user ID)
    const existingView = await db.view.findFirst({
      where: {
        videoId: videoId,
        OR: [
          { ipHash: ipHash },
          ...(userId && { userId: userId })
        ]
      }
    })

    if (!existingView) {
      // Create new view record
      await db.view.create({
        data: {
          videoId: videoId,
          userId: userId,
          ipHash: ipHash
        }
      })

      // Increment view count
      await db.video.update({
        where: { id: videoId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'View recorded'
    })

  } catch (error) {
    console.error('View tracking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}