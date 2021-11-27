var storage = chrome.storage.local;

// access storage for client 
storage.get(['client_id', 'access_token'], function(result) {
    if (result != undefined && result.client_id != undefined && result.access_token != undefined) {
        var clientId = result.client_id;
        var accessToken = result.access_token;
        chrome.webRequest.onBeforeSendHeaders.addListener(
            function(details) {
                details.requestHeaders.push({name: "Client-ID", value: clientId});
                details.requestHeaders.push({name: "Authorization", value: "Bearer " + accessToken});
              return { requestHeaders: details.requestHeaders };
            },
            {urls: ['https://api.twitch.tv/helix/*']},
            ['blocking', 'requestHeaders']
        );
    }
})
