var storage = chrome.storage.local;
var timeout

getClientIdAndAccessTokenAndSetRules();

storage.get(['expires_at'], function (result) {
	if (result != undefined && result.expires_at != undefined) {
		let now = Date.now()
		if (result.expires_at > now) {
			timeout = setTimeout(refresh, result.expires_at - now)
		} else {
			refresh()
		}
	}
});

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


storage.onChanged.addListener(function (changes, area) {
	console.log("storage updated! re-setting rules");
	getClientIdAndAccessTokenAndSetRules();
	if (Object.keys(changes).includes("expires_at")) {
		let now = Date.now()
		clearTimeout(timeout)
		if (changes.expires_at.newValue > now) {
			timeout = setTimeout(refresh, changes.expires_at.newValue - now)
		} else {
			refresh()
		}
	}
});

function refresh() {
	storage.get(['client_id', 'client_secret', 'refresh_token'], function (result) {
		fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: result.client_id,
				client_secret: result.client_secret,
				refresh_token: result.refresh_token,
				grant_type: 'refresh_token'
			})
		}).then(res => {
			if (res.status === 200) {
				res.json().then(data => {
					storage.set({ 'access_token': data.access_token, 'refresh_token': data.refresh_token, 'expires_at': Date.now() + (data.expires_in * 1000) })
				})
			} else {
				res.text().then(body => {
					console.error("Failed refreshing token", body)
				})
			}
		})
	})
}
