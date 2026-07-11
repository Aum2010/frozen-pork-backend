import { Test, TestingModule } from '@nestjs/testing'
import { TanksController } from './tanks.controller'
import { TanksService } from './tanks.service'

const mockTanksService = {
  findAll: jest.fn(),
  getFifoSuggest: jest.fn(),
  fill: jest.fn(),
  withdraw: jest.fn(),
}

describe('TanksController', () => {
  let controller: TanksController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TanksController],
      providers: [{ provide: TanksService, useValue: mockTanksService }],
    }).compile()

    controller = module.get<TanksController>(TanksController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})