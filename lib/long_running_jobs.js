const cuid = require('cuid');
const cache = {};
let lastStartedJob;

exports.addJob = () => {
  const id = cuid();
  lastStartedJob = id;
  cache[id] = {id, status: 'initialized'};
  return id;
}

exports.updateJob = (id, status) => {
  if (!cache[id]) throw new Error("no such job");
  cache[id].status = status;
}

exports.getLastRunJob = () => lastStartedJob;

exports.getJobStatus = id => cache[id] && cache[id].status;

exports.finishJob = (id) => {
  delete cache[id];
}
