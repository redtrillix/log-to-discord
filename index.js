const logfile = process.env.LOGFILE || process.argv[2];
if (!logfile) {
  console.error("No Log File Path Provided");
  process.exit(1);
}
const webhookurl = process.env.WEBHOOKURL || process.argv[3];
if (!webhookurl) {
  console.error("No WEBHOOK URL Provided");
  process.exit(1);
}
console.log("LOGFILE:", logfile);
console.log("WEBHOOK:", webhookurl);
const axios = require('axios');
const Tail = require('tail').Tail;
const Promise = require('es6-promise').Promise;
let logp = new Tail(logfile, { follow: true });

const rateLimitDelay = 1000; //adjusts the send rate to Discord
let rateLimitActive = false;

postToDiscord = async function (message) {
  const postMessage = async (content) => {
    await axios.post(webhookurl, {
      content: '```\n' + content.substring(0, 1993) + '\n```'
    });
    await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
  };

  let remainingMessage = message;
  while (remainingMessage.length > 0) {
    const content = remainingMessage.substring(0, 1993);
    await postMessage(content);
    remainingMessage = remainingMessage.substring(1993);
  }
};


logp.on('exit', (code, signal) => {
  console.log('LOGS EXIT');
});

function handle(message) {
  postToDiscord(message)
    .then(() => console.log("Sent message:", message))
    .catch((e) => console.error("Error occurred:", e))
    .finally(() => {
      rateLimitActive = false;
    });
}

logp.on('line', (line) => {
  if (!rateLimitActive) {
    rateLimitActive = true;
    handle(line);
  }
});

logp.on("error", (error) => {
  if (!rateLimitActive) {
    rateLimitActive = true;
    handle(`Error occurred: ${error}`);
  }
});
