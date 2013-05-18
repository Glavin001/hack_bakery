/*
Dawson Reid
Tim Speed 
Glavin
*/

var jobIdIndex = 0;

// libraries
var 
  net = require('net'),
  JsonSocket = require('json-socket'),
  //SousChef = require('./libs/SousChef').SueChef,
  fs = require('fs');

// config variables
var 
  jobs = JSON.parse(fs.readFileSync('jobs.json').toString()),
  config = JSON.parse(fs.readFileSync('config.json').toString());
  
for (var job in jobs) {
  jobs[job].script = fs.readFileSync(jobs[job].file).toString();
}
console.log("loaded jobs");

// create queues
var 
  jobQueue = {},
  processingQueue = {};
for (var jobName in jobs) {
  jobQueue[jobName] = [];
  processingQueue[jobName] = [];
}

var SousChef = function(_server) {
  var me = this;
  
  for (var prop in _server) {
    this[prop] = _server[prop];
  }
  
  this.socket = new JsonSocket(new net.Socket());
  this.socket.connect(this.port, this.address);
  
  this.socket.on('message', function(message) {
    switch (message.event)
    {
      case "requestJobData" :
        me.requestJobData(message.data);
        break;
      case "jobComplete" : 
        me.jobComplete(message.data);
        break;
      default :
        break;
    }
  });
  
  this.socket.on('connect', function() {
    
    console.log('---connected to client.');
  
    me.jobs.forEach(function(job) {
      me.emit("createJob", { 
        name: job,
        script: jobs[job].script
      });
    });
  });
  
  console.log("--created sue chef");
}

SousChef.prototype.requestJobData = function(data) {
  console.log('job [' + data.name + ':' + jobIdIndex + '] request from [' + this.name + ']');
  
  if (jobQueue[data.name].length > 0) {
    var 
      jobData = jobQueue[data.name].pop(),
      jobId = jobIdIndex++;
    
    if (!processingQueue[data.name]) {
      processingQueue[data.name] = {};
    }
    processingQueue[data.name][jobId] = jobData;
    
    this.emit("requestJobData", {
      id: jobId,
      name: data.name,
      data: jobData
      });
  }
};

SousChef.prototype.jobComplete = function(data) {
  console.log('job [' + data.name + ':' + data.id + '] completed by [' + this.name + ']');

  console.log(JSON.stringify(data, null, 2));
};

SousChef.prototype.emit = function(event, data) {
  this.socket.sendMessage({ event: event, data: data });
};

console.log("createing sue chefs");
var sousChefs = [];
config.servers.forEach(function(server) {
  sousChefs.push(new SousChef(server));
});

var feed = function(data) {
  // add job to front of job queue
  if (!jobQueue[data.name]) {
    jobQueue[data.name] = [];
  }
  jobQueue[data.name] = [data.data].concat(jobQueue[data.name]);
  
  sousChefs.forEach(function(sousChef) {
    sousChef.jobs.forEach(function(job) {
      if (job === data.name) {
        console.log('feeding job [' + data.name + '] to [' + sousChef.name + ']');
        sousChef.emit("submitJob", {
          name: data.name
        });
      }
    }); 
  });
};

var server = net.createServer();
server.listen(7777);
server.on('connection', function(socket) { 
    
    socket = new JsonSocket(socket); 
    socket.on('message', function(message) {
        switch (message.event)
        {
          case "feed" :
            //console.log(JSON.stringify(message, null, 2));
            feed(message.data);
            break;
          default :
            console.log('failure');
            console.log(JSON.stringify(message, null, 2));
            break;
        }
    });
});