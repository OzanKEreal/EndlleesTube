import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const uploadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
  tags: z.string().optional(),
})

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    
    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only MP4, WebM, MOV, and AVI files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2GB max)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB in bytes
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 2GB.' },
        { status: 400 }
      )
    }

    // Parse metadata
    const metadata = uploadSchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      visibility: formData.get('visibility'),
      tags: formData.get('tags'),
    })

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    const videosDir = join(uploadsDir, 'videos')
    const thumbnailsDir = join(uploadsDir, 'thumbnails')
    
    try {
      await mkdir(videosDir, { recursive: true })
      await mkdir(thumbnailsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const videoId = uuidv4()
    const videoExtension = videoFile.name.split('.').pop()
    const videoFilename = `${videoId}.${videoExtension}`
    const videoPath = join(videosDir, videoFilename)

    // Save video file
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(videoPath, buffer)

    // Create video record in database
    const video = await db.video.create({
      data: {
        id: videoId,
        userId: user.id,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        visibility: metadata.visibility,
        status: 'PROCESSING',
        fileSize: videoFile.size,
        videoPath: `/uploads/videos/${videoFilename}`,
        thumbnailPath: `/api/thumbnail/${videoId}`, // Placeholder for now
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

    // TODO: Queue video processing job
    // This would typically involve:
    // 1. Generating thumbnails
    // 2. Compressing video to 720p
    // 3. Creating HLS segments
    // 4. Updating video status to READY

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        status: video.status,
        createdAt: video.createdAt,
        user: video.user,
      }
    })

  } catch (error) {
    console.error('Video upload error:', error)

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