const fs = require('fs');

const requests = [
  'GET /api/users',
  'POST /api/payments',
  'GET /api/products'
];

let csvLines = [];
csvLines.push("timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect");

let baseTime = new Date('2026-04-06T12:00:00Z').getTime();

for (let i = 0; i < 120; i++) {
  let timeStamp = baseTime + (i * 5000); // 5 sec gap for 120 lines = 600s = 10 mins
  let label = requests[i % requests.length];
  
  let elapsed = 100 + Math.floor(Math.random() * 50);
  if (label.includes('payments') && i % 4 === 0) {
    elapsed += 200;
  }
  
  let success = true;
  let responseCode = "200";
  
  if (Math.random() < 0.05) {
    success = false;
    responseCode = "500";
  }

  csvLines.push(`${timeStamp},${elapsed},${label},${responseCode},OK,Thread Group 1-1,text,${success},,500,200,10,10,,120,0,10`);
}

fs.writeFileSync('backend/src/test/resources/samples/jmx/version_1_3.csv', csvLines.join('\n'));
console.log('Created version_1_3.csv');
