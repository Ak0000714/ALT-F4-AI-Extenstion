let activeTab = "";
let timeSpent = {};

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab && tab.url) {
            activeTab = new URL(tab.url).hostname;
        }
    });
});

setInterval(() => {
    if (!activeTab) return;

    timeSpent[activeTab] = (timeSpent[activeTab] || 0) + 1;

    chrome.storage.local.get(["limits"], data => {
        let limits = data.limits || {};
        if (limits[activeTab] && timeSpent[activeTab] >= limits[activeTab]) {
            fetch("http://127.0.0.1:5000/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ site: activeTab })
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
    });
}, 60000);

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
