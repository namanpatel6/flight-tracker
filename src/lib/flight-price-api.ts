import { Flight, Price } from "@/types/flight";

// Air Scraper API configuration
const API_BASE_URL = "https://booking-com15.p.rapidapi.com/api/v1/flights";
const API_V2_BASE_URL = "https://booking-com15.p.rapidapi.com/api/v2/flights";
const API_KEY = process.env.AIR_SCRAPER_API_KEY || "";
const API_HOST = process.env.AIR_SCRAPER_API_HOST || "";

// Cache for airport entity IDs to reduce API calls
const airportEntityIdCache = new Map<string, string>();

/**
 * Search for an airport's entity ID by IATA code
 */
export async function searchAirport(iataCode: string): Promise<string | null> {
  // Check cache first
  if (airportEntityIdCache.has(iataCode)) {
    return airportEntityIdCache.get(iataCode) || null;
  }

  try {
    const url = `${API_BASE_URL}/searchAirport?query=${iataCode}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });

    if (!response.ok) {
      console.error(`Error searching airport: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Check if data structure is valid
    if (!data || !data.data) {
      console.error(`Invalid API response for airport ${iataCode}`);
      return null;
    }
    
    // Find the airport in the results - first try exact match with skyId
    let airport = data.data.find((item: any) => 
      item.skyId === iataCode
    );
    
    // If not found by skyId, try to find by name that includes the IATA code
    if (!airport) {
      airport = data.data.find((item: any) => 
        item.name && item.name.includes(iataCode)
      );
    }

    if (!airport) {
      console.error(`Airport with IATA code ${iataCode} not found`);
      return null;
    }

    // Cache the entity ID
    airportEntityIdCache.set(iataCode, airport.entityId);
    
    return airport.entityId;
  } catch (error) {
    console.error(`Error searching airport: ${error}`);
    return null;
  }
}

/**
 * Search for the cheapest flight price between two airports
 */
export async function searchFlightPrice(
  depIata: string,
  arrIata: string,
  date: string
): Promise<Price | null> {
  try {
    // Get entity IDs for both airports
    const depEntityId = await searchAirport(depIata);
    const arrEntityId = await searchAirport(arrIata);

    if (!depEntityId || !arrEntityId) {
      console.error(`Could not find entity IDs for airports: ${depIata} or ${arrIata}`);
      return null;
    }

    // Format date as YYYY-MM-DD
    let formattedDate = date;
    try {
      // Ensure date is in YYYY-MM-DD format
      formattedDate = new Date(date).toISOString().split('T')[0];
    } catch (err) {
      console.error(`Invalid date format: ${date}, using as-is`);
    }
    
    // Log the request details for debugging
    console.log(`Searching flight prices: ${depIata}(${depEntityId}) to ${arrIata}(${arrEntityId}) on ${formattedDate}`);
    
    // Search for flights
    const url = `${API_V2_BASE_URL}/searchFlights?fromEntityId=${depEntityId}&toEntityId=${arrEntityId}&departDate=${formattedDate}&returnDate=&adults=1&children=0&infants=0&cabinClass=ECONOMY&currency=USD&countryCode=US`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });

    if (!response.ok) {
      console.error(`Error searching flights: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Log response structure for debugging
    console.log(`Response structure keys: ${Object.keys(data)}`);
    console.log(`Data structure keys: ${data.data ? Object.keys(data.data) : 'no data property'}`);
    
    // Handle different API response structures
    let cheapestPrice: Price | null = null;
    
    // Try itineraries format first
    if (data.data?.itineraries && data.data.itineraries.length > 0) {
      const cheapestItinerary = data.data.itineraries.reduce(
        (cheapest: any, current: any) => {
          return (current.price.raw < cheapest.price.raw) 
            ? current 
            : cheapest;
        },
        data.data.itineraries[0]
      );
      
      cheapestPrice = {
        amount: cheapestItinerary.price.raw,
        currency: 'USD',
        formatted: cheapestItinerary.price.formatted,
      };
    }
    // Try flightOffers format
    else if (data.data?.flightOffers && data.data.flightOffers.length > 0) {
      const cheapestOffer = data.data.flightOffers.reduce(
        (cheapest: any, current: any) => {
          return (current.price.totalAmount < cheapest.price.totalAmount) 
            ? current 
            : cheapest;
        },
        data.data.flightOffers[0]
      );
      
      cheapestPrice = {
        amount: cheapestOffer.price.totalAmount,
        currency: cheapestOffer.price.currencyCode || 'USD',
        formatted: `${cheapestOffer.price.currencyCode || 'USD'} ${cheapestOffer.price.totalAmount}`,
      };
    }
    // Fallback handler
    else {
      console.error('No flight offers or itineraries found in response');
      console.log('Full response (first 500 chars):', JSON.stringify(data).substring(0, 500));
      return null;
    }
    
    return cheapestPrice;
  } catch (error) {
    console.error(`Error searching flight prices: ${error}`);
    return null;
  }
}

/**
 * Fetch prices for multiple flights
 */
export async function fetchFlightPrices(flights: Flight[], flightDate?: string): Promise<Flight[]> {
  console.log(`Fetching prices for ${flights.length} flights with date: ${flightDate || 'not provided'}`);
  
  // Create a copy of flights to avoid modifying the original
  const flightsWithPrices = [...flights];
  
  // Create an array of promises for concurrent price fetching
  const pricePromises = flights.map(async (flight, index) => {
    if (!flight.departure?.iata || !flight.arrival?.iata) {
      console.log(`Skipping price fetch for flight ${index} - missing departure/arrival IATA`);
      return null;
    }
    
    // Use provided flight date, then check flight object, then use current date
    const date = flightDate || flight.flight_date || new Date().toISOString().split('T')[0];
    
    console.log(`Fetching price for flight ${index}: ${flight.departure.iata} to ${flight.arrival.iata} on ${date}`);
    
    const price = await searchFlightPrice(
      flight.departure.iata,
      flight.arrival.iata,
      date
    );
    
    if (price) {
      console.log(`Got price for flight ${index}: ${price.formatted}`);
      flightsWithPrices[index] = {
        ...flightsWithPrices[index],
        price
      };
    } else {
      console.log(`No price found for flight ${index}`);
    }
    
    return price;
  });
  
  // Wait for all price promises to resolve
  await Promise.all(pricePromises);
  
  console.log(`Finished fetching prices for ${flights.length} flights. Found prices for ${flightsWithPrices.filter(f => f.price).length} flights.`);
  
  return flightsWithPrices;
} 