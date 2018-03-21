// const langs = require('google-translate-api/languages');
const common = require('./common');

const { botPost } = common;

async function add(userId, teamId, to, comment, streamId, threadId, botId) {
  // Первая помощь.
  // const userSetting = await userCollection.find({ user: userId }).toArray();
  // const rawLangs = Object.entries(langs);
  // const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
  // const [, toSetHuman] = langKeysValues
  //   .find(element => element && element[0] === userSetting[0].to);
  // const [, fromSetHuman] = langKeysValues
  //   .find(element => element && element[0] === userSetting[0].from);
  if (botId) {
    // const answer = 'Привет, еще раз! Вы добавили меня в <этот> стрим. Теперь я буду переводить все входящие почтовые сообщения автоматически. Сейчас я перевожу с любого языка на английский. Но вы можете настроить меня. Напишите мне <set target>, чтобы определить язык, на который мне переводить. Напишите мне <set source>, чтобы определить язык с которого переводить. \nУ меня есть и другие команды, подробнее о них вы узнаете, если напишите <help>';
    const answer =
      'Hello again! You added me to <this> stream. Now I will translate all incoming mail automatically from any language to English by default. But you can set me up. Write me <set target> to determine the language I am translating to. Write me <set source> to determine the language from which to translate. \nI have other commands, you will learn more about them if you write <help me translator> ';
    await botPost(teamId, to, comment, streamId, threadId, answer);
    // Short keys to set bot up.
    // t h - (translator help) show this manual.
    // t s l - (translator source language) set source language of bot translator.
    // t t l - (translator target lenguage) set target language of bot translator.
    // t c s - (translator current settings) show current language settings.
    // And current bot translator settings are
    //   source language is <${fromSetHuman}>,
    //   target language is <${toSetHuman}>.
    // \nAnd translation of your input:
    // \n`;
  }
}
module.exports = add;
