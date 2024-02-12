var storage = chrome.storage.local;


var clientIdEl = document.getElementById("client_id");
var clientSecretEl = document.getElementById("client_secret");
var refreshTokenEl = document.getElementById("refresh_token");
var codeEl = document.getElementById("code");
var redirectEl = document.getElementById("redirect");
clientIdEl.addEventListener('input', e => { 
    storage.set({'client_id': clientIdEl.value});
});
clientSecretEl.addEventListener('input', e => { 
    storage.set({'client_secret': clientSecretEl.value});
});
refreshTokenEl.addEventListener('input', e => { 
    storage.set({'refresh_token': refreshTokenEl.value});
});
codeEl.addEventListener('input', e => {
    storage.set({'code': codeEl.value});
});
redirectEl.addEventListener('input', e => {
    storage.set({'redirect': redirectEl.value});
});
window.addEventListener("load", function(){
    updateIsValid(null);
    storage.get(['client_id', 'client_secret', 'refresh_token', 'code', 'redirect', 'generated_at', 'scopes', 'access_token'], function(result) {
        if(result != undefined) {
            if(result.client_id != undefined) {
                clientIdEl.value = result.client_id;
            }
            if(result.client_secret != undefined) {
                clientSecretEl.value = result.client_secret;
            }
            if(result.refresh_token != undefined) {
                refreshTokenEl.value = result.refresh_token;
            }
            if(result.code != undefined) {
                codeEl.value = result.code;
            }
            if(result.redirect != undefined) {
                redirectEl.value = result.redirect;
            }
            if(result.generated_at != undefined) {
                updateGeneratedAt(result.generated_at);
            }
            if(result.scopes != undefined) {
                updateScopes(result.scopes);
            }
            if(result.access_token != undefined) {
                document.getElementById("access_token").innerHTML = result.access_token;
                getCurrentUser();
            }
        }
    });
});

// static events
document.getElementById("generate_bearer").addEventListener('click', function (e) { handleGenerateClick(); });
document.getElementById("check_auth").addEventListener('click', function(e) { getCurrentUser(); });
document.getElementById("help_client_id").addEventListener('click', function(e) { helpClientId(); });
document.getElementById("help_client_secret").addEventListener('click', function(e) { helpClientSecret(); });
document.getElementById("help_refresh_token").addEventListener('click', function(e) { helpRefreshToken(); });
document.getElementById("help_code").addEventListener('click', function(e) { helpCode(); } );
document.getElementById("help_redirect").addEventListener('click', function(e) { helpRedirect(); } );

function handleGenerateClick() {
    if(clientIdEl.value.length == 0) {
        alert("Client id field must be populated.");
        return;
    }
    if(clientSecretEl.value.length == 0) {
        alert("Client secret field must be populated.");
        return;
    }
    if(codeEl.value.length > 0 && refreshTokenEl.value.length > 0) {
        alert("The code/redirect fields and refresh field cannot both be populated. Please populate only one of them.");
        return;
    }
    if(codeEl.value.length != 0 && redirectEl.value.length == 0) {
        alert("If Code field is populated, Redirect field must also be populated.");
        return;
    }
    if(codeEl.value.length == 0 && refreshTokenEl.value.length == 0) {
        alert("Please populate either the Code field or the Refresh field.");
        return;
    }
    generateAccessToken();
}

function generateAccessToken() {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
			if(data.expires_in === 0) {
				updateBearerToken(data.access_token, -1);
			} else {
				updateBearerToken(data.access_token, Date.now()+(data.expires_in*1000));
			}
            updateRefreshToken(data.refresh_token);
            updateScopes(data.scope);
            updateGeneratedAt();
            getCurrentUser(false);
            // code is only used one time and then becomes invalid
            updateCode("");
        } else {
            // bad response, assume invalid
            updateIsValid(false);
        }
    };

    // since the "code" generates a refresh token and is a one time use,
    // we should always assume that if both fields exist here, that the 
    // refresh token is valid and should be used
    if(refreshTokenEl.value.length > 0) {
        xhr.open('POST', 'https://id.twitch.tv/oauth2/token', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            client_id: clientIdEl.value,
            client_secret: clientSecretEl.value,
            refresh_token: refreshTokenEl.value,
            grant_type: 'refresh_token'
        }));
    } else if(codeEl.value.length > 0) {
        xhr.open('POST', 'https://id.twitch.tv/oauth2/token', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            client_id: clientIdEl.value,
            client_secret: clientSecretEl.value,
            code: codeEl.value,
            redirect_uri: redirectEl.value,
            grant_type: 'authorization_code'
        }));
    }
}

