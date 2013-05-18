/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var JsonSocket = require('json-socket');
var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('createJob', function (data) {
		console.log('createJob - from client:');
		console.dir(data);
		if (data.name && data.script)
			chefSocket.emit("createJob", data);
	});
	socket.on('feed', function (data) {
		console.log('feed - from client:');
		console.dir(data);
		if (data.name && data.data)
			chefSocket.emit("feed", data);
	});
	socket.on('listJobs', function (data) {
		console.log('listJobs - from client:');
		console.log(data);
		if (data.name && data.data)
			chefSocket.emit("feed", data);
	});
});

// Example usage
var port = 7777; //The same port that the server is listening on
var host = '192.168.2.113';
var chefSocket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket
chefSocket.emit = function(event, data) {
	chefSocket.sendMessage({event: event, data: data});
};
chefSocket.connect(port, host);
chefSocket.on('connect', function() { //Don't send until we're connected
    chefSocket.sendMessage({event:'feed', data: {name:'log', data:'Look behind you!'} });
    /*
    socket.on('message', function(message) {
        console.log('The result is: '+message.result);
    });
    */
    
});
