// const langs = require('google-translate-api/languages');
const common = require('./common');

const { botPost } = common;

async function hire(
  userId,
  teamId,
  to,
  comment,
  streamId,
  threadId,
  userCollection,
  botCollection,
) {
  // mongodb, create default lang object settings.
  const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault.length === 0) {
    await userCollection.insert({
      user: userId,
      from: 'auto',
      to: 'en',
      streams: [],
    });
  }
  // mongodb. create default state object settings.
  let botSetting = await botCollection.find({ user: userId }).toArray();
  console.log('botSettingH:\n', botSetting);
  if (botSetting.length === 0) {
    await botCollection.insert({
      user: userId,
      general: false,
      translate: false,
      help: false,
      current: false,
      source: false,
      target: false,
      addStreamAsked: false,
      addUserAsked: false,
      streams: [],
    });
  }
  botSetting = await botCollection.find({ user: userId }).toArray();
  console.log('botSettingH2:\n', botSetting);
  // const userSetting = await userCollection.find({ user: userId }).toArray();
  // const rawLangs = Object.entries(langs);
  // const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
  // const [, toSetHuman] = langKeysValues
  //   .find(element => element && element[0] === userSetting[0].to);
  // const [, fromSetHuman] = langKeysValues
  //   .find(element => element && element[0] === userSetting[0].from);
  // Первая помощь.
  const answer =
    'Я бот переводчик и я помогаю тебе переводить электронные письма и сообщения от иностранных клиентов или коллег, тексты и отдельные слова.\nЧтобы начать работу добавь меня в стрим (add bot), где нужно переводить входящие почтовые сообщения и мы продолжим общение в чате этого стрима.\nЕсли ты хочешь перевести текст или фразу просто напиши мне сюда, и я переведу на английский язык. Да, английский язык у меня настроен по умолчанию. Если ты захочешь изменить язык, на который переводить, то напиши сюда <set target>, а если нужно задать язык, с какого переводить, то <set source>.\nУ меня есть и другие опции, я расскажу тебе о них, если ты мне напишешь <help>.';

  await botPost(teamId, to, comment, streamId, threadId, answer);

  botSetting = await botCollection.find({ user: userId }).toArray();
  await botCollection.update({ user: userId }, { $set: { translate: true } });
  console.log('botSettingH3:\n', botSetting);

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
module.exports = hire;
