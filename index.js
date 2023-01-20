require('dotenv').config();
const {
  Client,
  Events,
  GatewayIntentBits,
  ActivityType,
} = require('discord.js');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

const commands = ['!stats', '!weather', '!chuckjoke', '!roll', '!commands'];

mongoose.set('strictQuery', true);

const token = process.env.TOKEN;
const secretWord = process.env.SECRET;

const chuckURL = 'https://api.chucknorris.io/jokes/random';
const weatherURL =
  'https://api.open-meteo.com/v1/forecast?latitude=61.50&longitude=23.79&daily=temperature_2m_max&current_weather=true&timezone=auto';
const turkuURL =
  'https://api.open-meteo.com/v1/forecast?latitude=60.45&longitude=22.27&daily=temperature_2m_max&current_weather=true&timezone=auto';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const getChuckJoke = async () => {
  try {
    const { data } = await axios.get(chuckURL);
    console.log(data.value);
    return data.value;
  } catch (error) {
    console.log(error);
  }
};

const getWeather = async (userID) => {
  try {
    if (userID == process.env.USER_ID2) {
      const { data } = await axios.get(turkuURL);
      return data.current_weather.temperature;
    } else {
      const { data } = await axios.get(weatherURL);
      return data.current_weather.temperature;
    }
  } catch (error) {
    console.log(error);
  }
};

client.once(Events.ClientReady, (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  mongoose.connect(process.env.MONGOURL, (error) => {
    if (error) console.log(error);
    console.log('Connected to the database!');
  });
  client.user.setPresence({
    activities: [{ name: 'dice roll', type: ActivityType.Watching }],
    status: 'online',
  });
});

const getNeededExp = (level) => level * level * 10;

const addExpToUser = async (userID, guildID, username, msg) => {
  try {
    const result = await User.findOneAndUpdate(
      { userID, guildID },
      {
        $set: { guildID, userID, username: msg.author.username },
        $inc: { exp: 1 },
      },
      { upsert: true, new: true }
    );
    console.log('Data has been saved to the DB!');
    console.log('RESULT:', result);
    let { exp, level } = result;
    const needed = getNeededExp(level);

    if (exp >= needed) {
      ++level;
      exp -= needed;

      msg.reply(
        `Onneksi olkoon! Olet nyt level ${level}! Seuraavaan leveliin tarvitset ${getNeededExp(
          level
        )} viestiä! Keep up the good work 👍`
      );

      await User.updateOne({ guildID, userID, username }, { exp, level });
    }
  } catch (error) {
    console.log('Something went wrong:', error);
  }
};

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const [command, ...args] = msg.content.split(' ');

  addExpToUser(msg.author.id, msg.guildId, msg.author.username, msg);

  if (msg.content === secretWord && msg.author.id === process.env.USER_ID) {
    msg.reply('Marko on kotona!');
  }

  if (command === '!chuckjoke') {
    const joke = await getChuckJoke();
    msg.channel.send(
      `${msg.author} - Tässä sinun Chuck Norris vitsisi: *${joke}*`
    );
  }

  if (command === '!commands') {
    msg.channel.send(`Saatavilla olevat komennot: **${commands.join(', ')}**`);
  }

  if (command === '!stats') {
    const userToBeChecked = args[0];
    try {
      const userFound = await User.findOne({ username: userToBeChecked });
      const { exp, level } = userFound;
      msg.reply(
        `Käyttäjän ${
          args[0]
        } tämän hetkinen level on ${level} ja käyttäjän tarvitsee lähettää ${
          getNeededExp(level) - exp
        } viestiä seuraavaan level uppiin`
      );
    } catch (error) {
      msg.reply(
        `Antamaasi käyttäjää: ***${args[0]}*** - ei löydy tai kyseinen käyttäjä ei ole meidän mahtavassa tietokannassamme (vielä)!`
      );
      console.log('Virhe käyttäjän tietoja hakiessa', error);
    }
  }

  if (command === '!weather') {
    const weather = await getWeather(msg.author.id);
    const user = msg.author.id;
    let city = 'Tampereelta';
    if (user == process.env.USER_ID2) {
      city = 'Turussa';
    }
    msg.channel.send(`Tässä päivän sää ${city}: ${weather}°C`);
  }

  if (command === '!roll') {
    switch (args[0]) {
      case 'd6':
        const randomd6 = Math.floor(Math.random() * 6) + 1;
        msg.reply(`Heitit numeron ${randomd6}`);
        return;
      case 'd4':
        const randomd4 = Math.floor(Math.random() * 4) + 1;
        msg.reply(`Heitit numeron ${randomd4}`);
        return;
      case 'd8':
        const randomd8 = Math.floor(Math.random() * 8) + 1;
        msg.reply(`Heitit numeron ${randomd8}`);
        return;
      case 'd10':
        const randomd10 = Math.floor(Math.random() * 10) + 1;
        msg.reply(`Heitit numeron ${randomd10}`);
        return;
      case 'd12':
        const randomd12 = Math.floor(Math.random() * 12) + 1;
        msg.reply(`Heitit numeron ${randomd12}`);
        return;
      case 'd20':
        const randomd20 = Math.floor(Math.random() * 20) + 1;
        msg.reply(`Heitit numeron ${randomd20}`);
        return;
      case 'help':
        msg.reply(`Heitä haluamallasi nopalla: esim: "!roll d20"`);
        return;
      default:
        msg.reply(`"!roll help" for help`);
        return;
    }
  }
});

client.login(token);
