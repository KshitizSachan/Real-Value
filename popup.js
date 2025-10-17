// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Mode info display
const modeRadios = document.querySelectorAll('input[name="mode"]');
const modeDetails = document.querySelectorAll('.mode-detail');

modeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    modeDetails.forEach(detail => detail.style.display = 'none');
    document.getElementById(`${e.target.value}-info`).style.display = 'block';
  });
});

// Calculate salary breakdowns
function calculateSalaryBreakdown(monthlySalary) {
  const weeksPerMonth = 4.33;
  const daysPerWeek = 5;
  const hoursPerDay = 7;
  
  const weeklySalary = monthlySalary / weeksPerMonth;
  const dailySalary = weeklySalary / daysPerWeek;
  const hourlySalary = dailySalary / hoursPerDay;
  
  return {
    weekly: weeklySalary,
    daily: dailySalary,
    hourly: hourlySalary
  };
}

// Update salary display
const salaryInput = document.getElementById('salary');
salaryInput.addEventListener('input', () => {
  const salary = parseFloat(salaryInput.value);
  
  if (salary && salary > 0) {
    const breakdown = calculateSalaryBreakdown(salary);
    
    document.getElementById('weekly-salary').textContent = `₹${breakdown.weekly.toFixed(2)}`;
    document.getElementById('daily-salary').textContent = `₹${breakdown.daily.toFixed(2)}`;
    document.getElementById('hourly-salary').textContent = `₹${breakdown.hourly.toFixed(2)}`;
  } else {
    document.getElementById('weekly-salary').textContent = '-';
    document.getElementById('daily-salary').textContent = '-';
    document.getElementById('hourly-salary').textContent = '-';
  }
});

// Load saved configuration
function loadConfig() {
  chrome.storage.sync.get(['salary', 'itemName', 'itemCost', 'conversionMode'], (data) => {
    if (data.salary) {
      salaryInput.value = data.salary;
      salaryInput.dispatchEvent(new Event('input'));
    }
    
    if (data.itemName) {
      document.getElementById('item-name').value = data.itemName;
    }
    
    if (data.itemCost) {
      document.getElementById('item-cost').value = data.itemCost;
    }
    
    if (data.conversionMode) {
      const radio = document.querySelector(`input[name="mode"][value="${data.conversionMode}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }
  });
}

// Save configuration
document.getElementById('save-btn').addEventListener('click', () => {
  const salary = parseFloat(salaryInput.value);
  const itemName = document.getElementById('item-name').value.trim();
  const itemCost = parseFloat(document.getElementById('item-cost').value);
  
  if (!salary || salary <= 0) {
    showStatus('config-status', 'Please enter a valid salary', 'error');
    return;
  }
  
  const config = {
    salary: salary,
    itemName: itemName || 'Coffee',
    itemCost: itemCost || 150
  };
  
  chrome.storage.sync.set(config, () => {
    showStatus('config-status', 'Configuration saved successfully!', 'success');
  });
});

// Apply conversion
document.getElementById('apply-btn').addEventListener('click', async () => {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  
  // Validate configuration
  const config = await new Promise(resolve => {
    chrome.storage.sync.get(['salary', 'itemName', 'itemCost'], resolve);
  });
  
  if (!config.salary || config.salary <= 0) {
    showStatus('status', 'Please configure your salary first in the Config tab', 'warning');
    return;
  }
  
  if (mode === 'item' && (!config.itemName || !config.itemCost || config.itemCost <= 0)) {
    showStatus('status', 'Please configure item details first in the Config tab', 'warning');
    return;
  }
  
  // Save selected mode
  chrome.storage.sync.set({ conversionMode: mode });
  
  // Get active tab and inject content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'convert',
      mode: mode,
      config: config
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('status', 'Error applying conversion. Please refresh the page and try again.', 'error');
      } else if (response && response.success) {
        showStatus('status', `Conversion applied! Found ${response.count} prices.`, 'success');
      } else {
        showStatus('status', 'No prices found on this page.', 'warning');
      }
    });
  } catch (error) {
    showStatus('status', 'Error: ' + error.message, 'error');
  }
});

// Clear conversions
document.getElementById('clear-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'clear'
  }, (response) => {
    if (response && response.success) {
      showStatus('status', 'All conversions cleared!', 'success');
    }
  });
});

// Show status message
function showStatus(elementId, message, type) {
  const status = document.getElementById(elementId);
  status.textContent = message;
  status.className = `status show ${type}`;
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

// Load config on popup open
loadConfig();