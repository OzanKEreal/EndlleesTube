// ========================================
// ENDLLEESTUBE BACKEND
// ========================================
// Node.js + Prisma + SQLite + JWT
// ========================================

// Database Schema

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  displayName  String
  passwordHash String   @map("password_hash")
  role         UserRole @default(USER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  videos       Video[]
  comments     Comment[]
  refreshTokens RefreshToken[]
  views        View[]
  likes        Like[]

  @@map("users")
}

model Video {
  id          String        @id @default(cuid())
  userId      String        @map("user_id")
  title       String
  description String?
  tags        String?       // JSON array of tags
  visibility  VideoVisibility @default(PUBLIC)
  status      VideoStatus   @default(UPLOADING)
  duration    Int?          // Duration in seconds
  fileSize    Int?          // Original file size in bytes
  processedSize Int?        // Processed file size in bytes
  thumbnailPath String?     @map("thumbnail_path")
  videoPath   String?       @map("video_path")
  hlsPath     String?       @map("hls_path")
  viewCount   Int           @default(0) @map("view_count")
  likeCount   Int           @default(0) @map("like_count")
  commentCount Int          @default(0) @map("comment_count")
  isDeleted   Boolean       @default(false) @map("is_deleted")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  // Relations
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    Comment[]
  views       View[]
  likes       Like[]

  @@map("videos")
}

model Comment {
  id        String   @id @default(cuid())
  videoId   String   @map("video_id")
  userId    String   @map("user_id")
  parentId  String?  @map("parent_id")
  content   String
  isHidden  Boolean  @default(false) @map("is_hidden")
  isDeleted Boolean  @default(false) @map("is_deleted")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  video     Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@map("comments")
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model View {
  id      String   @id @default(cuid())
  videoId String   @map("video_id")
  userId  String?  @map("user_id")
  ipHash  String   @map("ip_hash")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  video   Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([videoId, ipHash])
  @@map("views")
}

model Like {
  id        String   @id @default(cuid())
  videoId   String   @map("video_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([videoId, userId])
  @@map("likes")
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}

enum VideoVisibility {
  PUBLIC
  UNLISTED
  PRIVATE
}

enum VideoStatus {
  UPLOADING
  PROCESSING
  READY
  FAILED
}
// ========================================
// DATABASE CONNECTION
// ========================================

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
// ========================================
// AUTHENTICATION SERVICE
// ========================================

import { db } from '@/lib/db'
import { hash, verify } from 'argon2'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

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

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

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
// API ROUTES
// ========================================

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
}import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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
// SERVER CONFIGURATION
// ========================================

// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
