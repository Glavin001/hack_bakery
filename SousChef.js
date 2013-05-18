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
					
					// For now I'm just going to eval to build the functions
					jobs[JobName] = eval("(" + JobScript + ")") ;
					
					break;
				case "submitJob":
					// Job Data Available
					// Server pinged us to let us know a job is available with the specified name
					var JobName = message.name;

					console.log("Job Available: " + JobName);
					
					if (jobs[JobName]) {
						// Request the job data
						socket.emit("requestJobData", {
							name: JobName
						});
					}
					break;
				case "requestJobData":
					// Got job data
					var JobName = message.name;
					var id = message.id;
					var data = message.data;
					
					console.log("Got job data! " + id);
					
					// Call the job with the specified data, and wait for it to call the callback
					jobs[JobName](data, function(nextJob, data) {
						// Build output to queue
						var out = {
							id: id,
							status: 0
						};
						
						// If we have data and job to pass it to specfied
						if (data && nextJob) {
							// Append to output json
							out.next = nextJob;
							out.data = data;
						}
						
						// Send data after job is done
						socket.emit("jobComplete", out);
					});
					break;
			}

		});
	});
};

// Start!
new SousChef();

