# Flight Rules and Alerts System

This document explains the enhanced rules and alerts system in the Flight Tracker application.

## Overview

The Flight Tracker application now supports a powerful rules engine that allows you to create complex conditions for tracking flights and receiving notifications. This system enables you to:

1. Create rules with multiple conditions using logical operators (AND/OR)
2. Set up alerts for specific flight events
3. Configure notification preferences
4. Schedule rule execution

## Rules

Rules are the core of the alert system. A rule consists of:

- **Name**: A descriptive name for the rule
- **Description**: Optional details about the rule's purpose
- **Operator**: How conditions are combined (AND/OR)
  - **AND**: All conditions must be met for the rule to trigger
  - **OR**: Any condition can be met for the rule to trigger
- **Conditions**: One or more conditions to evaluate
- **Alerts**: Actions to take when the rule is triggered
- **Schedule**: Optional cron expression for scheduled evaluation

### Conditions

Conditions are the building blocks of rules. Each condition consists of:

- **Field**: The flight attribute to check (status, departureTime, arrivalTime, gate, terminal, flightNumber)
- **Operator**: The comparison operator (equals, notEquals, contains, greaterThan, etc.)
- **Value**: The value to compare against
- **Flight**: The specific flight this condition applies to (optional)

### Examples of Conditions

1. **Status Change**: `status equals "delayed"`
2. **Departure Time**: `departureTime greaterThan "2023-12-01T12:00:00Z"`
3. **Gate Change**: `gate changed`
4. **Flight Number**: `flightNumber contains "AA"`

## Alerts

Alerts define what notifications should be sent when a rule is triggered. The system supports several types of alerts:

- **STATUS_CHANGE**: When a flight's status changes (e.g., from scheduled to delayed)
- **DELAY**: When a flight is delayed
- **GATE_CHANGE**: When a flight's gate changes
- **DEPARTURE**: When a flight departs
- **ARRIVAL**: When a flight arrives

## Notifications

When an alert is triggered, the system creates a notification and can send an email to the user. Notifications include:

- **Title**: A descriptive title for the notification
- **Message**: Details about what triggered the notification
- **Type**: The type of alert that was triggered
- **Flight**: The flight associated with the notification
- **Rule**: The rule that triggered the notification (if applicable)

## Creating Rules

To create a rule:

1. Navigate to the **Flight Rules** page
2. Click the **Create Rule** button
3. Enter a name, description, and select an operator (AND/OR)
4. Add conditions by selecting a field, operator, and value
5. Add alerts by selecting the alert types and flights
6. Save the rule

## Managing Rules

You can manage your rules from the **Flight Rules** page:

- **Enable/Disable**: Toggle a rule's active status
- **Edit**: Modify a rule's conditions, alerts, or other properties
- **Delete**: Remove a rule

## Best Practices

1. **Use descriptive names**: Give your rules clear names that describe their purpose
2. **Start simple**: Begin with simple rules and add complexity as needed
3. **Test your rules**: Create test rules to ensure they work as expected
4. **Combine related conditions**: Use the AND operator to create precise rules
5. **Use OR for alternatives**: Use the OR operator when any condition should trigger the rule

## Examples

### Business Trip Rule

```
Name: Business Trip to New York
Operator: AND
Conditions:
  - Flight AA123: status equals "delayed"
  - Flight AA123: departureTime greaterThan "2023-12-01T12:00:00Z"
Alerts:
  - STATUS_CHANGE for Flight AA123
  - DELAY for Flight AA123
```

### Family Vacation Rule

```
Name: Family Vacation Flights
Operator: OR
Conditions:
  - Flight UA456: gate changed
  - Flight DL789: status equals "cancelled"
Alerts:
  - GATE_CHANGE for Flight UA456
  - STATUS_CHANGE for Flight DL789
```

## Troubleshooting

If you encounter issues with your rules:

1. Check that the rule is enabled
2. Verify that the conditions are correctly defined
3. Ensure that the flights referenced in the rule exist and are being tracked
4. Check your notification settings to ensure you'll receive alerts

For more help, contact support at support@flighttracker.com.

## Testing the Rules System

To test the rules system functionality, you can use the provided test script:

```bash
npm run test:rules
```

This script will:
1. Create a test user (if not exists)
2. Create a test tracked flight (if not exists)
3. Create a test rule with a condition and alert
4. Test rule evaluation with different flight data
5. Clean up the test rule

The test script is useful for verifying that the rules system is working correctly after installation or updates. 