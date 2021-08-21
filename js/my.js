var selectedID = 1;

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function configureAWS() {
    AWS.config.update({
        region: "us-east-1",
        // accessKeyId default can be used while using the downloadable version of DynamoDB. 
        // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
        accessKeyId: document.getElementById('accessKeyId').value,
        // secretAccessKey default can be used while using the downloadable version of DynamoDB. 
        // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
        secretAccessKey: document.getElementById('secretAccessKey').value,
        sessionToken: document.getElementById('sessionToken').value
    });

    try {
        dynamodb = new AWS.DynamoDB();
        docClient = new AWS.DynamoDB.DocumentClient();
        printOutput("Sucessfully configured AWS for " + JSON.stringify(AWS.config.credentials.accessKeyId));
    } catch (error) {
        printOutput("Error configuration: " + error);
    }

    console.log("Configured AWS");
}

function createMovies() {
    var params = {
        TableName: "Movies",
        KeySchema: [
            { AttributeName: "year", KeyType: "HASH" },
            { AttributeName: "title", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    dynamodb.createTable(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML = "Created table: " + "\n" + JSON.stringify(data, undefined, 2);
        }
    });
}

function updateUI(selectedID) {
    if (selectedID == 2) {

    }

}

function printOutput(text) {
    document.getElementById("textarea").innerHTML = text
}



function processFile(evt) {
    document.getElementById('textarea').innerHTML = "";
    document.getElementById('textarea').innerHTML += "Importing movies into DynamoDB. Please wait..." + "\n";
    var file = evt.target.files[0];
    console.log(file);
    if (file) {
        var r = new FileReader();
        r.onload = function (e) {
            var contents = e.target.result;
            var allMovies = JSON.parse(contents);

            allMovies.forEach(function (movie) {
                document.getElementById('textarea').innerHTML += "Processing: " + movie.title + "\n";
                var params = {
                    TableName: "Movies",
                    Item: {
                        "year": movie.year,
                        "title": movie.title,
                        "info": movie.info
                    }
                };
                docClient.put(params, function (err, data) {
                    if (err) {
                        document.getElementById('textarea').innerHTML += "Unable to add movie: " + count + movie.title + "\n";
                        document.getElementById('textarea').innerHTML += "Error JSON: " + JSON.stringify(err) + "\n";
                    } else {
                        document.getElementById('textarea').innerHTML += "PutItem succeeded: " + movie.title + "\n";
                        textarea.scrollTop = textarea.scrollHeight;
                    }
                });
            });
        };
        r.readAsText(file);
    } else {
        alert("Could not read movie data file");
    }
}

function queryData() {
    query = document.getElementById("searchbox").value;
    document.getElementById('textarea').innerHTML += "Querying for movies from 1985.";

    var params = {
        TableName : "Movies",
        KeyConditionExpression: "#yr= :yyyy AND begins_with(#title, :tt)",
        ExpressionAttributeNames:{
            "#title": "title",
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":tt":query,
            ":yyyy":2013
        }
    };

    docClient.query(params, function(err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML += "Unable to query. Error: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML += "Querying for movies from 1985: " + "\n" + JSON.stringify(data, undefined, 2);
        }
    });
}