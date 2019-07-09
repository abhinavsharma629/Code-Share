var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/mydb";

MongoClient.connect(url, function(err, db) {
  useNewUrlParser: true;
  if (err) {
    console.log("Error" + " " + err + " " + "occured");
  } else {
    console.log("db created");
    var dbase = db.db("mydb");
    dbase.createCollection("rooms", function(err, result) {
      if (err) {
        console.log("Error" + " " + err + " " + "occured");
      } else {
        console.log("Rooms Collection created successfully");
        db.close();
      }
    });

    dbase.createCollection("usersConnect", function(err, result) {
      if (err) {
        console.log("Error" + " " + err + " " + "occured");
      } else {
        console.log("Users Connect Collection created successfully");
        db.close();
      }
    });
  }
});
