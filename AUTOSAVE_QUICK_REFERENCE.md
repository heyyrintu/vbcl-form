# Auto-Save Quick Reference

## 🎯 What Is Auto-Save?

Auto-save automatically saves your form data as you type, protecting you from data loss due to:
- Browser crashes
- Accidental page refreshes
- Power outages
- Accidental navigation away

## 🚀 How It Works

1. **Start Typing**: As soon as you enter data, auto-save activates
2. **Automatic Saving**: After 1 second of inactivity, your data is saved
3. **Visual Feedback**: See "Saving..." then "Auto-saved" in the header
4. **Return Later**: Your data is automatically restored when you come back

## 📋 Visual Indicators

### In the Header
| Indicator | Meaning |
|-----------|---------|
| 🔄 **Saving...** | Your changes are being saved |
| ✓ **Auto-saved** | Changes successfully saved |
| 🟡 **Restored from auto-save** | Previous data was recovered |

### In the Footer
| Indicator | Meaning |
|-----------|---------|
| ✓ **Changes auto-saved** | All your changes are safe |

## ⚠️ Important Notes

### ✅ Your Data IS Saved When:
- You type and wait 1 second
- You switch between fields
- You navigate away (data remains for recovery)
- You refresh the page

### ❌ Your Data IS Lost When:
- You click "Cancel" and confirm discard
- You submit the form successfully
- 24 hours pass without opening the form
- You clear browser data/cache

## 🔒 Security

- Data stored **locally** in your browser only
- Automatically sanitized to prevent attacks
- Not transmitted anywhere until you submit
- Expires after 24 hours

## 📱 Browser Support

✅ **Fully Supported:**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

⚠️ **Limited Support:**
- Private/Incognito mode (data cleared on browser close)

## 💡 Tips

1. **Trust the System**: You don't need to manually save - it's automatic!
2. **Watch for Indicators**: Look for the "Auto-saved" message
3. **Navigate Freely**: Your data will be there when you return
4. **Submit When Done**: Always submit when finished to clear auto-save

## 🆘 Troubleshooting

### Auto-save not working?

1. **Check browser compatibility** - See supported browsers above
2. **Check localStorage** - Ensure it's not disabled in settings
3. **Check storage space** - Clear browser cache if full
4. **Try another browser** - Test in Chrome or Firefox

### Data not restoring?

1. **Check time** - Data expires after 24 hours
2. **Check record** - Make sure you're editing the same entry
3. **Clear and retry** - Clear browser cache and try again

### Warning messages appear?

- **"You have unsaved changes"** - Normal! Your data is safe, this just reminds you
- Click **"Stay on Page"** to continue editing
- Click **"Leave"** to navigate (data is still saved for recovery)

## 🔗 Need More Help?

- See [AUTO_SAVE_DOCUMENTATION.md](./AUTO_SAVE_DOCUMENTATION.md) for full details
- Contact your system administrator
- Check browser console for error messages

---

**Remember**: Auto-save is your safety net, but always **submit** when you're done!
