const translate = require('google-translate-api');
const langs = require('google-translate-api/languages');
const botClient = require('bot-client');
// Функции бота
const app = require('./src/index');
const common = require('./src/common');

let answer;
let askedLangFrom = false;
let langKeysValues;
let fromSet = 'auto';
let toSet = 'en';
let askedLangTo = false;
let setTranslator = true;


const { translator, botPost } = common;
const { creds } = app;
const { comment, mail } = botClient.connect(creds);

// основное тело программы
comment.onDirect(async (message) => {
  // когда кто-то напишет вам личное сообщение
  // будет работать этот коллбек
  // console.log('ON_DIRECT:\n', message)
  const { streamId } = message.data.content;
  const { threadId } = message.data.content;
  const { teamId } = message;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  // translate bot settings. С какого языка?
  if (text.match(/t s s/i)) {
    setTranslator = false;
    const rawLangs = Object.entries(langs);
    langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    askedLangFrom = true;
    return;
  }
  // Проверка введенного языка
  if (askedLangFrom) {
    // console.log('langKeysValues:\n', langKeysValues);
    const checkedFromLanguage = langKeysValues.find(element => element && element[1] == text);
    // console.log('checkedFromLanguage: ', checkedFromLanguage);
    if (checkedFromLanguage) {
      fromSet = checkedFromLanguage[0];
      console.log('fromSet: ', fromSet);
      console.log('toSet: ', toSet);
      const answer = `Source language is changed to ${fromSet}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      setTranslator = true;
      askedLangFrom = false;
      return;
    } else {
      const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
  }

  // translate bot settings. На какой язык?
  if (text.match(/t t s/i)) {
    setTranslator = false;
    const rawLangs = Object.entries(langs);
    langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    askedLangTo = true;
    return;
  }
  // Проверка введенного языка
  if (askedLangTo) {
    // console.log('langKeysValues:\n', langKeysValues);
    const checkedToLanguage = langKeysValues.find(element => element && element[1] == text);
    // console.log('checkedFromLanguage: ', checkedFromLanguage);
    if (checkedToLanguage) {
      toSet = checkedToLanguage[0];
      console.log('fromSet: ', fromSet);
      console.log('toSet: ', toSet);
      const answer = `Target language is changed to ${fromSet}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      setTranslator = true;
      askedLangTo = false;
      return;
    } else {
      const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
  }

  if (setTranslator) {
    const answer = await translator(text, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }
});

comment.onMention(async (message) => {
  // когда кто-то обратится к вам в стриме или треде через @
  // будет работать этот коллбек

  // console.log('ON_MENTION:\n', message);
  const { teamId } = message;
  const { streamId } = message.data.content;
  const { threadId } = message.data.content;
  const to = message.data.content.from;
  let { data: { text } } = message.data.content.att[0];

  // console.log('text.split:\n', text.split('@'));

  // console.log('all comment:\n', );
  // Пустая ли строка
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  // console.log('isEmpty: ', isBlank(text.split('@')[2]));

  if (isBlank(text.split('@')[2])) {
    // console.log('[2] is empty');
    const emails = await mail.read(teamId, {});
    // console.log('emails.data:\n', emails.data);
    // console.log('threadId:\n', threadId);
    // console.log('emails.data[0].threadId:\n', emails.data[0].threadId);
    // console.log('at once:\n', emails.data.find((element) => element && element.threadId == threadId).text);
    // const emailOfThread = emails.data.find((element) => element && element.threadId == threadId);
    // console.log('emailOfThread:\n', emailOfThread);
    emailBody = emails.data.find(element => element && element.threadId == threadId).text;
    // console.log('emailBody:\n', emailBody);

    const answer = await translator(emailBody, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  } else {
    console.log('text1:\n', text);
    text = text.split('@')[2];
    console.log('text2:\n', text);
    // код отправить в ответ сообщение "привет"
    if (text) {
      const answer = await translator(text, fromSet, toSet);
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
  }
});

// MSG ON CREATED >  [ { type: 'mail', data: { text: 'как дела\n', html: false } } ]

comment.onCreated(async (message) => {
  const { teamId } = message;
  const { streamId } = message.data.content;
  const { threadId } = message.data.content;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  // console.log('we are here');
  // console.log('message > ', message);
  // let { type } = message.data.content.att[0];
  // console.log('message.data.content.att[0] is: ', message.data.content.att[0]);
  // console.log('message.data.content.att[0].type is: ', type);

  if (message.data.content.att[0].type === 'mail') {
    // console.log('type is mail');
    // console.log('text: ', text);
    // const emailBody = message.data.content.att[0].data.text;
    const answer = await translator(text, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }
});
