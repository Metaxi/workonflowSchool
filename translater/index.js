const botClient = require('bot-client');
const { MongoClient } = require('mongodb');

// Функции бота
const app = require('./src/index');

const {
  creds, direct, mention, created,
} = app;
const { comment, mail, stream } = botClient.connect(creds);

// основное тело программы
comment.onDirect(async (message) => {
  const { streamId } = message.data.content;
  const { threadId } = message.data.content;
  const { userId } = message.data;
  const { teamId } = message;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  // Connection mongo URL
  const url = 'mongodb://localhost:27017';
  // Use connect method to connect to the server
  const mongoConnect = await MongoClient.connect(url);
  const db = mongoConnect.db('translator');
  const userCollection = db.collection('userCollection');

  // Функция, которая работает в чате с ботом. Выводит помощь, настройки языка, устанавливает языки, переводит.
  direct(userId, teamId, to, comment, streamId, threadId, text, userCollection, stream);
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
  const url = 'mongodb://localhost:27017';
  // Use connect method to connect to the server
  const mongoConnect = await MongoClient.connect(url);
  const db = mongoConnect.db('translator');
  const userCollection = db.collection('userCollection');
  // Функция, которая переводит при упоминании бота, а также устанавливает языки.
  mention(userId, teamId, to, comment, streamId, threadId, mail, text, userCollection, stream);
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
  const url = 'mongodb://localhost:27017';
  // Use connect method to connect to the server
  const mongoConnect = await MongoClient.connect(url);
  const db = mongoConnect.db('translator');
  const userCollection = db.collection('userCollection');

  created(userId, teamId, to, comment, streamId, threadId, text, userCollection, type);
});
