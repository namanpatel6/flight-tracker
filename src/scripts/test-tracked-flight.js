const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateTrackedFlight() {
  try {
    console.log('Testing tracked flight creation...');
    
    // Get the first user from the database
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      return;
    }
    
    console.log(`Found user: ${user.name || user.email} (ID: ${user.id})`);
    
    // Create a test tracked flight
    const trackedFlight = await prisma.trackedFlight.create({
      data: {
        flightNumber: 'TEST123',
        userId: user.id,
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        departureTime: new Date(),
        status: 'scheduled',
      },
    });
    
    console.log('Successfully created tracked flight:', trackedFlight);
    
    // Clean up - delete the test flight
    await prisma.trackedFlight.delete({
      where: { id: trackedFlight.id },
    });
    
    console.log('Test flight deleted successfully.');
  } catch (error) {
    console.error('Error testing tracked flight creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCreateTrackedFlight().catch(console.error); 