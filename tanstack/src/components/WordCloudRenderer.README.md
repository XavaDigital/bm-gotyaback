# WordCloudRenderer Implementation Guide

## Overview

The WordCloudRenderer now has **two implementations** available:

### Current (Default): `WordCloudRenderer.tsx`
- **Text-only mode**: Uses `wordcloud2.js` library for professional word cloud rendering
- **Logo-only & both modes**: Uses custom spiral placement algorithm with improved tight packing

### Legacy (Backup): `WordCloudRenderer.legacy.tsx`
- **All modes**: Uses tightened custom spiral placement algorithm
- Useful if you want custom rendering for text-only instead of wordcloud2.js

## Files

### 1. `WordCloudRenderer.tsx` (Current - Hybrid Approach)
The active component with hybrid rendering:
- **Text-only**: wordcloud2.js on canvas with professional word cloud algorithm
- **Logo modes**: Custom spiral placement with improved tight packing (~50% tighter)

### 2. `WordCloudRenderer.legacy.tsx` (Backup - All Custom)
Tightened custom spiral placement for ALL modes (text-only, logo-only, both):
- Same tight packing improvements as the current logo modes
- Use this if you prefer custom rendering over wordcloud2.js for text
- Fully functional drop-in replacement

## How to Switch to Legacy (Custom for All Modes)

If you want to use the tightened custom implementation for all modes including text-only:

**Option 1 - Quick Switch in Parent Component:**
```tsx
// Change this:
import WordCloudRenderer from "~/components/WordCloudRenderer";

// To this:
import WordCloudRenderer from "~/components/WordCloudRenderer.legacy";
```

**Option 2 - Rename Files:**
1. Rename `WordCloudRenderer.tsx` to `WordCloudRenderer.wordcloud2js.tsx`
2. Rename `WordCloudRenderer.legacy.tsx` to `WordCloudRenderer.tsx`

## Key Improvements

### Current Implementation - Text-Only Mode (wordcloud2.js)
- Professional word cloud algorithm
- Better word packing
- Automatic rotation (30% chance, 0° or 90°)
- Random grayscale colors
- Click interaction support

### Both Implementations - Logo Modes & Legacy Text Mode (Custom Algorithm)
**Spacing Reductions (Applied to Both):**
- Padding around logos: 30px → 16px (47% reduction)
- Collision padding: 12px → 6px (50% reduction)
- Item padding: 8px → 4px (50% reduction)
- Item gap: 4px → 2px (50% reduction)

**Tighter Spiral (Applied to Both):**
- Spiral speed: 0.5 → 0.4 (20% tighter)
- Radius increment: 8 → 4 (50% tighter)
- Start radius: 10 → 5 (50% closer)
- Random offset: 15 → 8 (47% less variance)

**Better Placement (Applied to Both):**
- Max attempts: 1000 → 2000 (more tries)
- More accurate logo height calculation

> **Note:** The legacy version uses the same tightened custom algorithm for ALL modes, including text-only.

## Dependencies

```json
{
  "wordcloud": "^1.2.2"
}
```

## Usage

```tsx
import WordCloudRenderer from "~/components/WordCloudRenderer";

// Text-only mode - uses wordcloud2.js
<WordCloudRenderer 
  sponsors={sponsors} 
  sponsorDisplayType="text-only" 
/>

// Logo modes - uses custom algorithm
<WordCloudRenderer 
  sponsors={sponsors} 
  sponsorDisplayType="logo-only" 
/>

<WordCloudRenderer 
  sponsors={sponsors} 
  sponsorDisplayType="both" 
/>
```

## Comparison

| Feature | Current (Hybrid) | Legacy (All Custom) |
|---------|------------------|---------------------|
| Text-only rendering | wordcloud2.js (professional) | Custom spiral (tightened) |
| Logo-only rendering | Custom spiral (tightened) | Custom spiral (tightened) |
| Both mode rendering | Custom spiral (tightened) | Custom spiral (tightened) |
| Text packing quality | Excellent (wordcloud2.js) | Good (custom) |
| Logo support | ✅ Yes | ✅ Yes |
| Customization | Limited for text | Full control |
| Dependencies | Requires wordcloud package | No extra dependencies |

## Future Considerations

- The wordcloud2.js library doesn't support images/logos, only text
- If you need logo support in word cloud style, the custom algorithm is the only option
- Consider adding hover tooltips to wordcloud2.js canvas for better UX
- Could add color customization options to wordcloud2.js configuration
- Both implementations now use the same tight packing for consistency

