var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./credentials.json');
var s3 = new AWS.S3();
var express = require("express");
var session = require("express-session");
var userLib = require("./user.js");
var app = express();
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");
var methodOverride = require("method-override");
var hostname = process.env.HOSTNAME || "localhost";
var port = 8080;
var db = require("./node_modules/mongoskin").db("mongodb://user:password@127.0.0.1:27017/opNews");

app.use(session({secret: "This is a secret"}));
app.use(methodOverride());
//app.use(bodyParser());
app.use(require('connect').bodyParser());


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));
app.use(errorHandler());

app.get('/getDashboard', function(req,res){

    var args = req.query;
	
    var skipArg = parseInt(req.query.skip);
    var limitArg = parseInt(req.query.limit);
    //if(user){}
    //console.log(args.size);
    console.log(args.userID);


    db.collection("posts").find().sort({id:-1}).limit(limitArg).skip(skipArg).toArray(function(err, result)
	 	
    {
        if (result){res.send(JSON.stringify(result));

						
        }
    });
});


/*app.post('/uploadFile', function (req, res) {
    console.log(req.body);
    var intname = req.body.fileInput;
    var filename = req.files.input.name;
    var fileType = req.files.input.type;
    var tmpPath = req.files.input.path;
    var s3Path = '/' + intname;

    fs.readFile(tmpPath, function (err, data) {
        var params = {
            Bucket: 'bruh',
            ACL: 'public-read',
            Key: intname,
            Body: data,
            ServerSideEncryption: 'AES256'
        };
        s3.putObject(params, function (err, data) {
            console.log(err);
            res.end("success");
        });
    });
});*/

app.post('/postStory', function (req, res) {
	console.log(req.body);
	var intname = req.body.fileInput;
	var filename = req.files.input.name;
	var fileType = req.files.input.type;
	var tmpPath = req.files.input.path;
	var s3Path = '/' + intname;
	var fordb = JSON.parse(decodeURIComponent(req.body.fordb));
	console.log(JSON.stringify(fordb));
	
	db.collection(req.body.collection).insert(fordb, function(err2, result){
		if(result){
			res.end("success");
		}
	});
	
	fs.readFile(tmpPath, function (err, data) {
		var params = {
			Bucket: 'bruh',
			ACL: 'public-read',
			Key: intname,
			Body: data,
			ServerSideEncryption: 'AES256'
		};
		s3.putObject(params, function (err, data) {
			console.log(err);
			res.end("success");
		});
	});
});



app.get("/", function(req, res) {
    res.redirect("/upload.html");
});

app.get("/getAllPins", function(req, res) {
    var link = decodeURIComponent(req.query.link);
        
    readURL(link, function(data) {
        res.send(data); //send response body
    });
});

app.get("/showPins", function(req, res) {
    var info = req.query;
        
    db.collection("pins").find({user: info.user}).toArray(function(err, result) {
        if (err) {
            res.send("[]")
        }
        else {
            res.send(JSON.stringify(result));
        }
    });
});

app.get('/deletePin', function (req, res) {
    var info = req.query;
    db.collection('pins').remove({ user: info.user, id: info.id }, function (err, result) {
        if (err) {
            res.send("0")
        }
        else {
            res.send("1");
        }
    });
});

app.get("/addOrEditPin", function(req, res){
    var info = req.query;

    db.collection("pins").findOne({link: info.link}, function(err, result) {
        if (result) {
            var temp = Object.keys(info);
            var key;

            for (var t = 0; t < temp.length; t++) {
                key = temp[t];
                result[key] = info[key];
            }
                                  
            db.collection("pins").save(result, function(err2) {
                if (err2) {
                    res.send("0");
                }
                else {
                    res.send("1");
                }   
            });
        }
        else {
            db.collection("pins").insert(info, function(err3, r3) {
                if (err3) {
                    res.send("0");
                }
                else {
                    res.send("1");
                }   
            });
        }
    });
});

app.get("/createUser", function(req, res) {
    userLib.add(req, res, db);
});

app.get("/editUser", function(req, res) {
    userLib.edit(req, res, db);
});

app.get("/changePassword", function(req, res) {
    userLib.changePassword(req, res, db);
});

app.get("/login", function(req, res) {
    userLib.login(req, res, db);
});

app.get("/getUser", function(req, res) {
    userLib.get(req, res, db);
});

function readURL(url, cb) {
    var data = "";
    var protocol = url.split("://")[0];
    var request = require(protocol).get(url, function(res) {
        res.on("data", function(chunk) {
            data += chunk;
        });

        res.on("end", function() {
            cb(data);
        })
    });

    request.on("error", function(e) {
        console.log("Got error: " + e.message);
    });
}

app.use(methodOverride());
app.use(bodyParser());
app.use(express.static(__dirname + "/public"));
app.use(errorHandler());

console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port);
