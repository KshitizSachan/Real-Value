// Track converted elements
let convertedElements = new Set();
let processedPrices = new Set();

// Indian Rupee patterns - comprehensive patterns for e-commerce sites
const rupeePatterns = [
  // Standard patterns with rupee symbol
  /₹\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/g,
  /Rs\.?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi,
  /INR\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi,
  // Price without comma separators
  /₹\s*(\d+(?:\.\d{1,2})?)/g,
  /Rs\.?\s*(\d+(?:\.\d{1,2})?)/gi,
  // Numbers followed by rupee indicators
  /(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?)/gi,
];

// Conversion functions
function calculateTimeRequired(price, hourlySalary) {
  const hours = price / hourlySalary;
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else if (hours < 8) {
    return `${hours.toFixed(1)} hr${hours >= 2 ? 's' : ''}`;
  } else {
    const days = (hours / 7).toFixed(1);
    return `${days} day${days >= 2 ? 's' : ''}`;
  }
}

function calculateItemEquivalence(price, itemCost, itemName) {
  const quantity = (price / itemCost).toFixed(1);
  const emoji = getItemEmoji(itemName);
  return `${emoji} ${quantity} ${itemName}${parseFloat(quantity) !== 1 ? 's' : ''}`;
}

function getItemEmoji(itemName) {
  const lowerName = itemName.toLowerCase();
  if (lowerName.includes('coffee')) return '☕';
  if (lowerName.includes('pizza')) return '🍕';
  if (lowerName.includes('burger')) return '🍔';
  if (lowerName.includes('movie') || lowerName.includes('ticket')) return '🎬';
  if (lowerName.includes('book')) return '📚';
  if (lowerName.includes('beer') || lowerName.includes('drink')) return '🍺';
  if (lowerName.includes('meal') || lowerName.includes('food')) return '🍽️';
  if (lowerName.includes('tea')) return '🍵';
  if (lowerName.includes('samosa') || lowerName.includes('snack')) return '🥟';
  if (lowerName.includes('ice cream')) return '🍦';
  return '📦'; // default
}

function calculateLifePercentage(price, hourlySalary) {
  // Average working life in India: 35 years (from 25 to 60)
  const workingYears = 35;
  const workingDaysPerYear = 260; // 5 days/week * 52 weeks
  const hoursPerDay = 7;
  const totalWorkingHours = workingYears * workingDaysPerYear * hoursPerDay;
  
  const hoursRequired = price / hourlySalary;
  const percentage = (hoursRequired / totalWorkingHours) * 100;
  
  if (percentage < 0.001) {
    return `< 0.001%`;
  } else if (percentage < 0.01) {
    return `${percentage.toFixed(4)}%`;
  } else if (percentage < 1) {
    return `${percentage.toFixed(3)}%`;
  } else {
    return `${percentage.toFixed(2)}%`;
  }
}

function convertPrice(price, mode, config) {
  const salary = config.salary;
  const weeklySalary = salary / 4.33;
  const dailySalary = weeklySalary / 5;
  const hourlySalary = dailySalary / 7;
  
  switch (mode) {
    case 'time':
      return `⏰ ${calculateTimeRequired(price, hourlySalary)}`;
    case 'item':
      return `${calculateItemEquivalence(price, config.itemCost, config.itemName)}`;
    case 'life':
      return `${calculateLifePercentage(price, hourlySalary)} of life`;
    default:
      return '';
  }
}

function parsePrice(priceStr) {
  // Remove commas and convert to number
  const cleaned = priceStr.replace(/,/g, '').trim();
  const price = parseFloat(cleaned);
  
  // Validate price is reasonable (between ₹1 and ₹10 crore)
  if (price < 1 || price > 100000000 || isNaN(price)) {
    return 0;
  }
  
  return price;
}

