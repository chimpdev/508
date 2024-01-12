const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('node:crypto');
const { exec } = require('node:child_process');
const logger = require('./logger');

module.exports = () => {
  const server = express();

  // Parse the request body as JSON
  server.use(bodyParser.json());

  server.post('/pull', (request, response) => { 
    // Check if the request is from GitHub
    const signature = request.headers['x-hub-signature-256'];
    if (!signature) return response.status(403).send('Invalid signature');
    
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(request.body));

    const digest = Buffer.from('sha256=' + hmac.digest('hex'), 'utf8');
    const hash = Buffer.from(signature, 'utf8');
    try {
      if (hash.length !== digest.length || !crypto.timingSafeEqual(digest, hash)) return response.status(403).send('Invalid signature');
    } catch (error) {
      return response.status(500).json({ success: false });
    }
    
    // Pull from GitHub
    logger.send('New commit received. Pulling from GitHub..');

    // Execute the pull command
    return exec('git pull', (error, stdout) => {
      if (error) {
        logger.send(`Failed to pull from GitHub.\n${error.stack}`);
        return response.status(500).json({ success: false });
      }

      // Send the output of the pull command to Discord
      logger.send(stdout);
      logger.send('Pull successful. Restarting..');
      response.json({ success: true });

      // Restart the process
      return process.exit(0);
    });
  });
};