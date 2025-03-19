document.addEventListener("DOMContentLoaded", function () {
    const siteInput = document.getElementById("site-input");
    const timeInput = document.getElementById("time-input");
    const setLimitBtn = document.getElementById("set-limit");
    const liveTimer = document.getElementById("live-timer");
    const darkModeBtn = document.getElementById("toggle-dark-mode");
    const exportBtn = document.getElementById("export-data");
    const importInput = document.getElementById("import-data");
    const settingsBtn = document.getElementById("settings-btn");

    let currentSite = "";

    // 🔹 Get Current Tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            let url = new URL(tabs[0].url);
            currentSite = url.hostname;
            siteInput.value = currentSite;
            checkTimeLimit(currentSite);
        }
    });

    // 🔹 Set Website Usage Limit
    setLimitBtn.addEventListener("click", function () {
        const timeLimit = parseInt(timeInput.value, 10);
        if (!currentSite || isNaN(timeLimit) || timeLimit <= 0) {
            alert("Please enter a valid time limit.");
            return;
        }

        const endTime = Date.now() + timeLimit * 60 * 1000;
        chrome.storage.local.set({ [currentSite]: endTime }, function () {
            alert(`Limit set: ${timeLimit} minutes for ${currentSite}`);
            checkTimeLimit(currentSite);
        });
    });

    // 🔹 Check and Notify if Time is Exceeded
    function checkTimeLimit(site) {
        chrome.storage.local.get([site], function (data) {
            if (data[site]) {
                updateTimerDisplay(data[site]);
                const interval = setInterval(() => {
                    if (Date.now() >= data[site]) {
                        clearInterval(interval);
                        notifyUser(site);
                        chrome.storage.local.remove(site);
                    } else {
                        updateTimerDisplay(data[site]);
                    }
                }, 1000);
            }
        });
    }

    // 🔹 Update Live Timer Display
    function updateTimerDisplay(endTime) {
        const now = Date.now();
        const remainingTime = Math.max(0, endTime - now);

        const hours = String(Math.floor(remainingTime / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((remainingTime % (1000 * 60)) / 1000)).padStart(2, '0');

        liveTimer.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // 🔹 AI Productivity Suggestions
    function fetchAISuggestions(site) {
        fetch("http://127.0.0.1:5000/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ site }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.suggestion) {
                alert(`AI Suggestion: ${data.suggestion}`);
                showNotification("AI Suggestion", data.suggestion);
            } else {
                alert("AI could not generate a suggestion.");
            }
        })
        .catch(error => console.error("Error fetching AI suggestion:", error));
    }

    // 🔹 Show Chrome Notification
    function showNotification(title, message) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: title,
            message: message,
            priority: 2
        });
    }

    // 🔹 Notify User and Fetch AI Suggestion
    function notifyUser(site) {
        alert(`Time limit exceeded for ${site}! Fetching AI suggestion...`);
        fetchAISuggestions(site);
    }

    // 🔹 Load and Toggle Dark Mode
    chrome.storage.local.get("darkMode", function (data) {
        if (data.darkMode) {
            document.body.classList.add("dark");
        }
    });

    darkModeBtn.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        const isDarkMode = document.body.classList.contains("dark");
        chrome.storage.local.set({ darkMode: isDarkMode });
    });

    // 🔹 Export Data as JSON
    exportBtn.addEventListener("click", function () {
        chrome.storage.local.get(null, function (data) {
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "usage_data.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });

    // 🔹 Import Data from JSON
    importInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);
                chrome.storage.local.set(importedData, function () {
                    alert("Data imported successfully!");
                });
            } catch (error) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    });

    // 🔹 Open Settings Page
    settingsBtn.addEventListener("click", function () {
        chrome.tabs.create({ url: "settings.html" });
    });
});
