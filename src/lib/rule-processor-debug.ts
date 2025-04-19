import { processRules } from './rule-processor';
import { db } from '@/lib/db';

/**
 * Processes rules with extra debug information
 * @returns Detailed information about the rule processing
 */
export async function processRulesWithDebug() {
  const startTime = Date.now();
  
  // Get snapshot of rules before processing
  const rulesBefore = await db.rule.findMany({
    where: { isActive: true },
    include: {
      conditions: true,
      alerts: true
    }
  });
  
  // Get snapshot of notifications before processing
  const notificationCountBefore = await db.notification.count();
  
  // Run the actual rule processing
  await processRules();
  
  // Get snapshot after processing
  const rulesAfter = await db.rule.findMany({
    where: { isActive: true },
    include: {
      conditions: true,
      alerts: true
    }
  });
  
  // Get new notifications created during processing
  const notificationsAfter = await db.notification.findMany({
    where: {
      createdAt: {
        gte: new Date(startTime)
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    processingTimeMs: processingTime,
    ruleCount: rulesBefore.length,
    rulesProcessed: rulesAfter.length,
    notificationsCreated: notificationsAfter.length,
    notificationsBefore: notificationCountBefore,
    notificationsAfter: notificationCountBefore + notificationsAfter.length,
    newNotifications: notificationsAfter.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      userId: n.userId,
      userName: n.user?.name || 'Unknown',
      userEmail: n.user?.email || 'Unknown',
      createdAt: n.createdAt
    }))
  };
} 