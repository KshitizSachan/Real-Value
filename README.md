# Price Perspective - Browser Extension

A Chrome/Edge browser extension that converts prices on web pages to meaningful units: work time required, item equivalents, or life percentage.

## 📁 File Structure

```
price-perspective/
│
├── manifest.json          # Extension manifest file
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── content.js            # Content script for page manipulation
├── icons/                # Extension icons
│   ├── icon16.png       # 16x16 icon
│   ├── icon48.png       # 48x48 icon
│   └── icon128.png      # 128x128 icon
└── README.md            # This file
```

## 🚀 Installation

1. **Create the extension folder:**
   - Create a new folder called `price-perspective`
   - Add all the files listed above to this folder

2. **Create icon images:**
   - Create a folder called `icons` inside `price-perspective`
   - Create three PNG icon files (you can use any image editor or online tool):
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - Use a simple rupee symbol or money-related icon

3. **Load the extension in Chrome/Edge:**
   - Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `price-perspective` folder
   - The extension should now appear in your extensions list

## 📖 Usage

### Configuration

1. Click the extension icon in your browser toolbar
2. Go to the "Config" tab
3. Enter your monthly salary in rupees
4. (Optional) Set up item comparison:
   - Enter an item name (e.g., "Coffee", "Pizza", "Movie ticket")
   - Enter the cost of that item

### Converting Prices

1. Navigate to any webpage with prices in rupees
2. Click the extension icon
3. In the "Convert" tab, select your preferred conversion mode:
   - **⏰ Work Time Required**: Shows how long you'd need to work to afford the item
   - **☕ Item Equivalence**: Shows how many units of your chosen item equals the price
   - **📊 Life Percentage**: Shows what percentage of your working life this cost represents
4. Click "Apply Conversion"
5. Converted values will appear next to all prices on the page

### Clearing Conversions

Click the "Clear All" button in the extension popup to remove all conversions from the current page.

## 🎯 Features

- **Automatic Price Detection**: Finds prices in multiple formats (₹, Rs., INR, rupees)
- **Three Conversion Modes**:
  - Time-based (minutes, hours, days of work)
  - Item equivalence (e.g., number of coffees)
  - Life percentage (portion of working life)
- **Real-time Calculation**: Shows salary breakdown (weekly, daily, hourly)
- **Non-intrusive**: Adds conversions inline without breaking page layout
- **Persistent Settings**: Saves your configuration across sessions

## 💡 Calculations

- **Work Time**: Based on 5-day work week, 7-hour work day
- **Life Percentage**: Based on 35-year working life (age 25-60), 260 working days/year

## 🛠️ Technical Details

- Built with vanilla JavaScript (no dependencies)
- Uses Chrome Extension Manifest V3
- Storage API for persistent configuration
- Content script injection for page manipulation
- Works on all websites (requires `<all_urls>` permission)

## 🔧 Customization

You can modify the following in `content.js`:
- Rupee patterns (add more regex patterns)
- Working hours per day (currently 7)
- Working days per week (currently 5)
- Working life years (currently 35 years)
- Conversion styling (inline styles in the code)

## 📝 Notes

- The extension detects prices in Indian Rupees (₹, Rs., INR)
- Conversions are visual only and don't modify the actual webpage data
- Refreshing the page will remove conversions