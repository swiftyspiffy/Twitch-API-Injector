var storage = chrome.storage.local;

// global variables so that we can populate them initially from storage, and update
// them from storage onChanged event, and then use them in onBeforeSendHeaders
var clientId = "";
var accessToken = "";

storage.get(['client_id', 'access_token'], function(result) {
    if (result != undefined && result.client_id != undefined && result.access_token != undefined) {
        clientId = result.client_id;
        accessToken = result.access_token;
    }
});

storage.onChanged.addListener(function(changes, area) {
    console.log(changes);
    if ("client_id" in changes) {
        clientId = changes.client_id.newValue;
    }
    if ("access_token" in changes) {
        accessToken = changes.access_token.newValue;
    }
});

chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [], // IDs of rules to remove
    addRules: [{
        id: 1, // A unique ID for your rule
        priority: 1, // The priority of your rule
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                { "header": "Client-ID", "operation": "set", "value": clientId},
                { "header": "Authorization", "operation": "set", "value": "Bearer " + accessToken}
            ]
        },
        condition: { "urlFilter": "https://api.twitch.tv/helix/*", "resourceTypes": ["main_frame"] }
    }],
    removeRuleIds: [1]
});
