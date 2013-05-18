/*
Dawson Reid
Tim Speed 
Glavin
*/

var jobIdIndex = 0;

var 
  sockets = require('json-sockets'),
  fs = require('fs');

// config variables
var 
  jobs = JSON.parse(fs.readFileSync('jobs.json').toString()),
  config = JSON.parse(fs.readFileSync('config.json').toString());
//console.log(JSON.stringify(jobs, null, 2));
//console.log(JSON.stringify(config, null, 2))

// load all jobs
for (var job in jobs) {
  jobs[job].script = fs.readFileSync(jobs[job].file).toString();
}

var 
  jobQueue = {},
  processingQueue = {},
  sueChefs = [];

// create job queues
for (var jobName in jobs) {
  jobQueue[jobName] = [];
}

var feed = function(data) {
  // add job to front of job queue
  if (!jobQueue[data.name]) {
    jobQueue[data.name] = [];
  }
  jobQueue[data.name] = [data.data].concat(jobQueue[data.name]);
  
  sueChefs.forEach(function(sueChef) {
    sueChef.jobs.forEach(function(job) {
      if (job === data.name) {
        sueChef.emit("submitJob", data.name);
      }
    }); 
  });
};

var SueChef = function(_server) {
  var me = this;
  
  for (var prop in _server) {
    this[prop] = _server[prop];
  }
  
  this.socket = sockets.connect(this.address + ":" + this.port);
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
    
    console.log('Connected to client.');
  
    me.jobs.forEach(function(job) {
      me.emit("createJob", { 
        name: job,
        script: jobs[job].script
      });
    });
  });
  
  console.log("created sue chef");
}

SueChef.prototype.requestJobData = function(data) {
  
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

SueChef.prototype.jobComplete = function(data) {
  console.log(JSON.stringify(data, null, 2));
};

SueChef.prototype.emit = function(event, data) {
  this.socket.sendMessage({ event: event, data: data });
};


console.log("createing sue chefs");
config.servers.forEach(function(server) {
  sueChefs.push(new SueChef(server));
});



