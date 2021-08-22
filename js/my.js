var selectedID = 1;

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function configureAWS() {
    AWS.config.update({
        region: document.getElementById('regionCode').value,
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
    clearTable('table');
    query = document.getElementById("searchbox").value;
    year = document.getElementById("yearbox").value;
    if (!query) {
        scanData();
        return;
    }
    document.getElementById('textarea').innerHTML += "\nQuerying for movies from selected year.";

    var params = {
        TableName: "Movies",
        KeyConditionExpression: "#yr= :yyyy AND begins_with(#title, :tt)",
        ExpressionAttributeNames: {
            "#title": "title",
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":tt": query,
            ":yyyy": parseInt(year)
        },
        PageSize: 5
    };

    docClient.query(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML += "\nUnable to query. Error: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML += "\nQuerying for movies : " + "\n" + JSON.stringify(data, undefined, 2);
            var table = document.getElementById("table");

            data.Items.forEach(function (movie) {
                var row = table.insertRow(-1);
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);
                var cell2 = row.insertCell(2);
                var cell3 = row.insertCell(3);
                try {
                    cell0.innerHTML = String(count);
                    cell1.innerHTML = movie.title;
                    cell2.innerHTML = movie.year;
                    cell3.innerHTML = movie.info.rating;
                } catch (error) {
                    
                }
                
                count++;
            });
        }
    });
}


var count = 1;
function scanData() {
    console.log("Scanning Movies table.");
    clearTable('table');
    query = document.getElementById("searchbox").value;
    document.getElementById('textarea').innerHTML += "\nQuerying for movies from 1950-now.";

    var params = {
        TableName: "Movies",
        ProjectionExpression: "#yr, title, info.rating",
        FilterExpression: "#yr between :start_yr and :end_yr AND begins_with(#title, :tt)",
        ExpressionAttributeNames: {
            "#title": "title",
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":tt": query,
            ":start_yr": 1950,
            ":end_yr": 2021
        },
        PageSize: 10,
        Limit: 10
    };

    docClient.scan(params, onScan);
        
    function onScan(err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML += "\nUnable to query. Error: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML += "\nQuerying for movies from 1950: " + "\n" + JSON.stringify(data, undefined, 2);
            var table = document.getElementById("table");

            
            data.Items.forEach(function (movie) {
                var row = table.insertRow(-1);
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);
                var cell2 = row.insertCell(2);
                var cell3 = row.insertCell(3);
                try {
                    cell0.innerHTML = String(count);
                    cell1.innerHTML = movie.title;
                    cell2.innerHTML = movie.year;
                    cell3.innerHTML = movie.info.rating;
                } catch (error) {

                }

                count++;

                if (typeof data.LastEvaluatedKey != "undefined" && count < 10) {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                }
            });
        }
    };
}
function clearTable(tableID) {
    var table = document.getElementById(tableID)
    while(table.rows.length > 1) {
        table.deleteRow(1);
    }
    count = 1;
}