var workSpace = require("./workSpace.js");
var request = require("request");


const gitURL = "https://api.github.com";
const gitSearch = "/search/repositories";
const gitSearchIssue = "/search/issues";
const gitFile = "/repos";
const gitCommits = "/search/commits";



const repoSearch = (searchKeyword, language, spaceId) => {
    console.log("request for search");

    console.log(searchKeyword + " " + language);

    const gitSearchOption = {
        "method": "GET",
        "url": `${gitURL}${gitSearch}?q=${searchKeyword}+language=${language}&sort=stars&order=desc`,
        'headers': {
            'User-Agent': 'ameetbharti'
        }
    };

    let searchMessage = "";


    request(gitSearchOption, function (err, response, gitSearchBody) {
        if (err) {
            console.log("error has occured while calling git SearchAPI" + err);
        }
        else {
            let searchBody = JSON.parse(gitSearchBody);
            let searchCount = searchBody.total_count > 3 ? 3 : searchBody.total_count;
            if (searchCount == 0) {
                console.log("No search result found");
                searchMessage = "*No git repository found for " + searchKeyword + "*";
            }
            else {

                searchMessage = "_ Listing Top " + searchCount + " results _ \n";
                for (var i = 0; i < searchCount; i++) {
                    searchMessage = searchMessage + "`" + searchBody.items[i].full_name + "` ";
                    searchMessage = searchMessage + "[ Open ](" + searchBody.items[i].html_url + ") \n";

                }
                

            }
            workSpace.postMessage(searchMessage, spaceId);
        }
    });//git request ends 

};

const issueSearch = (repoKeyword, issueKeyword, spaceId) => {
    console.log(" searching for issues");


    const issueSearchOption = {
        "method": "GET",
        "url": `${gitURL}${gitSearchIssue}?q=${issueKeyword}+repo:${repoKeyword}&sort=created&order=asc`,
        'headers': {
            'User-Agent': 'ameetbharti'
        }
    };


    let searchMessage = "";

    request(issueSearchOption, function (err, response, issueSearchBody) {
        if (err) {
            console.log("error has occured while calling git SearchAPI" + err);
        }
        else {
            let searchBody = JSON.parse(issueSearchBody);
            let searchCount = searchBody.total_count > 3 ? 3 : searchBody.total_count;
            if (searchCount == 0) {
                console.log("No search result found");
                searchMessage = "*No issue found for " + issueKeyword + "*";
            }
            else {

                console.log("Listing top " + searchCount + " result ");
                searchMessage = "_ Listing Top " + searchCount + " results _ \n";
                for (var i = 0; i < searchCount; i++) {
                    searchMessage = searchMessage + "`" + searchBody.items[i].title + "` ";
                    searchMessage = searchMessage + "[ Open ](" + searchBody.items[i].html_url + ") \n";

                }
            }
            workSpace.postMessage(searchMessage, spaceId);
        }
    });

};
const getReadme = (user,repo,spaceId)=>{
    const readmeOption = {
        "method": "GET",
        "url": `${gitURL}${gitFile}/${user}/${repo}/readme`,
        'headers': {
            'User-Agent': 'ameetbharti'
        }
    };
    console.log(JSON.stringify(readmeOption))
    request(readmeOption,(err,response,readmeBody)=>{
        console.log("start of getting README");
         if (err) {
            console.log("error has occured while calling git SearchAPI" + err);
        }
        else {

            
            let readme = JSON.parse(readmeBody);

            workSpace.postMessage(Buffer.from(readme.content, 'base64').toString("ascii"), spaceId);
            
        }

    });


};
const getCommits = (repoKeyword, commitKeyword, spaceId) => {

    console.log(" searching for commits");


    const commitSearchOption = {
        "method": "GET",
        "url": `${gitURL}${gitCommits}?q=repo:${repoKeyword}+${commitKeyword}`,
        'headers': {
            'User-Agent': 'ameetbharti',
            'Accept': 'application/vnd.github.cloak-preview'
        }
    };


    request(commitSearchOption, function (err, response, commitSearchBody) {
        if (err) {
            console.log("error has occured while calling git commitsearchAPI" + err);
        }
        else {
            let searchBody = JSON.parse(commitSearchBody);
            let searchCount = searchBody.total_count > 3 ? 3 : searchBody.total_count;
            if (searchCount == 0) {
                console.log("No search result found");
                searchMessage = "*No commits found for " + commitKeyword + " in repo "+ repoKeyword+"*";
            }
            else {
            
                searchMessage = "_ Listing Top " + searchCount + " results _ \n";
                for (var i = 1; i <= searchCount; i++) {
                    searchMessage = searchMessage + "`" +i+", "+ searchBody.items[i].commit.message + "` \n";
                    searchMessage = searchMessage + "`Commiter : " + searchBody.items[i].commit.committer.email + "`";
                    searchMessage = searchMessage + "[ Open ](" + searchBody.items[i].html_url + ") \n";

                }

            }
            console.log(searchMessage);
            workSpace.postMessage(searchMessage, spaceId);

        }
        });
};
const getFile = (user,repo,filepath,spaceId) => {
    console.log("getting file ");
     const getFileOption = {
        "method": "GET",
        "url": `${gitURL}${gitFile}/${user}/${repo}/contents/${filepath}`,
        'headers': {
            'User-Agent': 'ameetbharti',
            'Accept' : 'application/vnd.github.VERSION.raw'
        }
     };
        request(getFileOption, function(err, response, fileBody) {
            if(err){
                console.log("there is problem while getting file ");

            }
            else{
                console.log(fileBody);
                workSpace.postFile(fileBody,filepath,spaceId);
            }
        });
    


};

module.exports = {
    repoSearch: repoSearch,
    issueSearch: issueSearch,
    getReadme : getReadme,
    getCommits : getCommits,
    getFile : getFile
};