function findAndConvertPrices(mode, config) {
  let count = 0;
  const processedElements = new Set();
  
  // Strategy: Find elements that directly contain rupee symbols
  const allElements = Array.from(document.querySelectorAll('*'));
  
  // Filter to elements that have price-like characteristics
  const priceElements = allElements.filter(element => {
    // Skip unwanted elements
    if (element.tagName === 'SCRIPT' || 
        element.tagName === 'STYLE' ||
        element.classList.contains('price-perspective-conversion') ||
        convertedElements.has(element)) {
      return false;
    }
    
    const text = element.textContent;
    // Must contain rupee symbol and numbers
    return (text.includes('₹') || text.includes('Rs') || text.includes('INR')) && /\d/.test(text);
  });
  
  // Sort by element depth (process deepest elements first to avoid parent-child duplicates)
  priceElements.sort((a, b) => {
    const depthA = getElementDepth(a);
    const depthB = getElementDepth(b);
    return depthB - depthA;
  });
  
  // Process each element
  priceElements.forEach(element => {
    const text = element.textContent.replace(/\s+/g, ' ').trim();
    
    // Skip if already has conversion badge
    if (element.querySelector('.price-perspective-conversion')) {
      return;
    }
    
    // Skip if any descendant already has been converted
    let hasConvertedDescendant = false;
    for (let converted of convertedElements) {
      if (element.contains(converted) && element !== converted) {
        hasConvertedDescendant = true;
        break;
      }
    }
    
    if (hasConvertedDescendant) return;
    
    // Extract price using patterns
    let price = 0;
    let priceFound = false;
    
    for (let pattern of rupeePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      
      if (match && match[1]) {
        const priceStr = match[1];
        const parsedPrice = parsePrice(priceStr);
        
        if (parsedPrice > 0) {
          price = parsedPrice;
          priceFound = true;
          break;
        }
      }
    }
    
    // Fallback: extract largest number if rupee symbol present
    if (!priceFound) {
      const numberMatches = text.match(/\d[\d,.]*/g);
      if (numberMatches) {
        const numbers = numberMatches.map(n => parsePrice(n)).filter(n => n > 0);
        if (numbers.length > 0) {
          price = Math.max(...numbers);
          if (price >= 1 && price <= 100000000) {
            priceFound = true;
          }
        }
      }
    }
    
    if (!priceFound || price === 0) return;
    
    // Create a unique fingerprint for this element's position and price
    const elementPath = getElementPath(element);
    const elementKey = `${elementPath}-${price}`;
    
    if (processedPrices.has(elementKey)) {
      return;
    }
    
    // Check if any ancestor already has a conversion for the same/similar price
    let ancestor = element.parentElement;
    let ancestorDepth = 0;
    
    while (ancestor && ancestorDepth < 10) {
      if (convertedElements.has(ancestor)) {
        const ancestorText = ancestor.textContent.replace(/\s+/g, ' ').trim();
        // If ancestor contains this element's text, skip (it's already converted higher up)
        if (ancestorText.includes(text) && ancestor.querySelector('.price-perspective-conversion')) {
          return;
        }
      }
      ancestor = ancestor.parentElement;
      ancestorDepth++;
    }
    
    // Mark as processed
    processedPrices.add(elementKey);
    
    const conversion = convertPrice(price, mode, config);
    
    // Get font size for scaling
    const computedStyle = window.getComputedStyle(element);
    const elementFontSize = parseFloat(computedStyle.fontSize) || 14;
    
    // Calculate elegant badge size
    let badgeFontSize = Math.min(12, elementFontSize * 0.7);
    badgeFontSize = Math.max(9, badgeFontSize);
    
    // Create conversion badge
    const badge = document.createElement('span');
    badge.className = 'price-perspective-conversion';
    badge.style.cssText = `
      color: #667eea;
      font-weight: 500;
      font-size: ${badgeFontSize}px;
      margin-left: 8px;
      background: rgba(102, 126, 234, 0.08);
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
      display: inline-block;
      vertical-align: middle;
      line-height: 1.3;
      border: 1px solid rgba(102, 126, 234, 0.15);
    `;
    badge.textContent = conversion;
    
    // Append badge
    element.appendChild(document.createTextNode(' '));
    element.appendChild(badge);
    convertedElements.add(element);
    count++;
  });
  
  return count;
}

function getElementDepth(element) {
  let depth = 0;
  let parent = element.parentElement;
  while (parent) {
    depth++;
    parent = parent.parentElement;
  }
  return depth;
}

function getElementPath(element) {
  const path = [];
  let current = element;
  let depth = 0;
  
  while (current && current !== document.body && depth < 10) {
    let index = 0;
    let sibling = current;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      index++;
    }
    path.unshift(`${current.tagName}-${index}`);
    current = current.parentElement;
    depth++;
  }
  
  return path.join('/');
}

function clearConversions() {
  // Remove all conversion spans
  const conversions = document.querySelectorAll('.price-perspective-conversion');
  conversions.forEach(span => {
    span.remove();
  });
  
  convertedElements.clear();
  processedPrices.clear();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convert') {
    clearConversions();
    const count = findAndConvertPrices(request.mode, request.config);
    sendResponse({ success: true, count: count });
  } else if (request.action === 'clear') {
    clearConversions();
    sendResponse({ success: true });
  }
  
  return true; // Keep the message channel open for async response
});