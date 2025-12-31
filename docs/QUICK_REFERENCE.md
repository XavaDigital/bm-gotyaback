# Quick Reference - Pricing & Sponsor Types Implementation

## What We're Building

### 3 Pricing Strategies
1. **Fixed** - All positions cost the same (e.g., $50 each)
2. **Positional** - Price based on position number (position 1 = $1, position 40 = $40)
3. **Pay What You Want** - Sponsors choose amount, size proportional to payment

### 3 Sponsor Types
1. **Text Only** - Traditional text sponsors
2. **Logo Only** - Logo image sponsors
3. **Both** - Campaign accepts both types

### 4 Layout Styles
1. **Grid** - Traditional rows × columns (for Fixed & Positional)
2. **Size-Ordered** - Largest sponsors first (for Pay What You Want)
3. **Amount-Ordered** - Highest payers first (for Pay What You Want)
4. **Word-Cloud** - Artistic cloud arrangement (for Pay What You Want)

---

## Timeline & Effort

**Total Estimated Time**: 38-51 hours (approximately 5-7 weeks)

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Database models | 2-3h |
| 2 | Backend services | 4-5h |
| 3 | Backend API | 2-3h |
| 4 | Frontend types | 1-2h |
| 5 | Campaign creation UI | 6-8h |
| 6 | Layout editor | 3-4h |
| 7 | Sponsor submission | 5-6h |
| 8 | Logo approval | 3-4h |
| 9 | Public display | 6-8h |
| 10 | Testing | 4-5h |
| 11 | Documentation | 2-3h |

---

## Key Technical Decisions

- **Logo Storage**: AWS S3 (already configured)
- **Logo Approval**: Organizer must approve before public display
- **Migration**: No support for existing campaigns
- **File Limits**: 2MB max, PNG/JPG/SVG, min 200x200px
- **Size Tiers**: 4 tiers (small/medium/large/xlarge)

---

## Files Summary

**New Files**: 18 total (4 backend, 14 frontend)  
**Modified Files**: 19 total (10 backend, 9 frontend)

See `IMPLEMENTATION_PLAN.md` for complete details.

---

## Recommended Approach

### Week 1: Foundation
- Backend models & services
- API endpoints
- Frontend types

### Week 2: Fixed Pricing
- Simplest pricing strategy
- End-to-end implementation
- Testing

### Week 3: Positional Pricing
- Add positional pricing
- Testing

### Week 4: Pay What You Want
- Most complex pricing
- Size tiers
- Multiple layouts

### Week 5: Logo Support
- Upload functionality
- Approval workflow
- Display updates

### Week 6: Polish
- Testing
- Bug fixes
- Documentation

---

## Next Steps

**Option A**: Start Phase 1 (Database models) - Begin implementation now  
**Option B**: Review and adjust plan  
**Option C**: Prioritize specific feature first

Ready when you are! 🚀

