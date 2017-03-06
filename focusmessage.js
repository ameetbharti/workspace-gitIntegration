  const focusMessageOptions= {
            "url":"https://api.watsonwork.ibm.com/v1/focus",
            "headers": {
                "Content-Type" : "application/json",
                "jwt" : ""

            },
            "method": "POST",
            "body" : ""
        };

        //console.log("logging focusMessageOptions "+ JSON.stringify(focusMessageOptions));

        focusMessageOptions.headers.jwt = accessToken;
       // console.log(" accesstoken is "+focusMessageOptions.headers.jwt);


        //"{ message (id: \"" + messageId + "\")
        focusMessageOptions.body =  "{ \"text\" :\"" + body.content +"\" }";

       // console.log("body content is "+ focusMessageOptions.body);

        request(focusMessageOptions, function(err, response, focusMessageBody) {

          if (err || response.statusCode !== 200) {
              console.log("ERROR: Posting to " + focusMessageOptions.url + " resulted on http status code: " + " and error " + err);
          } else {
               // console.log(" logging focus result " + JSON.stringify(focusMessageBody));
          }

        });
 if (body.userId === APP_ID) {
    console.log("INFO: Skipping our own message Body: " + JSON.stringify(body));
    return;
  }


  const spaceId = body.spaceId;

  var msgTitle = "";
  var msgText = "";
  var memberName = "";
  var memberId = "";

  const annotationType = body.annotationType;
  var messageId = body.messageId;
  var annotationPayload = JSON.parse(body.annotationPayload);



  if (annotationType === "message-nlp-docSentiment") {
    var docSentiment = annotationPayload.docSentiment;
    msgTitle = "Sentiment Analysis";
    if (docSentiment.type === "negative" && docSentiment.score < -0.50) {
      msgText = " is being negative (" + docSentiment.score + ")";
    } else if (docSentiment.type === "positive" && docSentiment.score > 0.50) {
      msgText = " seems very happy ! (" + docSentiment.score + ")";
    } else {
      // If the person is neither happy nor sad then assume neutral and just return
      return;
    }
  } else {
      // Skip analysis we are not interested in
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
 request(authenticationOptions, function(err, response, authenticationBody) {

    // If successful authentication, a 200 response code is returned
    if (response.statusCode !== 200) {
        // if our app can't authenticate then it must have been disabled.  Just return
        console.log("ERROR: App can't authenticate");
        return;
    }
    const accessToken = JSON.parse(authenticationBody).access_token;



    

    const GraphQLOptions = {
        "url": `${WWS_URL}/graphql`,
        "headers": {
            "Content-Type": "application/graphql",
            "x-graphql-view": "PUBLIC",
            "jwt": "${jwt}"
        },
        "method": "POST",
        "body": ""
    };

    GraphQLOptions.headers.jwt = accessToken;
    GraphQLOptions.body = "{ message (id: \"" + messageId + "\") {createdBy { displayName id}}}";

    request(GraphQLOptions, function(err, response, graphqlbody) {

      if (!err && response.statusCode === 200) {
          const bodyParsed = JSON.parse(graphqlbody);
          var person = bodyParsed.data.message.createdBy;
					memberId = person.id;
          memberName = person.displayName;
          msgText = memberName + msgText;

      } else {
          console.log("ERROR: Can't retrieve " + GraphQLOptions.body + " status:" + response.statusCode);
          return;
      }

      // Avoid endless loop of analysis :-)
			if (memberId !== APP_ID) {
        const appMessage = {
            "type": "appMessage",
            "version": "1",
            "annotations": [{
                "type": "generic",
                "version": "1",

                "title": "",
                "text": "",
                "color": "#ececec",
            }]
        };

        


        const sendMessageOptions = {
            "url": "https://api.watsonwork.ibm.com/v1/spaces/${space_id}/messages",
            "headers": {
                "Content-Type": "application/json",
                "jwt": ""
            },
            "method": "POST",
            "body": ""
        };

        sendMessageOptions.url = sendMessageOptions.url.replace("${space_id}", spaceId);
        sendMessageOptions.headers.jwt = accessToken;
        appMessage.annotations[0].title = msgTitle;
        appMessage.annotations[0].text = msgText;
        sendMessageOptions.body = JSON.stringify(appMessage);

        //comment added for not sending analysis 
       /* request(sendMessageOptions, function(err, response, sendMessageBody) {

          if (err || response.statusCode !== 201) {
              console.log("ERROR: Posting to " + sendMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
          }

        }); */
      }
      else {
        console.log("INFO: Skipping sending a message of analysis of our own message " + JSON.stringify(body));
      }
    });
  });