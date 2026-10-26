import { createMockService } from './mock.js';
import type { FundingService } from '../types.js';
// Replace this adapter with generated contract bindings after agreeing the interface.
// Live operation requires wallet signing, token unit conversion and transaction confirmation.
export const fundingService: FundingService = createMockService();
export const DATA_MODE = 'mock' as const;
