import { Test, TestingModule } from '@nestjs/testing'
import { LotsController } from './lots.controller'
import { LotsService } from './lots.service'

const mockLotsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  assignZone: jest.fn(),
}

describe('LotsController', () => {
  let controller: LotsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        { provide: LotsService, useValue: mockLotsService },
      ],
    }).compile()

    controller = module.get<LotsController>(LotsController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})