// ========================================
// ENDLLEESTUBE - BACKEND.JS
// Tüm Backend API Kodları Tek Dosyada
// ========================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, verify } from 'argon2'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// ========================================
// CONFIGURATION & SCHEMAS
// ========================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

export const registerSchema = z.object({
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100)
})

export const loginSchema = z.object({
  identifier: z.string(), // email or username
  password: z.string().min(1)
})

const uploadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
  tags: z.string().optional(),
})

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ========================================
// AUTH SERVICE CLASS
// ========================================

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>): Promise<{ user: any; tokens: AuthTokens }> {
    const { displayName, email, username, password } = data

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      throw new Error('User with this email or username already exists')
    }

    // Hash password
    const passwordHash = await hash(password)

    // Create user
    const user = await db.user.create({
      data: {
        displayName,
        email,
        username,
        passwordHash,
        role: 'USER'
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken)

    return { user, tokens }
  }

  static async login(data: z.infer<typeof loginSchema>): Promise<{ user: any; tokens: AuthTokens }> {
    const { identifier, password } = data

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await verify(user.passwordHash, password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt
      },
      tokens
    }
  }

  static async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid refresh token')
      }

      // Check if refresh token exists in database
      const storedToken = await db.refreshToken.findUnique({
        where: { tokenHash: await hash(refreshToken) },
        include: { user: true }
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token')
      }

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user)

      // Store new refresh token and remove old one
      await db.refreshToken.delete({ where: { id: storedToken.id } })
      await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken)

      return tokens
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    const tokenHash = await hash(refreshToken)
    await db.refreshToken.deleteMany({
      where: { tokenHash }
    })
  }

  private static async generateTokens(user: any): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await hash(refreshToken)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await db.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    })
  }

  static async verifyAccessToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return decoded
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }
}

// ========================================
// AUTH API ROUTES
// ========================================

// POST /api/auth/register
export async function registerRoute(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const result = await AuthService.register(validatedData)

    // Set HTTP-only cookie for refresh token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken
    })

    response.cookies.set('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)

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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
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

// POST /api/auth/login
export async function loginRoute(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const result = await AuthService.login(validatedData)

    // Set HTTP-only cookie for refresh token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken
    })

    response.cookies.set('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 401 }
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

// GET /api/auth/me
export async function meRoute(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No access token provided'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await AuthService.verifyAccessToken(token)

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid access token'
      },
      { status: 401 }
    )
  }
}

// POST /api/auth/logout
export async function logoutRoute(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      await AuthService.logout(refreshToken)
    }

    // Clear refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    response.cookies.delete('refreshToken')

    return response
  } catch (error) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// POST /api/auth/refresh
export async function refreshRoute(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'No refresh token provided'
        },
        { status: 401 }
      )
    }

    const tokens = await AuthService.refresh(refreshToken)

    // Set new refresh token cookie
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken
    })

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)

    // Clear invalid refresh token
    const response = NextResponse.json(
      {
        success: false,
        error: 'Invalid refresh token'
      },
      { status: 401 }
    )

    response.cookies.delete('refreshToken')

    return response
  }
}

// ========================================
// VIDEOS API ROUTES
// ========================================

// GET /api/videos
export async function videosRoute(request: NextRequest) {
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

// POST /api/videos/upload
export async function videoUploadRoute(request: NextRequest) {
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

// GET /api/videos/my-videos
export async function myVideosRoute(request: NextRequest) {
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

// ========================================
// THUMBNAIL API ROUTE
// ========================================

// GET /api/thumbnail/[id]
export async function thumbnailRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create a simple thumbnail placeholder
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1f2937"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        Video Thumbnail
      </text>
      <text x="50%" y="65%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
        ID: ${params.id}
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}

// ========================================
// HEALTH CHECK API ROUTE
// ========================================

// GET /api/health
export async function healthRoute(request: NextRequest) {
  try {
    // Check database connection
    await db.user.count()
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: 'Database connection failed'
      },
      { status: 503 }
    )
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Helper function to verify authentication middleware
export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = await AuthService.verifyAccessToken(token)
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    })
    return user
  } catch (error) {
    return null
  }
}

// Helper function to handle API errors
export function handleApiError(error: any, defaultMessage: string = 'Internal server error') {
  console.error(defaultMessage, error)
  
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

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: defaultMessage
    },
    { status: 500 }
  )
}

// ========================================
// EXPORT ALL FUNCTIONS
// ========================================

export {
  // Auth routes
  registerRoute,
  loginRoute,
  meRoute,
  logoutRoute,
  refreshRoute,
  
  // Video routes
  videosRoute,
  videoUploadRoute,
  myVideosRoute,
  
  // Utility routes
  thumbnailRoute,
  healthRoute,
  
  // Utilities
  verifyAuth,
  handleApiError,
  AuthService
}

// Backend.js dosyası sonu
// Tüm backend API kodları tek dosyada toplandı