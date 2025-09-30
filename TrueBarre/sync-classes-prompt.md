# TrueBarre Class Schedule Sync

## THE PROMPT - COPY THIS:

```
Scrape https://truebarrelawrence.com/classes with Firecrawl and add all of today's classes to Notion database https://www.notion.so/c4a2cd74ceed4355b2cb99afc9496a3f

TIMEZONE: Website shows "UTC" but it's wrong. Subtract 5 hours (CDT: Mar-Nov) or 6 hours (CST: Nov-Mar) from displayed times.

FIELD RULES:
- Name: Class name only (NO instructor)
- Class_Time: Converted time + "CDT" or "CST" (e.g., "6:00 AM CDT")
- Duration_Minutes: Number from site (45 or 60)
- Day_of_Week: Full day name ("Tuesday")
- Date: date:Date:start = "YYYY-MM-DD", date:Date:is_datetime = 0
- Class_Type: Map to URL from list below
- Instructor: [] (empty array)
- Is_Active: __YES__ if class time > current Central time, else __NO__
- Online_Booking_Available: __YES__
- Schedule_Notes: "Instructor: {name}. Price: $25.00 drop-in. Intro offers available. Time is in Central Daylight Time (CDT)."
- Source_URL: https://truebarrelawrence.com/classes

CLASS TYPE URLS:
- True Barre, True Barre Express → https://www.notion.so/27168cd312628155a02ff6ac17367ebc
- Mat Pilates Barre Sculpt, Pilates & Barre Sculpt → https://www.notion.so/27168cd31262813588fff12798327fea
- True Barre® + Pilates Restore → https://www.notion.so/27168cd31262814c9c50eafbf9f6f6c0
- Barre & Boxing → https://www.notion.so/27168cd3126281b09ec5d6a4abe82ad9
- Flex n Flow → https://www.notion.so/27168cd3126281369b08df31bdebfa03
- Barre Booty HIIT + Core → https://www.notion.so/27168cd3126281b783def70a74739930

Add to data source: collection://b7d17f1d-0b85-44b4-8b62-9fa3e4cb5c4b
Do NOT update existing records. Add new records only.
```

---

## FULL TECHNICAL SPEC

### TIMEZONE CONVERSION ALGORITHM
**Problem**: Website shows times labeled "UTC" but they're actually in browser's local timezone  
**Solution**: Convert to Central Time (Lawrence, KS)

```python
# Conversion logic:
1. Extract time from HTML (e.g., "12:30 PM UTC")
2. Determine current timezone offset:
   - IF current_date between 2nd Sunday March AND 1st Sunday November:
     offset = -5  # CDT (Central Daylight Time)
     suffix = "CDT"
   - ELSE:
     offset = -6  # CST (Central Standard Time)  
     suffix = "CST"
3. Convert: displayed_time + offset = central_time
4. Format: "{central_time} {suffix}"  # e.g., "6:00 AM CDT"
```

**Example**: 
- Input: "12:30 PM UTC" (September 30)
- September = CDT period → offset = -5
- Calculation: 12:30 PM - 5 hours = 7:30 AM
- Output: "7:30 AM CDT"

### FIELD MAPPING

| Source | Notion Field | Format | Example |
|--------|--------------|--------|----------|
| Class name | `Name` (title) | `{class_name}` only | "True Barre Express" |
| Instructor | `Schedule_Notes` | Include in notes | "Instructor: Shannon C" |
| Time | `Class_Time` | `H:MM AM/PM {CDT\|CST}` | "6:00 AM CDT" |
| Date | `date:Date:start` | `YYYY-MM-DD` | "2025-09-30" |
| Duration | `Duration_Minutes` | Integer | 45 |
| Day | `Day_of_Week` | Full name | "Tuesday" |
| Class Type | `Class_Type` | JSON array of URL | `["https://notion.so/{id}"]` |
| Instructor relation | `Instructor` | Empty array | `[]` |

