const botClient = require('bot-client');

// Функций бота
const app = require('./src/index');

const {
  creds,
  threadFunction,
  censor,
  streamFunction,
} = app;

const {
  comment, stream, thread, contact, status,
} = botClient.connect(creds);

// основное тело программы
comment.onDirect(async (message) => {
  // когда кто-то напишет вам личное сообщение
  // будет работать этот коллбек
  // console.log('ON_DIRECT:\n', message)
  const { teamId } = message;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  // Функции работы с стримами
  await streamFunction(teamId, to, text, stream, comment, contact);
  // Функции для работы с тредами
  await threadFunction(text, teamId, to, stream, thread, comment, status);
  // Цензор по стоп словам. В каком стриме проверить комментарии на стоп слова?
  await censor(text, teamId, to, comment, stream);
});
