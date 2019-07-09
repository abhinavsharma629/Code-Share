var express = require("express");
var socket = require("socket.io");
var ss = require("socket.io-stream");
const utf8 = require("utf8");

var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/mydb";
var collection;
var collection1;

MongoClient.connect(url, function(err, db) {
  useNewUrlParser: true;
  if (err) {
    console.log("Error Occured while connecting to the database server");
  } else {
    console.log("Established");
    var dbase = db.db("mydb");
    //console.log(dbase);
    collection = dbase.collection("rooms");
    collection1 = dbase.collection("usersConnect");
    // console.log(collection);
  }
});

const path = require("path");
//App setup
var app = express();
var server = app.listen(3000, function() {
  console.log("Listening to request on port 8000");
});

app.use(express.static("public"));
const multer = require("multer");

const storage = multer.diskStorage({
  destination: __dirname + "/uploads/images",
  filename: function(req, file, cb) {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage: storage
}).single("selectImg");

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 1000000
  })
);
/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
// app.use(bodyParser.json());

//Socket Setup
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const fileParser = require("express-multipart-file-parser");

app.use(fileParser);

app.post("/validateRoomId", function(req, res, next) {
  console.log(req.files[0]);
  upload(req, res, function(err) {
    if (err) {
      console.log("Error Occured While Uploading");
      res.send({ status: err });
    } else {
      console.log("Successfully Uploaded");
      res.send({ status: "ok" });
    }
  });
  // var roomId = req.body.roomId;
  // const { fieldname, originalname, encoding, mimetype, buffer } = req.files[0];
  // // console.log(req.body.selectImg);
  // upload.single(req.files[0]);
  // // console.log(img, roomId);

  // console.log(req.body.roomId);
});
var io = socket(server);

