// Default settings if not stored
const defaultSettings = {
  monthly_wage: 100000,
  coffee_cost: 200,
  monthly_rent: 15000,
  comparison_type: 'work_hours',
  display_mode: 'inline',
  enabled_sites: {} // {domain: true/false}, default assume true if not set
};

// Regex for detecting INR prices (e.g., ₹1,234.56 or ₹12322)
const priceRegex = /₹\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g;

// Function to parse price string to number (remove ₹ and commas)
function parsePrice(priceStr) {
  return parseFloat(priceStr.replace(/₹|\s|,/g, ''));
}

// Function to get equivalent text based on price and settings
function getEquivalent(price, settings) {
  const equivalents = [];

  if (settings.comparison_type === 'work_hours' || settings.comparison_type === 'all') {
    const daily_wage = settings.monthly_wage / 30;
    const hourly_wage = daily_wage / 8;
    const hours = (price / hourly_wage).toFixed(1);
    equivalents.push(`${hours} work hours 💼`);
  }

  if (settings.comparison_type === 'coffee_cups' || settings.comparison_type === 'all') {
    const cups = Math.round(price / settings.coffee_cost);
    equivalents.push(`${cups} cups of coffee ☕`);
  }

  if (settings.comparison_type === 'months_rent' || settings.comparison_type === 'all') {
    const months = (price / settings.monthly_rent).toFixed(2);
    equivalents.push(`${months} months of rent 🏠`);
  }

  return equivalents.join(' | ');
}

// Function to process a text node: find prices and augment/replace
function processTextNode(textNode, settings) {
  const parent = textNode.parentNode;
  if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

  const text = textNode.textContent;
  const matches = text.match(priceRegex);
  if (!matches) return;

  const fragments = [];
  let lastIndex = 0;

  matches.forEach(match => {
    const index = text.indexOf(match, lastIndex);
    if (index > lastIndex) {
      fragments.push(document.createTextNode(text.slice(lastIndex, index)));
    }

    const price = parsePrice(match);
    const equivalent = getEquivalent(price, settings);

    const priceSpan = document.createElement('span');
    priceSpan.classList.add('realvalue-price');
    priceSpan.textContent = match;

    if (settings.display_mode === 'replace') {
      const equivSpan = document.createElement('span');
      equivSpan.classList.add('realvalue-equivalent');
      equivSpan.textContent = equivalent;
      fragments.push(equivSpan);
    } else if (settings.display_mode === 'tooltip') {
      priceSpan.title = `≈ ${equivalent}`;
      fragments.push(priceSpan);
    } else { // inline mode
      const small = document.createElement('small');
      small.style.color = 'gray';
      small.textContent = ` ≈ ${equivalent}`;
      small.classList.add('realvalue-equivalent');
      fragments.push(priceSpan);
      fragments.push(small);
    }

    lastIndex = index + match.length;
  });

  if (lastIndex < text.length) {
    fragments.push(document.createTextNode(text.slice(lastIndex)));
  }

  fragments.forEach(frag => parent.insertBefore(frag, textNode));
  parent.removeChild(textNode);
}

// Function to scan the DOM for text nodes and process prices
function scanDOM(settings) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }
  nodes.forEach(node => processTextNode(node, settings));
}

// MutationObserver to handle dynamic content
let observer;
function observeMutations(settings) {
  if (observer) observer.disconnect();
  observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node, settings);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
            let subNode;
            while ((subNode = walker.nextNode())) {
              processTextNode(subNode, settings);
            }
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Main function
chrome.storage.sync.get(null, (storedSettings) => {
  const settings = { ...defaultSettings, ...storedSettings };
  const domain = location.hostname;
  const enabled = settings.enabled_sites[domain] !== false; // Default true
  if (!enabled) return;

  scanDOM(settings);
  observeMutations(settings);
});
