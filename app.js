/*eslint-env node, express*/

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require("express");
var request = require("request");
var crypto = require("crypto");
var gitOps = require("./gitOps.js");

var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
var WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();

const gitKeyword = "@gitbot";


// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + "/public"));

function rawBody(req, res, next) {
    var buffers = [];
    req.on("data", function (chunk) {
        buffers.push(chunk);
    });
    req.on("end", function () {
        req.rawBody = Buffer.concat(buffers);
        next();
    });
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.render("error", {
        error: err
    });
}

app.use(rawBody);
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    console.log("INFO: app is listening on port: " + (process.env.PORT || 3000));
});

app.post("/webhook_callback", function (req, res) {

    if (!verifySender(req.headers, req.rawBody)) {
        console.log("ERROR: Cannot verify caller! -------------");
        console.log(req.rawBody.toString());
        res.status(200).end();
        return;
    }

    var body = JSON.parse(req.rawBody.toString());
    var eventType = body.type;
    const spaceId = body.spaceId;
    if (eventType === "verification") {
        handleVerificationRequest(res, body.challenge);
        console.log("INFO: Verification request processed");
        return;
    }

    // Acknowledge we received and processed notification to avoid getting sent the same event again
    res.status(200).end();

    if (eventType === "message-created") {
        //returning if @gitbot is not found in start of message
        if (body.content.indexOf(gitKeyword) != 0) {
            return;
        }

        let isRepoSearch = "repository";
        let isRepoList = "list";
        let isIssueSearch = "issue";
        let getReadme = "README";
        let isCommitSearch = "commits";
        let getFile = "file"

        if (body.content.indexOf(isRepoSearch) != -1 || body.content.indexOf(isRepoList) != -1) {
            let searchKeyword = body.content.split(" ").slice(4, 5);
            let language = body.content.split(" ").splice(6);
            gitOps.repoSearch(searchKeyword, language, spaceId);

        } else if (body.content.indexOf(isIssueSearch) != -1) {
            let repoKeyword = body.content.split(" ").slice(4, 5);
            let issueKeyword = body.content.split(" ").splice(6);
            gitOps.issueSearch(repoKeyword, issueKeyword, spaceId);

        } else if (body.content.indexOf(getReadme) != -1) {
            let user = "watson-developer-cloud";
            let repo = "node-sdk";
            gitOps.getReadme(user, repo, spaceId);

        } else if (body.content.indexOf(isCommitSearch) != -1) {
            let repo = "watson-developer-cloud/node-sdk";
            let commit = "node";
            gitOps.getCommits(repo, commit, spaceId);


        } else if (body.content.indexOf(getFile) != -1) {

            let user = "ameetbharti";
            let repo = "aj";
            let filepath = "simple_enough";
            gitOps.getFile(user, repo, filepath, spaceId);
        }
    }
});



function verifySender(headers, rawbody) {
    var headerToken = headers[WEBHOOK_VERIFICATION_TOKEN_HEADER];
    var endpointSecret = WEBHOOK_SECRET;
    var expectedToken = crypto
        .createHmac("sha256", endpointSecret)
        .update(rawbody)
        .digest("hex");

    if (expectedToken === headerToken) {
        return Boolean(true);
    } else {
        return Boolean(false);
    }
}

function handleVerificationRequest(response, challenge) {
    var responseBodyObject = {
        "response": challenge
    };
    var responseBodyString = JSON.stringify(responseBodyObject);
    var endpointSecret = WEBHOOK_SECRET;

    var responseToken = crypto
        .createHmac("sha256", endpointSecret)
        .update(responseBodyString)
        .digest("hex");

    response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "X-OUTBOUND-TOKEN": responseToken
    });

    response.end(responseBodyString);
}
