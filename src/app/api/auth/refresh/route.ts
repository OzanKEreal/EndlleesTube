import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
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