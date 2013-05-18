
var 
  net = require('net'),
  JsonSocket = require('json-socket');

exports.SueChef = function(_server) {
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
    
    console.log('Connected to client.');
  
    me.jobs.forEach(function(job) {
      me.emit("createJob", { 
        name: job,
        script: jobs[job].script
      });
    });
  });
  
  console.log("--created sue chef");
}

exports.SueChef.prototype.requestJobData = function(data) {
  
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

exports.SueChef.prototype.jobComplete = function(data) {
  console.log(JSON.stringify(data, null, 2));
};

exports.SueChef.prototype.emit = function(event, data) {
  this.socket.sendMessage({ event: event, data: data });
};

