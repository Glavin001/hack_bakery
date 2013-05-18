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

var feed = function(data) {
  // add job to front of job queue
  if (!jobQueue[data.name]) {
    jobQueue[data.name] = [];
  }
  jobQueue[data.name] = [data.data].concat(jobQueue[data.name]);
  
  // notify each SousChef a job has arrived
  sousChefs.forEach(function(sousChef) {
    if (sousChef.jobs instanceof Array) {
      sousChef.jobs.forEach(function(job) {
        if (job === data.name) {
          console.log('feeding job [' + data.name + '] to [' + sousChef.name + ']');
          sousChef.emit("submitJob", {
            name: data.name
          });
        }
      });
    } else if (sousChef.jobs === "any") {
        console.log('feeding job [' + data.name + '] to [' + sousChef.name + ']');
        sousChef.emit("submitJob", {
          name: data.name
        });
    }
  });
};

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
    
    console.log('--- connected to client.');
    
    // ship all jobs to workers   
    if (me.jobs instanceof Array) {
      me.jobs.forEach(function(job) {
        me.emit("createJob", { 
          name: job,
          script: jobs[job].script
        });
      });
    } else if (me.jobs === "any") {
      for (var job in jobs) { 
        me.emit("createJob", {
          name: job,
          script: jobs[job].script
        });
      }
    }
    
  });
  
  this.socket.on('error', function(error) {
  });
  
  console.log("-- created sue chef");
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
  
  if (data.status === 0) { // good
    if (data.data) {
      jobs[data.name].feeds.forEach(function(job) {
        feed({
          name: job,
          data: data.data
        });
      });
      
      if (jobs[data.name].feeds.length === 0 &&
          currentManagerSocket !== null) {
        currentManagerSocket.sendMessage({
          event: "jobComplete",
          data: data
        });
        currentManagerSocket = null;
      }
    }  
  } else { // bad
    feed(processingQueue[data.name][data.id]);
  }
  
  // remove the job from the processing queue
  delete processingQueue[data.name][data.id];
};

SousChef.prototype.emit = function(event, data) {
  if (!this.socket.isClosed()) {
    this.socket.sendMessage({ event: event, data: data }, function(error) {
      if (error) {
        console.log('We burnt something : ' + error);
      }
    });
  }
};

var createJob = function(data) {

  jobs[data.name] = data;
  data.feeds = data.feeds || [];
  
  // ship all jobs to workers
  sousChefs.forEach(function(sousChef) {   
    sousChef.emit("createJob", { 
      name: data.name,
      script: data.script
    });
  });
}; 

console.log("createing sue chefs");
var sousChefs = [];
config.servers.forEach(function(server) {
  sousChefs.push(new SousChef(server));
});

var 
  server = net.createServer(),
  currentManagerSocket = null;
server.listen(7777);
server.on('connection', function(socket) { 
    
    socket = new JsonSocket(socket); 
    currentManagerSocket = socket;
    
    socket.on('message', function(message) {
        switch (message.event)
        {
          case "feed" :
            feed(message.data);
            break;
          case "createJob" :
            createJob(message.data); 
            break; 
          case "listJobs" :
            var jobList = [];
            for(var job in jobs) {
              jobList.push(job);
            }
            console.dir(jobList);
            socket.sendMessage({
              event: "listJobs",
              data: jobList
            }); 
            break;
          default :
            console.log('failure');
            console.log(JSON.stringify(message, null, 2));
            break;
        }
    });
});
