// const botClient = require('bot-client');
const botClient = require('workonflow-bot-client');
const { MongoClient } = require('mongodb');

// Функции бота
const app = require('./src/index');

// const creds = {
//   email: process.env.BOT_LOGIN,
//   password: process.env.BOT_PASSWORD,
// };

const {
  creds, direct, mention, created, hire, add,
} = app;

(async () => {
  const {
    comment, mail, stream, team, contact,
  } = await botClient.connect(creds);
  // первое сообщение при покупке бота.
  team.onUserInvited(async (message) => {
    // console.log(message);
    // const { streamId } = '';
    // const { threadId } = '';
    const { userId } = message.headers;
    const { teamId } = message;
    const to = userId;
    // Connection mongo URL
    const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
    // Use connect method to connect to the server
    const mongoConnect = await MongoClient.connect(url);
    const db = mongoConnect.db('translator');
    const userCollection = db.collection('userCollection');
    const botCollection = db.collection('botCollection');

    hire(userId, teamId, to, comment, '', '', userCollection, botCollection);
  });
  // Сообщение при добавлении бота в стрим.
  stream.onUserSet(async (message) => {
    // const { streamId } = message.data.content;
    // console.log('message:\n', message);
    const { userId } = message.data;
    const { threadId } = message.data;
    const { teamId } = message;
    const { streamId } = message.data;
    const botId = message.data.metadata.user;
    const to = message.data.from;
    // console.log('message.data.metadata\n', message.data.metadata);
    // console.log('botId', botId);
    // console.log('1');
    add(userId, teamId, to, comment, streamId, threadId, botId);
    // console.log('2');
  });

  // основное тело программы
  comment.onDirect(async (message) => {
    const { streamId } = message.data.content;
    const { threadId } = message.data.content;
    const { userId } = message.data;
    const { teamId } = message;
    const to = message.data.content.from;
    const { data: { text } } = message.data.content.att[0];

    // Connection mongo URL
    const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
    // Use connect method to connect to the server
    const mongoConnect = await MongoClient.connect(url);
    const db = mongoConnect.db('translator');
    const userCollection = db.collection('userCollection');
    const botCollection = db.collection('botCollection');

    // Функция, которая работает в чате с ботом.
    // Выводит помощь, настройки языка, устанавливает языки, переводит.
    direct(
      userId,
      teamId,
      to,
      comment,
      streamId,
      threadId,
      text,
      userCollection,
      botCollection,
      stream,
      contact,
    );
  });

  comment.onMention(async (message) => {
    const { teamId } = message;
    // console.log('mes:\n', message);
    const { streamId } = message.data.content;
    const { threadId } = message.data.content;
    const { userId } = message.data;
    const to = message.data.content.from;
    const { data: { text } } = message.data.content.att[0];

    // Mongo connect
    const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
    // Use connect method to connect to the server
    const mongoConnect = await MongoClient.connect(url);
    const db = mongoConnect.db('translator');
    const userCollection = db.collection('userCollection');
    const botCollection = db.collection('botCollection');
    // Функция, которая переводит при упоминании бота, а также устанавливает языки.
    mention(
      userId,
      teamId,
      to,
      comment,
      streamId,
      threadId,
      mail,
      text,
      userCollection,
      botCollection,
      stream,
    );
  });

  comment.onCreated(async (message) => {
    const { teamId } = message;
    const { streamId } = message.data.content;
    const { threadId } = message.data.content;
    const { userId } = message.data;
    const to = message.data.content.from;
    const { data: { text } } = message.data.content.att[0];
    const { type } = message.data.content.att[0];

    // Mongo connect
    const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
    // Use connect method to connect to the server
    const mongoConnect = await MongoClient.connect(url);
    const db = mongoConnect.db('translator');
    const userCollection = db.collection('userCollection');

    created(userId, teamId, to, comment, streamId, threadId, text, userCollection, type);
  });
})();
