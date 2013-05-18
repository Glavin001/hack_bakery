/* 
 * To change this template, choose Tools | Templates
 * and open template in the editor.
 */
var net = require('net'),
    JsonSocket = require('json-socket');

var SousChef = function() {
	// Create a map to hold job functions
	var jobs = {};
	var port = 777;
	var server = net.createServer();
	server.listen(port);
	server.on('connection', function(socket) { //This is a standard net.Socket
		socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
		socket.emit = function(event, data) {
			socket.sendMessage({event: event, data: data});
		};
		socket.on('message', function(message) {
			console.log("Got message: ");
			console.dir(message);
			
			switch (message.event) {
				case "createJob":
					var JobName = message.name;
					var JobScript = message.script;

					console.log("Got Job!");
					
					jobs[JobName] = JobScript;
					
					break;
				case "submitJob":
					// Job Data Available
					// Server pinged us to let us know a job is available with the specified name
					var JobName = message.name;

					console.log("Job Available: " + JobName);
					
					// Request the job data
					socket.emit("requestJobData", {
						name: JobName
					});
					break;
				case "requestJobData":
					// Got job data
					var id = message.id;
					var data = message.data;
					
					console.log("Got job data! " + id);
					
					// Send data after job is done
					socket.emit("jobComplete", {
						id: id,
						status: 0,
						data: data
					});
					break;
			}

		});
	});
};

// Start!
new SousChef();

