// Track converted elements
let convertedElements = new Set();

// Indian Rupee patterns - more comprehensive
const rupeePatterns = [
  /₹\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/g,
  /Rs\.?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi,
  /INR\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi,
  /(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?)/gi,
  /(?:price|cost|worth|mrp)[:\s]*₹?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi
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
  return `${quantity} ${itemName}${quantity > 1 ? 's' : ''}`;
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
      return `☕ ${calculateItemEquivalence(price, config.itemCost, config.itemName)}`;
    case 'life':
      return `📊 ${calculateLifePercentage(price, hourlySalary)}`;
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
  
  // Get all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script, style, and already processed nodes
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('price-perspective-conversion')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const nodesToProcess = [];
  let node;
  
  while (node = walker.nextNode()) {
    nodesToProcess.push(node);
  }
  
  nodesToProcess.forEach(textNode => {
    const text = textNode.textContent;
    let hasMatch = false;
    
    // Check if text contains any rupee pattern
    for (let pattern of rupeePatterns) {
      if (pattern.test(text)) {
        hasMatch = true;
        break;
      }
    }
    
    if (!hasMatch) return;
    
    // Process matches
    let modifiedText = text;
    let offset = 0;
    
    for (let pattern of rupeePatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1];
        const price = parsePrice(priceStr);
        
        if (price > 0) {
          const conversion = convertPrice(price, mode, config);
          const fullMatch = match[0];
          const replacement = `${fullMatch} <span class="price-perspective-conversion" style="color: #667eea; font-weight: 600; font-size: 0.9em; margin-left: 4px;">(${conversion})</span>`;
          
          // Create a temporary div to hold the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = modifiedText;
          
          // Replace in the parent element
          if (textNode.parentElement && !convertedElements.has(textNode.parentElement)) {
            const parent = textNode.parentElement;
            const newHTML = text.replace(fullMatch, replacement);
            
            // Only replace if we haven't processed this element yet
            if (parent.innerHTML.indexOf('price-perspective-conversion') === -1) {
              parent.innerHTML = parent.innerHTML.replace(fullMatch, replacement);
              convertedElements.add(parent);
              count++;
            }
          }
        }
      }
    }
  });
  
  return count;
}

function clearConversions() {
  // Remove all conversion spans
  const conversions = document.querySelectorAll('.price-perspective-conversion');
  conversions.forEach(span => {
    span.remove();
  });
  
  convertedElements.clear();
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