// Test script for the rules system
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRulesSystem() {
  console.log('🔍 Testing Rules System...');

  try {
    // 1. Create a test user if not exists
    console.log('Creating test user...');
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Using existing test user');
    }

    // 2. Create a test tracked flight if not exists
    console.log('Creating test tracked flight...');
    let trackedFlight = await prisma.trackedFlight.findFirst({
      where: { userId: user.id },
    });

    if (!trackedFlight) {
      trackedFlight = await prisma.trackedFlight.create({
        data: {
          userId: user.id,
          flightNumber: 'TEST123',
          departureAirport: 'JFK',
          arrivalAirport: 'LAX',
          departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          arrivalTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
          status: 'scheduled',
        },
      });
      console.log('✅ Test tracked flight created');
    } else {
      console.log('✅ Using existing tracked flight');
    }

    // 3. Create a test rule
    console.log('Creating test rule...');
    const rule = await prisma.rule.create({
      data: {
        name: 'Test Rule',
        description: 'A test rule for verification',
        operator: 'AND',
        isActive: true,
        userId: user.id,
        conditions: {
          create: [
            {
              field: 'status',
              operator: 'equals',
              value: 'delayed',
              trackedFlightId: trackedFlight.id,
            },
          ],
        },
        alerts: {
          create: [
            {
              type: 'STATUS_CHANGE',
              userId: user.id,
              trackedFlightId: trackedFlight.id,
              isActive: true,
            },
          ],
        },
      },
      include: {
        conditions: true,
        alerts: true,
      },
    });

    console.log('✅ Test rule created:', rule);

    // 4. Test rule evaluation
    console.log('Testing rule evaluation...');
    
    // First with non-matching condition
    console.log('Testing with non-matching condition (status: scheduled)...');
    const shouldNotTrigger = evaluateRule(rule, {
      ...trackedFlight,
      status: 'scheduled',
    });
    console.log('Rule should not trigger:', !shouldNotTrigger ? '✅ Correct' : '❌ Incorrect');

    // Then with matching condition
    console.log('Testing with matching condition (status: delayed)...');
    const shouldTrigger = evaluateRule(rule, {
      ...trackedFlight,
      status: 'delayed',
    });
    console.log('Rule should trigger:', shouldTrigger ? '✅ Correct' : '❌ Incorrect');

    // 5. Clean up
    console.log('Cleaning up...');
    await prisma.alert.deleteMany({
      where: { ruleId: rule.id },
    });
    await prisma.ruleCondition.deleteMany({
      where: { ruleId: rule.id },
    });
    await prisma.rule.delete({
      where: { id: rule.id },
    });
    console.log('✅ Test rule cleaned up');

    console.log('✅ Rules system test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing rules system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Simple rule evaluation function
function evaluateRule(rule, flight) {
  const conditionResults = rule.conditions.map(condition => {
    if (condition.trackedFlightId !== flight.id) return false;
    
    switch (condition.operator) {
      case 'equals':
        return flight[condition.field] === condition.value;
      case 'notEquals':
        return flight[condition.field] !== condition.value;
      case 'contains':
        return flight[condition.field]?.includes(condition.value);
      case 'greaterThan':
        return flight[condition.field] > condition.value;
      case 'lessThan':
        return flight[condition.field] < condition.value;
      default:
        return false;
    }
  });

  if (rule.operator === 'AND') {
    return conditionResults.every(result => result);
  } else {
    return conditionResults.some(result => result);
  }
}

testRulesSystem()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 