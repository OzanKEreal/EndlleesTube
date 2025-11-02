import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
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