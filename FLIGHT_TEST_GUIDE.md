# Real Flight Notification Test Guide

This guide explains how to test the Flight Tracker email notification system with real flight data using the AeroAPI integration.

## Test Setup: AA777 Flight on April 12, 2025

We've set up a test for:
- **Flight Number**: AA777
- **Route**: DFW (Dallas/Fort Worth) to LAS (Las Vegas)
- **Departure**: April 12, 2025 at 12:57 PM (local Dallas time)
- **Arrival**: April 12, 2025 at 1:52 PM (local Las Vegas time)
- **Alert Type**: DEPARTURE (notify when flight departs)
- **Email**: patelnaman06@gmail.com

## Quick All-in-One Test

The fastest way to test the entire flight notification system is to use the comprehensive test endpoint:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-complete" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

This endpoint will:
1. Set up the flight and alert rule
2. Send a setup confirmation email
3. Simulate a flight status change from "scheduled" to "active"
4. Process all rules to trigger a notification
5. Send an alert email about the flight departure

Check the email at patelnaman06@gmail.com for both emails.

## Step-by-Step Testing

If you prefer to test one step at a time, you can use these individual endpoints:

### 1. Setup the Test Flight and Rule

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-complete?mode=setup" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

### 2. Simulate a Flight Status Change

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-complete?mode=change" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

## Verify Email Notifications

Check the email at patelnaman06@gmail.com for:
1. A setup confirmation email
2. A flight departure notification email

## Testing Individual Components

You can also test specific components of the system:

### Test Email Delivery

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

### Test Rule Processing

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/process-rules" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

## Real AeroAPI Integration

The system is configured to use your real AeroAPI key from the .env.local file for fetching actual flight data. For this test, we're simulating the flight status change, but in a real scenario, the AeroAPI would provide the status updates.

## Alert Types

The system supports these alert types:
- **STATUS_CHANGE**: When a flight's status changes (e.g., scheduled → active)
- **DELAY**: When a flight is delayed
- **GATE_CHANGE**: When the departure gate changes
- **DEPARTURE**: When a flight departs
- **ARRIVAL**: When a flight arrives

For this test, we're focused on DEPARTURE alerts. 