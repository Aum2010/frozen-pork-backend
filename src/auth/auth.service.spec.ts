import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

const mockUser = {
  id: 'user-1',
  email: 'warehouse@test.com',
  password: '',
  name: 'สมชาย โกดัง',
  role: 'WAREHOUSE',
  createdAt: new Date(),
}

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
}

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('login', () => {
    it('✓ login ถูกต้อง → ได้ access_token และ user info', async () => {
      const hashed = await bcrypt.hash('1234', 10)
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashed })

      const result = await service.login({ email: 'warehouse@test.com', password: '1234' })

      expect(result.access_token).toBe('mock-token')
      expect(result.user.email).toBe('warehouse@test.com')
      expect(result.user.role).toBe('WAREHOUSE')
    })

    it('✓ email ไม่มีในระบบ → 401 Unauthorized', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'notfound@test.com', password: '1234' })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('✓ password ผิด → 401 Unauthorized', async () => {
      const hashed = await bcrypt.hash('correct-password', 10)
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashed })

      await expect(
        service.login({ email: 'warehouse@test.com', password: 'wrong-password' })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('✓ response ไม่มี password field', async () => {
      const hashed = await bcrypt.hash('1234', 10)
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashed })

      const result = await service.login({ email: 'warehouse@test.com', password: '1234' })

      expect(result.user).not.toHaveProperty('password')
    })
  })
})