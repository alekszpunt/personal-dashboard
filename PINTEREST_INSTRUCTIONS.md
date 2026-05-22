# Pinterest → Moodboard Instructions

When Alex asks to search Pinterest and save to moodboard, use this flow:

## Steps

1. Use the Pinterest MCP to search for images by keyword
2. For each image to save, POST to the dashboard API:

```
POST https://[your-dashboard-url]/api/moodboard/add
Authorization: Bearer MOODBOARD_SECRET
Content-Type: application/json

{
  "imageUrl": "https://i.pinimg.com/...",
  "title": "Pin title or description",
  "project": "Bedroom",
  "note": "optional note",
  "sourceUrl": "https://pinterest.com/pin/..."
}
```

## Projects
Use one of: General, Bedroom, Living Room, Kitchen, Bathroom, Office
Or any custom project name Alex specifies.

## Example prompt
"Search Pinterest for minimalist bedroom inspo and save the best 5 to my moodboard under Bedroom"
