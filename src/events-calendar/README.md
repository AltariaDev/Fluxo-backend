# Events Calendar - Recurring Events

## Overview

The Events Calendar module now supports recurring events with flexible patterns including:
- Daily recurring events
- Weekly recurring events with specific days
- Monthly recurring events
- Custom intervals and end dates

## Usage Examples

### 1. Weekly Event (Every Monday and Wednesday)

```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "startDate": "2024-01-15T09:00:00Z",
  "duration": 60,
  "category": "Meeting",
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3],
    "maxOccurrences": 20
  }
}
```

### 2. Every Monday for 3 months

```json
{
  "title": "Monday Standup",
  "startDate": "2024-01-01T09:00:00Z",
  "duration": 30,
  "recurrence": {
    "frequency": "weekly", 
    "interval": 1,
    "daysOfWeek": [1],
    "endDate": "2024-04-01T00:00:00Z"
  }
}
```

### 3. Every 2 weeks

```json
{
  "title": "Bi-weekly Review",
  "startDate": "2024-01-01T14:00:00Z",
  "duration": 90,
  "recurrence": {
    "frequency": "weekly",
    "interval": 2,
    "maxOccurrences": 10
  }
}
```

### 4. Monthly Events

```json
{
  "title": "Monthly All Hands",
  "startDate": "2024-01-01T16:00:00Z",
  "duration": 120,
  "recurrence": {
    "frequency": "monthly",
    "interval": 1,
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

## API Endpoints

### Get Events in Date Range
`GET /events-calendar/range?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z`

This endpoint generates recurring event instances on-the-fly for the specified date range.

### Day of Week Values
- 0: Sunday
- 1: Monday  
- 2: Tuesday
- 3: Wednesday
- 4: Thursday
- 5: Friday
- 6: Saturday

## Recurrence Options

- `frequency`: 'daily', 'weekly', 'monthly'
- `interval`: How often (every X days/weeks/months)
- `daysOfWeek`: Array of day numbers (0-6) for weekly events
- `endDate`: When to stop recurring (optional)
- `maxOccurrences`: Maximum number of occurrences (optional) 

Let me break down how the recurrence system works in this calendar:

1. **Basic Structure**
```typescript
interface RecurrencePattern {
  frequency: RecurrenceFrequency;  // 'daily', 'weekly', 'monthly'
  interval: number;                // Every X weeks/days/months
  daysOfWeek?: DayOfWeek[];       // For weekly: which days
  endDate?: Date;                  // When to stop recurring
  maxOccurrences?: number;         // Alternative to endDate
}
```

2. **Flow**:
   - When you create an event with recurrence, it's stored as a "base event"
   - The actual recurring instances are generated on-the-fly when querying events
   - This is handled by `findEventsInRange` method

3. **How it works**:

```typescript
// 1. When querying events in a range
async findEventsInRange(userId, startDate, endDate) {
  // Get base events (non-recurring instances)
  const baseEvents = await this.eventsCalendarModel.find({ 
    userId, 
    isRecurringInstance: { $ne: true }
  });

  const allEvents = [];

  // 2. For each base event
  for (const event of baseEvents) {
    if (event.recurrence) {
      // Generate recurring instances
      const recurringEvents = this.generateRecurringEvents(event, startDate, endDate);
      allEvents.push(...recurringEvents);
    } else {
      // Single event within range
      if (event.startDate >= startDate && event.startDate <= endDate) {
        allEvents.push(event);
      }
    }
  }
}
```

4. **Recurrence Types**:

```typescript
// Weekly Example
{
  title: "Team Meeting",
  startDate: "2024-01-15T09:00:00Z",
  recurrence: {
    frequency: "weekly",
    interval: 1,                    // Every week
    daysOfWeek: [1, 3],            // Monday and Wednesday
    maxOccurrences: 20             // Stop after 20 occurrences
  }
}

// Monthly Example
{
  title: "Monthly Review",
  startDate: "2024-01-01T14:00:00Z",
  recurrence: {
    frequency: "monthly",
    interval: 1,                    // Every month
    endDate: "2024-12-31T23:59:59Z" // Stop at end of year
  }
}
```

5. **Instance Generation**:
```typescript
private generateRecurringEvents(baseEvent, rangeStart, rangeEnd) {
  const events = [];
  const recurrence = baseEvent.recurrence;
  
  let currentDate = new Date(baseEvent.startDate);
  let occurrenceCount = 0;
  
  // Stop conditions
  const maxDate = recurrence.endDate || rangeEnd;
  const maxOccurrences = recurrence.maxOccurrences || 100;

  // Generate instances until we hit a stop condition
  while (currentDate <= maxDate && 
         currentDate <= rangeEnd && 
         occurrenceCount < maxOccurrences) {
    
    if (currentDate >= rangeStart) {
      if (this.shouldCreateOccurrence(currentDate, recurrence)) {
        // Create instance
        const occurrenceEvent = {
          ...baseEvent.toObject(),
          _id: new mongoose.Types.ObjectId(),
          startDate: new Date(currentDate),
          isRecurringInstance: true,
          parentEventId: baseEvent._id,
        };
        events.push(occurrenceEvent);
        occurrenceCount++;
      }
    }
    
    // Move to next occurrence
    currentDate = this.getNextOccurrenceDate(currentDate, recurrence);
  }
}
```

6. **Day of Week Handling**:
```typescript
export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}
```

7. **Key Features**:
   - Events are stored as base events with recurrence rules
   - Instances are generated on-the-fly when querying
   - Supports multiple recurrence patterns (daily, weekly, monthly)
   - Can stop by date or number of occurrences
   - Weekly events can specify which days of the week
   - Each instance maintains link to parent event
   - Instances are marked with `isRecurringInstance: true`

8. **Usage Example**:
```typescript
// Create a weekly meeting
const weeklyMeeting = {
  title: "Team Standup",
  startDate: "2024-01-15T09:00:00Z",
  duration: 30,
  recurrence: {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [1, 3],  // Monday and Wednesday
    maxOccurrences: 20
  }
};

// Query events for a month
const startDate = new Date("2024-01-01");
const endDate = new Date("2024-01-31");
const events = await eventsCalendarService.findEventsInRange(userId, startDate, endDate);
// This will generate all instances of the weekly meeting within that month
```

This system is efficient because:
1. It doesn't store every instance in the database
2. Instances are generated only when needed
3. Changes to the base event automatically affect all future instances
4. It's flexible enough to handle various recurrence patterns
5. It maintains data consistency by linking instances to their parent event