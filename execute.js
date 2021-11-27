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
        console.log("client id storage updated: " + changes.client_id.newValue);
        clientId = changes.client_id.newValue;
    }
    if ("access_token" in changes) {
        console.log("access token storage updated: " + changes.access_token.newValue);
        accessToken = changes.access_token.newValue;
    }
});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        details.requestHeaders.push({name: "Client-ID", value: clientId});
        details.requestHeaders.push({name: "Authorization", value: "Bearer " + accessToken});
      return { requestHeaders: details.requestHeaders };
    },
    {urls: ['https://api.twitch.tv/helix/*']},
    ['blocking', 'requestHeaders']
);