io.on("connection", function(socket, username) {
  console.log(socket.handshake.query.username + " " + "-" + " " + socket.id);
  var socketId = socket.id;
  var username = socket.handshake.query.username;

  socket.on("connectcheck", function(data) {
    var id = data.roomId;
    collection.findOne({ admin: username }).then(function(room) {
      console.log(room);
      if (room !== null) {
        collection.findOne({ admin: username }).then(function(data1) {
          var roomCodeHist = data1.roomCodeHist;
          var roomTextHist = data1.roomTextHist;
          var roomChatHist = data1.roomChatHist;
          socket.join(room.roomId);
          console.log("Joined " + " " + room.roomId);
          socket.emit("adminChecked", {
            roomId: room.roomId,
            roomCodeHist: roomCodeHist,
            roomTextHist: roomTextHist,
            roomChatHist: roomChatHist,
            rights: "all"
          });
          collection
            .findOne({ admin: username }, { joinedConnections: 1 })
            .then(function(data) {
              console.log(data);
              io.in(room.roomId).emit("members", {
                members: data
              });
            });
          console.log(room.roomId);
          socket.join(room.roomId);
          socket.to(room.roomId).emit("adminConnect", "admin reconnected");
        });
      } else {
        collection1.findOne({ user: username }).then(function(data) {
          console.log(data);
          if (data !== null) {
            collection1
              .updateOne({ user: username }, { $set: { socketId: socketId } })
              .then(function() {
                if (data.roomId !== null) {
                  console.log("Ok User Connected to " + " " + data.roomId);
                  socket.join(data.roomId);

                  collection
                    .findOne({ roomId: data.roomId }, { rights: 1 })
                    .then(function(data) {
                      console.log("fgffhfhfhfh" + " " + data.rights);
                      if (data !== null) {
                        io.to(socketId).emit("self-connected", {
                          msg: "Done",
                          room: data.roomId,
                          rights: data.rights
                        });
                      }
                    });

                  collection
                    .findOne({ roomId: data.roomId }, { joinedConnections: 1 })
                    .then(function(data) {
                      if (data !== null) {
                        console.log(data);
                        io.in(data.roomId).emit("members", {
                          members: data
                        });
                      }
                    });
                  socket.to(data.roomId).emit("connected", {
                    msg: "Done",
                    username: username
                  });
                  console.log("Ok User Updated");
                } else {
                  socket.emit("noRoom", "No");
                }
              });
          } else {
            collection1
              .insertOne({ user: username, roomId: null, socketId: socketId })
              .then(function() {
                console.log("Ok User Created");
              });
            socket.emit("noRoom", "No");
          }
        });
      }
    });
  });

  //On writting signal -> Working
  socket.on("writingCode", function(data) {
    console.log(data.room);
    //console.log(data);
    // socket.broadcast.emit("writingCode", data);
    socket.to(data.room).emit("writingCode", data);
  });

  socket.on("cursorChange", function(data) {
    //console.log(data);
    // socket.broadcast.emit("cursorChange", data);
    socket.to(data.room).emit("cursorChange", data);
  });
  socket.on("changeSession", function(data) {
    //console.log(data);
    // socket.broadcast.emit("changeSession", data);
    socket.to(data.room).emit("changeSession", data);
  });

  socket.on("movCurCode", function(data) {
    //console.log(data);
    //socket.broadcast.emit("movCurCode", data);
    socket.to(data.room).emit("movCurCode", data);
  });

  socket.on("writingText", function(data) {
    // socket.broadcast.emit("writingText", data);
    socket.to(data.room).emit("writingText", data);
  });

  socket.on("movCurText", function(data) {
    // socket.broadcast.emit("movCurText", data);
    socket.to(data.room).emit("movCurText", data);
  });

  socket.on("output", function(data) {
    socket.to(data.room).emit("output", data);
  });
  socket.on("create", function(room) {
    console.log(room.id);
    var id = room.id;
    var rights = room.rights;
    collection.findOne({ roomId: room.id }).then(function(room) {
      if (room !== null) {
        console.log("Already Exists");
        io.to(socketId).emit("self-create-error", "Error");
      } else {
        collection
          .insertOne({
            admin: username,
            roomId: id,
            joinedConnections: [username],
            rights: rights
          })
          .then(function() {
            console.log("Ok Created and Joined Room");
            socket.join(id);
            io.to(socketId).emit("self-created", {
              msg: "Success",
              room: id
            });
            collection
              .findOne({ roomId: id }, { joinedConnections: 1 })
              .then(function(data) {
                console.log(data);
                io.in(id).emit("members", {
                  members: data
                });
              });
            //socket.to(room).emit("created", "Done");
          });
        collection1
          .updateOne({ user: username }, { $set: { roomId: id } })
          .then(function() {
            console.log("User Room Id Updated");
          });
      }
    });
  });

  socket.on("disconnectinghim", function(room) {
    console.log("Disconnect request");
    console.log(room);
    var id = room.id;
    var username = room.user;
    console.log("inside disconnect" + " " + id);
    collection.findOne({ roomId: id }).then(function(room1) {
      if (room !== null) {
        if (String(username) === String(room1.admin)) {
          room1.joinedConnections.forEach(function(data) {
            collection1
              .updateOne({ user: data }, { $set: { roomId: null } })
              .then(function() {
                console.log("User Room Id Cleared");
              });
          });
          collection.deleteOne({ admin: username }).then(function() {
            console.log("Admin removed the room");
            io.of("/")
              .in(id)
              .clients((error, socketIds) => {
                if (error) {
                  // throw error;
                  console.log("Error in removing client from the room");
                } else {
                  socketIds.forEach(socketId => {
                    io.to(socketId).emit("self-disconnectedhim", {
                      msg: "Admin removed the room",
                      reason: "admin"
                    });
                    io.sockets.sockets[socketId].leave(room1.id);
                    console.log("Removed client");
                  });
                }
              });
          });
        } else {
          collection
            .updateOne(
              { roomId: id },
              { $pull: { joinedConnections: username } }
            )
            .then(function() {
              socket.leave(id);
              console.log("Ok Left The Room");
            });
          collection1
            .updateOne({ user: username }, { $set: { roomId: null } })
            .then(function() {
              console.log("User Room Id Cleared");

              collection.findOne({ roomId: id }).then(function(data) {
                console.log("Disconnected Memebers Data");
                console.log(data);
                io.in(id).emit("members", {
                  members: data
                });
              });
            });
          io.to(socketId).emit("self-disconnectedhim", {
            msg: "Done",
            reason: "you"
          });
          socket.to(id).emit("disconnectedhim", {
            msg: "Done",
            username: username
          });
        }
      } else {
        collection1
          .updateOne({ socketId: socketId }, { $set: { roomId: null } })
          .then(function() {
            console.log("User Room Id Cleared");
            io.to(socketId).emit("self-disconnect-error", "Error");
          });
      }
    });
  });

  socket.on("members", function(data) {
    console.log("members");
    collection
      .findOne({ roomId: data.room }, { joinedConnections: 1 })
      .then(function(data) {
        console.log(data);
        io.in(data.room).emit("members", {
          members: data
        });
      });
  });

  socket.on("chat", function(data) {
    socket.to(data.room).emit("chat", data);
  });
  socket.on("join", function(room) {
    console.log(room.id);
    var id = room.id;
    collection.findOne({ roomId: id }).then(function(room1) {
      console.log(room1);
      if (room1 !== null) {
        collection
          .updateOne({ roomId: id }, { $push: { joinedConnections: username } })
          .then(function() {
            console.log("Ok Joined Room");
            collection1
              .updateOne(
                {
                  user: username
                },
                {
                  $set: {
                    roomId: id,
                    socketId: socketId
                  }
                }
              )
              .then(function() {
                console.log("User Room Details Updated");
              });
          });
        socket.join(id);
        // io.to(socketId).emit("self-connected", "Success");
        // io.to(room).emit("connected", "Success");
        io.to(socketId).emit("self-connected", {
          msg: "Done",
          rights: room1.rights,
          room: id
        });
        collection
          .findOne({ roomId: id }, { joinedConnections: 1 })
          .then(function(data) {
            console.log(data);
            io.in(id).emit("members", {
              members: data
            });
          });
        socket.to(id).emit("connected", {
          msg: "Done",
          username: username
        });
      } else {
        console.log("No Such Room Exists");
        io.to(socketId).emit("self-join-error", "Error");
      }
    });
  });
});
