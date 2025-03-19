let activeTab = "";
let timeSpent = {};
let categorizedSites = {}; // Store categorized site usage

// Track active tab
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab && tab.url) {
            activeTab = new URL(tab.url).hostname;
            categorizeSite(activeTab);
        }
    });
});

// Track time spent on websites
setInterval(() => {
    if (!activeTab) return;

    timeSpent[activeTab] = (timeSpent[activeTab] || 0) + 1;

    // Save time spent in Local Storage
    chrome.storage.local.set({ timeSpent });

    chrome.storage.local.get(["limits"], data => {
        let limits = data.limits || {};
        if (limits[activeTab] && timeSpent[activeTab] >= limits[activeTab]) {
            fetchAISuggestion(activeTab);
        }
    });
}, 60000); // Check every 1 minute

// Function to categorize website dynamically
function categorizeSite(site) {
    chrome.storage.local.get(["categories"], data => {
        let categories = data.categories || {};
        if (!categories[site]) {
            // Default category if unknown
            let category = getCategoryFromSite(site);
            categories[site] = category;
            chrome.storage.local.set({ categories });
        }
    });
}

// AI-powered category assignment
function getCategoryFromSite(site) {
    if (site.includes("youtube") || site.includes("netflix")) return "Entertainment";
    if (site.includes("stackoverflow") || site.includes("github")) return "Work";
    if (site.includes("twitter") || site.includes("facebook")) return "Social Media";
    return "Others"; // Default category
}

// Fetch AI suggestions when limit exceeds
function fetchAISuggestion(site) {
    fetch("http://127.0.0.1:5000/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, timeSpent: timeSpent[site] })
    })
    .then(res => res.json())
    .then(data => {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Time Limit Exceeded!",
            message: data.suggestion
        });
    });
}

// Listen for limit settings from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setLimit") {
        chrome.storage.local.get(["limits"], data => {
            let limits = data.limits || {};
            limits[message.site] = message.time;
            chrome.storage.local.set({ limits });
            sendResponse({ status: "Limit set!" });
        });
    }
});
