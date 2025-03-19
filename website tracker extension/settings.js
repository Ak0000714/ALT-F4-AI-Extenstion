document.addEventListener("DOMContentLoaded", function () {
    console.log("Settings page loaded.");

    let darkMode = document.getElementById("dark-mode");
    let notifications = document.getElementById("notifications");
    let tracking = document.getElementById("tracking");

    let saveBtn = document.getElementById("save-settings");
    let resetBtn = document.getElementById("reset-settings");

    if (!saveBtn || !resetBtn) {
        console.error("Buttons not found! Check IDs in settings.html");
        return;
    }

    // Load saved settings
    chrome.storage.sync.get(["settings"], function (data) {
        console.log("Loaded settings:", data);
        if (data.settings) {
            darkMode.checked = data.settings.darkMode || false;
            notifications.checked = data.settings.notifications || false;
            tracking.checked = data.settings.tracking || false;
        }
    });

    // Save settings
    saveBtn.addEventListener("click", function () {
        console.log("Save button clicked.");

        let settings = {
            darkMode: darkMode.checked,
            notifications: notifications.checked,
            tracking: tracking.checked
        };

        chrome.storage.sync.set({ settings }, function () {
            console.log("Settings saved:", settings);
            alert("Settings saved successfully!");
        });
    });

    // Reset to default settings
    resetBtn.addEventListener("click", function () {
        console.log("Reset button clicked.");

        let defaultSettings = { darkMode: false, notifications: true, tracking: true };

        chrome.storage.sync.set({ settings: defaultSettings }, function () {
            darkMode.checked = false;
            notifications.checked = true;
            tracking.checked = true;
            console.log("Settings reset to default.");
            alert("Settings reset to default.");
        });
    });
});
