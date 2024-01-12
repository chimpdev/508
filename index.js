const dotenv = require('dotenv');
dotenv.config();

const Discord = require('discord.js');
// Create a new Discord client
const client = new Discord.Client({
  intents: [
    // Add the intents to client so bot can retrieve the members and guilds from gateway
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers
  ],
  fetchAllMembers: true
});

const logger = require('./utils/logger');

// Create a collection to store the positions of each member
const positions = new Discord.Collection();

client.on('ready', async () => {
  logger.send(`Bot logged in as ${client.user.tag}!`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID); 
  // Fetch all members in the guild and cache them so we can sort them by join date
  await guild.members.fetch();

  // Create a temp index to store the position of each member
  let positionIndex = 0;
  guild.members.cache
    // Sort the members by join date.
    .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
    .map(member => {
      // Increment the position index and set the position of the member
      positionIndex++;
      positions.set(member.user.id, positionIndex);
    });

  check509thMembers();
});

client.on('guildMemberAdd', member => {
  positions.set(member.user.id, positions.size + 1);
  check509thMembers();
});

client.on('guildMemberRemove', member => {
  positions.delete(member.user.id);
  check509thMembers();
});

/**
 * Checks if any members are the 509th member and kicks them if they are
 * @returns {void}
 */
function check509thMembers() {
  // Loop through each member
  positions.forEach((position, userId) => {
    // Check if the member is the 509th member or higher
    if (position > 509) {
      const guild = client.guilds.cache.get(process.env.GUILD_ID);
      const member = guild.members.cache.get(userId);

      // Kick the member
      member.kick()
        .then(() => logger.send(`Kicked ${member.user.tag} for being ${position}th member.`))
        .catch(error => logger.send(`Failed to kick ${member.user.tag} for being ${position}th member.\n${error.stack}`));
    }
  });
}

// Login to Discord
client.login(process.env.BOT_TOKEN);

// Create a HTTP server that listens Github webhook requests
require('./utils/server')();