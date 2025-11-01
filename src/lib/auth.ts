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