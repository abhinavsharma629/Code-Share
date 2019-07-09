//Make connection
// const c=require('opencv4nodejs');
var socket = io.connect("http://localhost:8000/");
var reader = new FileReader();

var message = document.getElementById("message");
var handle = document.getElementById("handle");
var button = document.getElementById("send");
var output = document.getElementById("output");
var feedback = document.getElementById("feedback");
var recordAudio = document.getElementById("record");
var recordVideo = document.getElementById("video");

//Onchange
message.addEventListener("keypress", function() {
  socket.emit("writing", {
    message: socket.id + " is typing",
    handle: handle.value
  });
});

//Onclick of Send Message
button.addEventListener("click", function() {
  let message1 = message.value;
  let handle1 = handle.value;
  handle.value = "";
  message.value = "";
  if (document.getElementById("siofu_input").files[0]) {
    fileDetail = document.getElementById("siofu_input").files[0];
    socket.emit("chat", {
      some: fileDetail,
      extention: fileDetail.name,
      handle: handle1,
      type: fileDetail.type,
      message: message1
    });
  } else {
    socket.emit("chat", {
      handle: handle1,
      message: message1
    });
  }
});

//Listen to typing
socket.on("writing", function(data) {
  feedback.innerHTML =
    "<p><em>" + data.handle + "</em> is typing a message..</p>";
});

//Listen for message
socket.on("chat", function(data) {
  feedback.innerHTML = "";

  if (data.message && !data.some) {
    output.innerHTML +=
      "<p><strong>" + data.handle + ":</strong>" + data.message + "</p>";
  } else if (data.some) {
    var bytes = new Uint8Array(data.some); // pass your byte response to this constructor
    var blob = new Blob([bytes], {
      type: data.type
    }); // change resultByte to bytes

    //Preparing the Url For File Download
    url = window.URL.createObjectURL(blob);

    if (!data.message) {
      output.innerHTML +=
        "<p><strong>" +
        (String(data.handle).length === 0 ? "No Name" : data.handle) +
        ": </strong><a href=" +
        url +
        " download=" +
        data.extention +
        ">" +
        data.extention +
        "</a></p>";
    } else if (data.message) {
      output.innerHTML +=
        "<p><strong>" +
        (String(data.handle).length === 0 ? "No Name" : data.handle) +
        ": </strong>" +
        data.message +
        "<br>" +
        (String(data.handle).length === 0
          ? "&nbsp".repeat(18)
          : "&nbsp".repeat(String(data.handle).length + 4)) +
        "<a href=" +
        url +
        " download=" +
        data.extention +
        ">" +
        data.extention +
        "</a></p>";
    }
  }
});

//Onclick of record audio
recordAudio.addEventListener("click", function() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    recordAudio.innerHTML = "Stop Audio";
    document.getElementById("record").setAttribute("id", "stop");
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      console.log("ins");
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      let message1 = message.value;
      let handle1 = handle.value;
      handle.value = "";
      message.value = "";
      recordAudio.innerHTML = "Record Audio";
      document.getElementById("stop").setAttribute("id", "record");
      var blob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(blob);
      var array = reader.readAsArrayBuffer(blob);

      //   fetch(audioUrl)
      //   .then(res => {
      //       //console.log(res.json())
      //       var data=new Array(res.arrayBuffer())[0]
      //       data.then(re1 => {
      //           var u8Array=new Int8Array(re1);
      //           var words = [], i = 0, len = u8Array.length;

      // while (i < len) {
      // 	words.push(
      // 		(u8Array[i++] << 24) |
      // 		(u8Array[i++] << 16) |
      // 		(u8Array[i++] << 8)  |
      // 		(u8Array[i++])
      // 	);
      // }

      // var i, len = words.length, b_str = "";
      // for (i=0; i<len; i++) {
      // 	b_str += String.fromCharCode(words[i]);
      // }
      // //console.log( b_str);

      // /** console.log( {
      // 	sigBytes: words.length * 4,
      // 	words: words
      // })**/
      //          })

      //       })

      socket.emit("audio", {
        audioChunck: audioChunks,
        handle: handle1,
        message: message1
      });
    });

    setTimeout(() => {
      mediaRecorder.stop();
    }, 2000);
  });
});

socket.on("audio", function(data) {
  var blob = new Blob(data.audioChunck);
  const audioUrl = URL.createObjectURL(blob);
  output.innerHTML +=
    "<p><strong>" +
    (String(data.handle).length === 0 ? "No Name" : data.handle) +
    ": </strong>" +
    (String(data.message).length === 0 ? "" : data.message) +
    "<br>" +
    (String(data.handle).length === 0
      ? "&nbsp".repeat(18)
      : "&nbsp".repeat(String(data.handle).length + 4)) +
    "<audio controls=controls src=" +
    audioUrl +
    " type=audio/mp3></audio>";
});

//Video Chat
recordVideo.addEventListener("click", function() {
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then(stream => {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
        audioBitsPerSecond: 1000000, // 1 Mbps
        bitsPerSecond: 1000000, // 2 Mbps
        echoCancellation: true
        // videoBitsPerSecond will also be 2 Mbps);
      });
      mediaRecorder.start(100);
      //console.log("recV1")
      var audioChunks = [];
      
      mediaRecorder.addEventListener("dataavailable", event => {
        console.log("hi")
        socket.emit("video", {
          audio: event.data
        });
        //mediaRecorder.start(1);
      });
      // setInterval(() => {
      //   mediaRecorder.stop();
      // }, 500);
    });
});

socket.on("video", function(data) {
  var bytes = new Int8Array(data.audio);
  console.log(bytes)
  var blob = new Blob([bytes], { type: "video/webm" });
  console.log(blob)
  const audioUrl = URL.createObjectURL(blob);
  console.log(audioUrl);
  output.innerHTML ="<video width=320 height=240 auto src=" + audioUrl + "></video>";
});

var cv=document.getElementById('cv');
var cvV=document.getElementById('videoCv');

cvV.addEventListener('click', function(){

})
