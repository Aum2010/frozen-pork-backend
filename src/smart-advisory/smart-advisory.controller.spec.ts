import { Test, TestingModule } from '@nestjs/testing'
import { SmartAdvisoryController } from './smart-advisory.controller'
import { SmartAdvisoryService } from './smart-advisory.service'

const mockAdvisoryService = {
  getStatus: jest.fn(),
  checkReorderPoint: jest.fn(),
  checkThawReminder: jest.fn(),
  checkTankReady: jest.fn(),
}

describe('SmartAdvisoryController', () => {
  let controller: SmartAdvisoryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmartAdvisoryController],
      providers: [
        { provide: SmartAdvisoryService, useValue: mockAdvisoryService },
      ],
    }).compile()

    controller = module.get<SmartAdvisoryController>(SmartAdvisoryController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})