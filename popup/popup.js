const defaultSettings = {
  monthly_wage: 100000,
  coffee_cost: 200,
  monthly_rent: 15000,
  comparison_type: 'work_hours',
  display_mode: 'inline',
  enabled_sites: {}
};

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(null, (settings) => {
    document.getElementById('monthly_wage').value = settings.monthly_wage || defaultSettings.monthly_wage;
    document.getElementById('coffee_cost').value = settings.coffee_cost || defaultSettings.coffee_cost;
    document.getElementById('monthly_rent').value = settings.monthly_rent || defaultSettings.monthly_rent;
    document.getElementById('comparison_type').value = settings.comparison_type || defaultSettings.comparison_type;
    document.getElementById('display_mode').value = settings.display_mode || defaultSettings.display_mode;
    
    // Get current domain and set toggle
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      const enabledSites = settings.enabled_sites || {};
      const isEnabled = enabledSites[domain] !== false;
      document.getElementById('site_toggle').checked = isEnabled;
      
      // On toggle change
      document.getElementById('site_toggle').addEventListener('change', (e) => {
        enabledSites[domain] = e.target.checked;
        chrome.storage.sync.set({ enabled_sites: enabledSites });
      });
    });
  });
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', () => {
    const newSettings = {
      monthly_wage: parseFloat(document.getElementById('monthly_wage').value),
      coffee_cost: parseFloat(document.getElementById('coffee_cost').value),
      monthly_rent: parseFloat(document.getElementById('monthly_rent').value),
      comparison_type: document.getElementById('comparison_type').value,
      display_mode: document.getElementById('display_mode').value
    };
    chrome.storage.sync.set(newSettings, () => {
      alert('Settings saved!');
      // Optionally refresh the page to apply, but content script will pick up on next load
    });
  });
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    chrome.storage.sync.set(defaultSettings, () => {
      location.reload();
    });
  });
});