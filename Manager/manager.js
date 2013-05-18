var net = require('net'),
    JsonSocket = require('json-socket'),
    jsdom = require('jsdom'),
    request = require('request');
    
var getAnchors = function(body, callback) {
    console.log("getAnchors("+")");

    jsdom.env({html:body, scripts:['http://code.jquery.com/jquery.js']}, function(err, window) {
       var $ = window.jQuery;
       var anchors = new Array();
       $("a").each(function(index,value){
          anchors.push( $(this).attr('href') ); 
       });
       callback && callback(anchors);

    });
        
};

var getWordCount = function(body, callback) {
   console.log('getWordCount');
   callback && callback(body.split(" ").length);
};

var getBody = function(uri, callback) {
    console.log('getBody('+uri+')');
    request({uri:uri}, function(err, response, body) {
        console.log("Finished request");
        
        // Basic error checking
        if (err && response.statusCode !== 200) {
            console.log('Request error.');
        }
        
        callback && callback(body);
   
    });
};

// Local Test
var body, wordCount, anchors;
getBody('http://www.smu.ca', 
    function(body) {
        getWordCount(body, function(data) { 
            wordCount = data;
            console.log("Word count:", wordCount);
            // Get anchors
            getAnchors(body, function(data) {
                anchors = data;
                console.log("Anchors:", anchors);
            });
        });
    }
);



    /*
var port = 777; //The same port that the server is listening on
var host = '127.0.0.1';
var socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket
socket.connect(port, host);
socket.on('connect', function() { //Don't send until we're connected
    socket.sendMessage({a: 5, b: 7});
    socket.on('message', function(message) {
        console.log('The result is: '+message.result);
    });
});
*/