function getCurrentUser(refreshOnFail = true) {
    var xhr = new XMLHttpRequest();
    // we defined the xhr

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            var user = data.data[0];
            updateUsername(user.login);
            updateUserId(user.id);
            updateIsValid(true);
            enableCopy();
        } else {
            // bad response, assume invalid
            updateIsValid(false);
            if (refreshOnFail) {
                generateAccessToken();
            }
        }
    };

    xhr.open('GET', 'https://api.twitch.tv/helix/users', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Client-ID', clientIdEl.value);
    xhr.setRequestHeader('Authorization', 'Bearer ' + document.getElementById("access_token").innerHTML);
    xhr.send();
}

// ui stuff
function updateBearerToken(token, expires_at) {
    storage.set({'access_token': token, 'expires_at': expires_at});
    document.getElementById("access_token").innerHTML = token;
}
function updateUsername(username) {
    storage.set({'username': username});
    document.getElementById("username").innerHTML = username;
}
function updateUserId(userId) {
    storage.set({'user_id': userId});
    document.getElementById("user_id").innerHTML = userId;
}
function updateRefreshToken(refresh) {
    storage.set({'refresh_token': refresh});
    refreshTokenEl.value = refresh;
}
function updateCode(code) {
    storage.set({"code": code});
    codeEl.value = code;
}
function updateScopes(scopes) {
    storage.set({'scopes': scopes});
    document.getElementById("scopes").innerHTML = scopes.join(", ");
}
function updateGeneratedAt() {
    var currentdate = new Date();
    var currentDateStr = currentdate.today() + " @ " + currentdate.timeNow();
    storage.set({'generated_at': currentdate});
    document.getElementById("generated_at").innerHTML = currentDateStr;
}
function updateIsValid(isValid) {
    var isValidEl = document.getElementById("is_valid");
    if(isValid == null) {
        // yellow, unkown
        isValidEl.style.color = "olive";
        isValidEl.innerHTML = "Unknown";
        return;
    }
    if(isValid) {
        // green, valid
        isValidEl.style.color = "green";
        isValidEl.innerHTML = "True";
    } else {
        // red, invalid
        isValidEl.style.color = "red";
        isValidEl.innerHTML = "False";
    }
}

// copy stuffs
var copyIds = ['copy_access_token', 'copy_username', 'copy_user_id', 'copy_generated_at', 'copy_scopes'];
copyIds.forEach(function(ele) {
    document.getElementById(ele).addEventListener('click', function(e) {
        copyFromInnerHtml(document.getElementById(ele.substring("copy_".length)));
    });
});
function enableCopy() {
    copyIds.forEach(function(ele) {
        document.getElementById(ele).style = "";
    });
    // also show the check link
    document.getElementById("check_auth").style = "";
}
function copyFromInnerHtml(elementId) {
    document.oncopy = function(event) {
		event.clipboardData.setData("text", elementId.innerHTML);
		event.preventDefault();
	};
	document.execCommand("copy", false, null);
}

function helpClientId() {
    alert("You can get a Client Id by registering an application on https://dev.twitch.tv . To do this:\n 1. login at https://dev.twitch.tv with your Twtich account.\n 2. Register an application here: https://dev.twitch.tv/console/apps/create\n 3. Your Client ID will be listed near the bottom.");
}

function helpClientSecret() {
    alert("Using your previously (client id help) registered application, click on the 'New Secret' button. A new secret will then be generated, and you can copy it from the current page.");
}

function helpRefreshToken() {
    alert("Without third party tool:\n 1. Follow Twitch's authentication documentation: https://dev.twitch.tv/docs/authentication#getting-tokens\n\nWith third party tool:\n1. Set your redirect URL on your application on https://dev.twitch.tv to https://twitchtokengenerator.com\n 2. Open TwitchTokenGenerator.com\n 3. Insert your Client Id and Client Secret in the textboxes at the top\n 4. Select the scopes you are interested in and click Generate\n 5. At the end of the process, you'll get a Refresh token you can copy.");
}

function helpCode() {
    alert("You can use a Code value you received during the authentication process. For more information on how to get a 'code' value, please check the TwitchDev authentication getting tokens documentation.");
}

function helpRedirect() {
    alert("When using the Code value to generate a bearer token, a redirect uri is required. Provide that value here (as specified in your TwitchDev application).");
}

// From: https://stackoverflow.com/questions/10211145/getting-current-date-and-time-in-javascript
// For todays date;
Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}
// For the time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}