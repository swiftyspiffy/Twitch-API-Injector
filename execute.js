var storage = chrome.storage.local;

getClientIdAndAccessTokenAndSetRules();

function getClientIdAndAccessTokenAndSetRules() {
    storage.get(['client_id', 'access_token'], function(result) {
        if (result != undefined && result.client_id != undefined && result.access_token != undefined) {
            const clientId = result.client_id;
            const accessToken = result.access_token;
    
            // add rule to set headers after storage get call completes successfully
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    id: 1001, // A unique ID for your rule
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
                removeRuleIds: [1001]
            });
            console.log("client id (" + clientId + ") and access token (" + accessToken + ") dynamic rule added!");
        } else {
            console.log("failed to retrieve client id and access token from storage");
        }
    });
}

storage.onChanged.addListener(function(changes, area) {
    console.log("storage updated! re-setting rules");
    getClientIdAndAccessTokenAndSetRules();
});
