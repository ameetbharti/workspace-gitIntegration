
var request = require("request");
var APP_ID = process.env.APP_ID;
var APP_SECRET = process.env.APP_SECRET;

const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";


const postMessage = (message, spaceId) => {

    if (!APP_ID || !APP_SECRET) {
        console.log("ERROR: Missing variables APP_ID, APP_SECRET or WEBHOOK_SECRET from environment");
        return;
    }
    const authenticationOptions = {
        "method": "POST",
        "url": `${WWS_URL}${AUTHORIZATION_API}`,
        "auth": {
            "user": APP_ID,
            "pass": APP_SECRET
        },
        "form": {
            "grant_type": "client_credentials"
        }
    };

    request(authenticationOptions, function (err, response, authenticationBody) {

        // If successful authentication, a 200 response code is returned
        if (response.statusCode !== 200) {
            // if our app can't authenticate then it must have been disabled.  Just return
            console.log("ERROR: App can't authenticate");
            return;
        }
        const accessToken = JSON.parse(authenticationBody).access_token;

        const appMessage = {
            "type": "appMessage",
            "version": "1",
            "annotations": [{
                "type": "generic",
                "version": "1",

                "title": "",
                "text": "",
                "color": "#17b94b",
            }]
        };

        const searchMessageOptions = {
            "url": "https://api.watsonwork.ibm.com/v1/spaces/${space_id}/messages",
            "headers": {
                "Content-Type": "application/json",
                "jwt": ""
            },
            "method": "POST",
            "body": ""
        };
        console.log(accessToken);

        searchMessageOptions.url = searchMessageOptions.url.replace("${space_id}", spaceId);
        searchMessageOptions.headers.jwt = accessToken;
        appMessage.annotations[0].title = "Happy to help.";
        appMessage.annotations[0].text = message;
        searchMessageOptions.body = JSON.stringify(appMessage);
        console.log(searchMessageOptions.url);
        request(searchMessageOptions, function (err, response, sendMessageBody) {

            if (err || response.statusCode !== 201) {
                console.log("ERROR: Posting to " + sendMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
            }

        });


    });

};

const postFile = (file, filePath, spaceId) => {

    if (!APP_ID || !APP_SECRET) {
        console.log("ERROR: Missing variables APP_ID, APP_SECRET or WEBHOOK_SECRET from environment");
        return;
    }
    const authenticationOptions = {
        method: "POST",
        url: `${WWS_URL}${AUTHORIZATION_API}`,
        auth: {
            user: APP_ID,
            pass: APP_SECRET
        },
        form: {
            "grant_type": "client_credentials"
        }
    };

    request(authenticationOptions, function (err, response, authenticationBody) {

        // If successful authentication, a 200 response code is returned
        if (response.statusCode !== 200) {
            // if our app can't authenticate then it must have been disabled.  Just return
            console.log("ERROR: App can't authenticate");
            return;
        }
        const accessToken = JSON.parse(authenticationBody).access_token;


        const searchMessageOptions = {
            url: "https://api.watsonwork.ibm.com/v1/spaces/${space_id}/files",
            headers: {
                'Content-Type': 'multipart/form-data',
                jwt: ""
            },
            method: "POST"

        };
        console.log(accessToken);

        searchMessageOptions.url = searchMessageOptions.url.replace("${space_id}", spaceId);
        searchMessageOptions.headers.jwt = accessToken;
        var req = request(searchMessageOptions, function (err, response, sendMessageBody) {

            if (err || response.statusCode !== 201) {
                console.log("ERROR: Posting to " + searchMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
            }

        });
        var form = req.form();
        form.append('file', file, { filename: filePath, contentType: 'text/plain' });


    });

};

module.exports = {
    postMessage: postMessage,
    postFile: postFile
};