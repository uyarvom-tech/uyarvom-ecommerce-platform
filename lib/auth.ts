import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { adminUser: true }
    })

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    }

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' })

    return { user: authUser, token }
  } catch (error) {
    console.error('Sign in error:', error)
    return null
  }
}

export async function signUp(email: string, password: string, fullName: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName
      }
    })

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    }

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' })

    return { user: authUser, token }
  } catch (error) {
    console.error('Sign up error:', error)
    return null
  }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export async function getUser(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { adminUser: true }
    })
  } catch (error) {
    return null
  }
}