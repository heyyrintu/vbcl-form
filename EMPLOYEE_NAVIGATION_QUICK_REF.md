# Employee Navigation Quick Reference

## 🎯 Quick Start

### For Users

**Navigate to Employee Profile:**
1. Go to **Employee Attendance** page
2. Click on any **employee name** in the Attendance Summary
3. View employee profile with full details
4. Click **"Back to Attendance Summary"** to return

**Visual Cues:**
- 👆 **Hover** over employee name → Color changes, arrow slides
- ⟳ **Loading** → Spinner appears while navigating
- ✓ **Success** → Page transitions smoothly
- ❌ **Error** → Red message appears, can retry

### For Developers

**Import the Hook:**
```typescript
import { useEmployeeNavigation } from '@/lib/hooks/useEmployeeNavigation';
```

**Use in Component:**
```typescript
const [navState, navActions] = useEmployeeNavigation({
  returnDate: '2025-12-26',
  returnShift: 'Day',
  fromPage: 'attendance',
});

// Navigate
await navActions.navigateToEmployee('emp-123', 'John Doe');
```

## 📋 Features Checklist

- ✅ Clickable employee names
- ✅ Loading indicators
- ✅ Error handling with retry
- ✅ URL parameter preservation
- ✅ Breadcrumb navigation
- ✅ Accessibility (ARIA labels)
- ✅ Keyboard navigation
- ✅ Smooth animations
- ✅ Return navigation
- ✅ Unit tests

## 🎨 States

| State | Visual | User Action |
|-------|--------|-------------|
| **Idle** | Employee name, → arrow | Click to navigate |
| **Hover** | Red text, arrow slides right | Visual feedback |
| **Loading** | Spinner, slightly faded | Wait for navigation |
| **Error** | Red error banner | Read message, can retry |

## 🔗 URL Structure

**Navigate TO profile:**
```
/employees/{id}?returnDate=2025-12-26&returnShift=Day&from=attendance
```

**Return FROM profile:**
```
/employee-attendance?date=2025-12-26&shift=Day
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Focus employee name |
| **Enter/Space** | Navigate to profile |
| **Esc** | Close error message |

## 🔍 Common Scenarios

### Scenario 1: View Employee Details
```
Attendance Summary → Click "John Doe" → Employee Profile
```

### Scenario 2: Return to Same Date/Shift
```
Employee Profile → Click "Back" → Returns to same date/shift
```

### Scenario 3: Error Recovery
```
Click employee → Error appears → Click again to retry
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Name not clickable | Check hover effect, ensure button enabled |
| Navigation fails | Check console, verify employee exists |
| Wrong date on return | Check URL parameters preserved |
| No error message | Check navigationError state |

## 📊 Test Commands

```bash
# Run all tests
npm test

# Run navigation tests only
npm test employee-navigation

# Watch mode
npm test -- --watch
```

## 📚 Documentation

- **Full Docs:** [EMPLOYEE_NAVIGATION_DOCUMENTATION.md](./EMPLOYEE_NAVIGATION_DOCUMENTATION.md)
- **Tests:** `__tests__/employee-navigation.test.ts`
- **Hook:** `lib/hooks/useEmployeeNavigation.ts`

## 💡 Pro Tips

1. **Hover to Preview** - Hover shows navigation intent
2. **Breadcrumbs Show Context** - See where you came from
3. **Error Messages Are Helpful** - Read them for retry info
4. **Back Preserves State** - Return to exact same view

## 🚀 Performance

- **Verification:** ~50-100ms per employee
- **Navigation:** ~200-300ms page transition
- **Error Display:** Immediate

## ✨ Accessibility

- **Screen Readers:** "View profile for [Name]"
- **Keyboard:** Full keyboard navigation support
- **Focus Management:** Proper focus indicators
- **ARIA:** Complete ARIA labels and states

## 📞 Support

**Need Help?**
1. Check [Full Documentation](./EMPLOYEE_NAVIGATION_DOCUMENTATION.md)
2. Review test examples
3. Check browser console
4. Contact development team

---

**Quick Ref Version:** 1.0  
**Updated:** December 26, 2025
