require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateFlightChange() {
  try {
    // Get the email from command line arguments
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('Please provide your Gmail address as an argument');
      console.log('Example: node src/scripts/simulate-flight-change.js your-email@gmail.com');
      return;
    }
    
    console.log(`Looking for tracked flights for user with email: ${userEmail}`);
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.log(`User not found with email: ${userEmail}`);
      return;
    }
    
    // Find tracked flights for this user
    const trackedFlights = await prisma.trackedFlight.findMany({
      where: { userId: user.id },
      include: { alerts: true }
    });
    
    if (trackedFlights.length === 0) {
      console.log('No tracked flights found for this user');
      console.log('Please run the create:gmail-flight script first');
      return;
    }
    
    console.log(`Found ${trackedFlights.length} tracked flights`);
    
    // Update the status of the first tracked flight
    const flight = trackedFlights[0];
    const newStatus = 'delayed';
    
    console.log(`Updating flight ${flight.flightNumber} status from '${flight.status}' to '${newStatus}'`);
    
    // Update the flight status
    await prisma.trackedFlight.update({
      where: { id: flight.id },
      data: { status: newStatus }
    });
    
    console.log('Flight status updated successfully');
    console.log('\nNow run the cron job to process this change and send notifications:');
    console.log('npm run trigger:cron');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateFlightChange().catch(console.error); 