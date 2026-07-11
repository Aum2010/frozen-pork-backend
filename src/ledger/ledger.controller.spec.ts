import { Test, TestingModule } from '@nestjs/testing'
import { LedgerController } from './ledger.controller'
import { LedgerService } from './ledger.service'

const mockLedgerService = {
  findAll: jest.fn(),
  getTimeline: jest.fn(),
  exportCsv: jest.fn(),
}

describe('LedgerController', () => {
  let controller: LedgerController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LedgerController],
      providers: [
        { provide: LedgerService, useValue: mockLedgerService },
      ],
    }).compile()

    controller = module.get<LedgerController>(LedgerController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})