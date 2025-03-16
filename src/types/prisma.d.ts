import { PrismaClient } from '@prisma/client';

// Extend the PrismaClient type to include the missing models
declare global {
  namespace PrismaClient {
    interface PrismaClient {
      rule: any;
      ruleCondition: any;
    }
  }
}

export {}; 