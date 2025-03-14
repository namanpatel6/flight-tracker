require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTrackedFlightForGmail() {
  try {
    // Replace with your Gmail address
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('Please provide your Gmail address as an argument');
      console.log('Example: node src/scripts/create-gmail-flight.js your-email@gmail.com');
      return;
    }
    
    console.log(`Looking for user with email: ${userEmail}`);
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // First, check if we can connect to the database
    try {
      await prisma.$connect();
      console.log('Successfully connected to the database');
    } catch (connectionError) {
      console.error('Failed to connect to the database:', connectionError);
      return;
    }
    
    const user = await prisma.user.findFirst({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.log(`User not found with email: ${userEmail}`);
      console.log('Please make sure you have created an account with this email in the application');
      return;
    }
    
    console.log(`Found user: ${user.name || 'Unknown'} (ID: ${user.id})`);
    
    // Create a tracked flight
    const flight = await prisma.trackedFlight.create({
      data: {
        flightNumber: 'AA1234',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        departureTime: new Date(Date.now() + 3600000), // 1 hour from now
        arrivalTime: new Date(Date.now() + 21600000),  // 6 hours from now
        status: 'scheduled',
        gate: 'B12',
        terminal: 'T2',
        userId: user.id,
      }
    });
    
    console.log('Successfully created tracked flight:', flight);
    
    // Create an alert for this flight
    const alert = await prisma.alert.create({
      data: {
        type: 'STATUS_CHANGE',
        isActive: true,
        flightId: flight.id,  // Note: this should match the field name in the schema
        userId: user.id,
      }
    });
    
    console.log('Successfully created alert:', alert);
    
    console.log('\nTest setup complete!');
    console.log('You can now run the cron job to simulate a flight update:');
    console.log('npm run trigger:cron');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTrackedFlightForGmail().catch(console.error); 