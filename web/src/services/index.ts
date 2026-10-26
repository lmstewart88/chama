import { createMockService } from './mock.js';
import type { FundingService } from '../types.js';
import {liveConfig} from './config.js';
import {liveFundingService} from './live.js';
export const fundingService: FundingService = liveConfig.enabled?liveFundingService:createMockService();
export const DATA_MODE=liveConfig.enabled?'live':'mock' as const;
