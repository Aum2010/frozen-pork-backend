import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

const mockAuthService = {
  login: jest.fn(),
}

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('✓ login → เรียก authService.login ด้วย dto ที่ถูกต้อง', async () => {
    const dto = { email: 'warehouse@test.com', password: '1234' }
    mockAuthService.login.mockResolvedValue({ access_token: 'mock-token', user: {} })

    await controller.login(dto)

    expect(mockAuthService.login).toHaveBeenCalledWith(dto)
  })
})