### CLASS TYPE URL MAPPING
```json
{
  "True Barre": "https://www.notion.so/27168cd312628155a02ff6ac17367ebc",
  "True Barre Express": "https://www.notion.so/27168cd312628155a02ff6ac17367ebc",
  "Mat Pilates Barre Sculpt": "https://www.notion.so/27168cd31262813588fff12798327fea",
  "Pilates & Barre Sculpt": "https://www.notion.so/27168cd31262813588fff12798327fea",
  "True Barre® + Pilates Restore": "https://www.notion.so/27168cd31262814c9c50eafbf9f6f6c0",
  "Barre & Boxing": "https://www.notion.so/27168cd3126281b09ec5d6a4abe82ad9",
  "Flex n Flow": "https://www.notion.so/27168cd3126281369b08df31bdebfa03",
  "Barre Booty HIIT + Core": "https://www.notion.so/27168cd3126281b783def70a74739930"
}
```

### ACTIVE STATUS LOGIC
```python
# Get current Central Time
current_time_cdt = current_utc_time - 5_hours  # or -6 for CST

# For each class:
if class_time_cdt > current_time_cdt:
    Is_Active = "__YES__"
else:
    Is_Active = "__NO__"
```

### DATA OPERATIONS
- **Mode**: INSERT only (never UPDATE existing records)
- **Target**: Data source `collection://b7d17f1d-0b85-44b4-8b62-9fa3e4cb5c4b`
- **Batch**: Process all classes from current day in single operation

### REQUIRED PROPERTY VALUES
```json
{
  "Name": "{class_name}",  // NO instructor name here
  "Class_Time": "{time} CDT|CST",
  "Duration_Minutes": 45 | 60,
  "date:Date:start": "YYYY-MM-DD",
  "date:Date:is_datetime": 0,
  "Day_of_Week": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
  "Class_Type": "[\"https://www.notion.so/{id}\"]",
  "Instructor": "[]",
  "Is_Active": "__YES__|__NO__",
  "Online_Booking_Available": "__YES__",
  "Source_URL": "https://truebarrelawrence.com/classes",
  "Schedule_Notes": "Instructor: {name}. Price: $25.00 drop-in. Intro offers available. Time is in Central {Daylight|Standard} Time ({CDT|CST})."
}
```

---

## Example Shortened Version

```
Sync today's classes from https://truebarrelawrence.com/classes to Notion DB https://www.notion.so/c4a2cd74ceed4355b2cb99afc9496a3f. 

IMPORTANT: Times show as "UTC" but are wrong. Convert by subtracting 5 hours (CDT, Mar-Nov) or 6 hours (CST, Nov-Mar), then add CDT/CST suffix. Mark Is_Active based on current Central time. Add new records only.
```

---

## Database Info

- **Database URL**: https://www.notion.so/c4a2cd74ceed4355b2cb99afc9496a3f?v=7951513b09494ade9c80699dd380d1f5
- **Data Source ID**: collection://b7d17f1d-0b85-44b4-8b62-9fa3e4cb5c4b
- **Timezone**: Central Time (Lawrence, KS)

---

## Class Types Reference

Based on existing class types in your database:
- True Barre® → https://www.notion.so/27168cd312628155a02ff6ac17367ebc
- Mat Pilates Barre Sculpt → https://www.notion.so/27168cd31262813588fff12798327fea
- Pilates & Barre Sculpt → (same as Mat Pilates Barre Sculpt)
- True Barre® + Pilates Restore → https://www.notion.so/27168cd31262814c9c50eafbf9f6f6c0
- Barre & Boxing → https://www.notion.so/27168cd3126281b09ec5d6a4abe82ad9
- Flex n Flow → https://www.notion.so/27168cd3126281369b08df31bdebfa03
- Barre Booty HIIT + Core → https://www.notion.so/27168cd3126281b783def70a74739930

---

## Notes

- **CRITICAL**: The website HTML labels times as "UTC" but this is INCORRECT
- The displayed times are in the USER'S browser timezone, NOT UTC
- **Conversion needed**: Subtract 5 hours (CDT) or 6 hours (CST) from displayed time
- **DST Rules for Lawrence, Kansas**:
  - CDT (UTC-5): Second Sunday in March to First Sunday in November
  - CST (UTC-6): First Sunday in November to Second Sunday in March
- Example: "12:30 PM UTC" in September → 12:30 PM - 5 hours = 7:30 AM CDT
- Current time for Is_Active comparison: Use CDT/CST (Lawrence, Kansas time)
- Drop-in price is typically $25.00 with intro offers available
- All classes are available for online booking
