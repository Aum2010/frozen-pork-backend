import { Test, TestingModule } from '@nestjs/testing'
import { ThawController } from './thaw.controller'
import { ThawService } from './thaw.service'

const mockThawService = {
  startThaw: jest.fn(),
  getPending: jest.fn(),
  confirmReady: jest.fn(),
}

describe('ThawController', () => {
  let controller: ThawController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThawController],
      providers: [
        { provide: ThawService, useValue: mockThawService },
      ],
    }).compile()

    controller = module.get<ThawController>(ThawController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})