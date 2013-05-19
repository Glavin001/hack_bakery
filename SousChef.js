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
		console.log('Chef Connected!');
		socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
		socket.emit = function(event, data) {
			socket.sendMessage({event: event, data: data});
		};
		socket.on('message', function(message) {
			console.log("Got message: ");
			console.dir(message);
			
			switch (message.event) {
				case "createJob":
					var jobList;
					if (message.data instanceof Array) {
						jobList = message.data;
					} else {
						jobList = [message.data];
					}
					
					console.log(jobList.length);

					for (var i = 0; i < jobList.length; i++) {
						var JobName = jobList[i].name;
						var JobScript = jobList[i].script;

						console.log("Got Job!");
						console.dir(jobList[i]);

						try {
							// For now I'm just going to eval to build the functions
							jobs[JobName] = eval("(" + JobScript + ")");
						} catch (ex) {
							console.dir(ex);
						}
					};
					break;
				case "submitJob":
					// Job Data Available
					// Server pinged us to let us know a job is available with the specified name
					var JobName = message.data.name;

					console.log("Job Available: " + JobName);
					
					if (jobs[JobName]) {
						console.log("Requesting data: " + JobName);
						// Request the job data
						socket.emit("requestJobData", {
							name: JobName
						});
					}
					break;
				case "requestJobData":
					// Got job data
					var JobName = message.data.name;
					var id = message.data.id;
					var data = message.data.data;
					
					console.log("Got job data! " + id);
					
					// Call the job with the specified data, and wait for it to call the callback
					jobs[JobName](data, function(data) {
						// Build output to queue
						var out = {
							id: id,
							status: 0,
							name: JobName
						};
						
						// If we have data and job to pass it to specfied
						if (data) {
							// Append to output json
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

