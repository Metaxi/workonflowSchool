const langs = require('google-translate-api/languages');

const common = require('./common');

const { translator, botPost, nameList } = common;

// const firstHelp = true;
// let setLangStreamAskedFlag = false;
// const streamCheckedTargetAsked = false;
// let streamCheckedTargetAsked2 = false;

async function direct(
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
) {
  // mongodb, создание объекта с настройками языка для пользователя по умолчанию.
  const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault.length === 0) {
    await userCollection.insert({
      user: userId,
      from: 'auto',
      to: 'en',
      streams: [],
    });
  }
  // mongodb. Создание объекта с картой состояний бота для пользователя по умолчанию.
  let botSetting = await botCollection.find({ user: userId }).toArray();
  console.log('botSetting:\n', botSetting);
  if (botSetting.length === 0) {
    await botCollection.insert({
      user: userId,
      general: false,
      translate: true,
      help: false,
      current: false,
      source: false,
      target: false,
      streams: [],
    });
  }

  // Первая помощь.
  // if (firstHelp) {
  //   const userSetting = await userCollection.find({ user: userId }).toArray();
  //   const rawLangs = Object.entries(langs);
  //   const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
  //   const [, toSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].to);
  //   const [, fromSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].from);
  //   const answer = `Short keys to set bot up.
  //   t h - (translator help) show this manual.
  //   t s l - (translator source language) set source language of bot translator.
  //   t t l - (translator target lenguage) set target language of bot translator.
  //   t c s - (translator current settings) show current language settings.
  //   And current bot translator settings are
  //     source language is <${fromSetHuman}>,
  //     target language is <${toSetHuman}>.
  //   \nAnd translation of your input:
  //   \n`;
  //   await botPost(teamId, to, comment, streamId, threadId, answer);
  //   firstHelp = false;
  // }
  if (text.match(/t h/i)) {
    if (!botSetting[0].general && !botSetting[0].help) {
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: true, help: true, translate: false } },
      );
      // Мануал
      const answer = 't h (translator help) - show this manual.\nt s l (translator source set) - set source language of bot translator.\nt t l (translator target set) - set target language of bot translator.\nt c s (translator current settings) - show current language settings.';
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // Монго, снятие флага.
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: false, help: false, translate: true } },
      );
      return;
    }
  }

  // Какие настройки сейчас?
  if (text.match(/t c s/i)) {
    if (!botSetting[0].general && !botSetting[0].current) {
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: true, current: true, translate: false } },
      );
      // Какие настройки сейчас?
      const userSetting = await userCollection.find({ user: userId }).toArray();
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      const [, toSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].to);
      const [, fromSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].from);
      const answer = `Current bot translator settings. \nSource language is ${fromSetHuman},\ntarget language is ${toSetHuman}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb, снятие флага.
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: false, current: false, translate: true } },
      );
      return;
    }
  }

  // translate bot settings. С какого языка?
  if (text.match(/t s l/i)) {
    // Mongo. Установка флага состояния.
    // mongodb, set flag.
    if (!botSetting[0].general) {
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: true, translate: false } },
      );
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo set flag
      botSetting = await botCollection.update({ user: userId }, { $set: { source: true } });
      return;
    }
  }
  // Проверка введенного языка. Установка языка источника.
  if (botSetting[0].general && botSetting[0].source) {
    const rawLangs = Object.entries(langs);
    const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    // console.log('langKeysValues:\n', langKeysValues);
    const checkedFromLanguage = langKeysValues.find(element => element && element[1] === text);
    // console.log('checkedFromLanguage: ', checkedFromLanguage);
    if (checkedFromLanguage) {
      const [fromSet] = checkedFromLanguage;
      // console.log('fromSet: ', fromSet);
      // console.log('toSet: ', toSet);
      const answer = `Source language is changed to ${fromSet}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo создание документа.
      userCollection.updateOne({ user: userId }, { $set: { from: fromSet } });
      // mongodb, set flag.
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: false, source: false, translate: true } },
      );
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }

  // translate bot settings. На какой язык?
  if (text.match(/t t l/i)) {
    // mongodb, set flag.
    if (!botSetting[0].general) {
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: true, translate: false } },
      );
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb, set flag.
      botSetting = await botCollection.update({ user: userId }, { $set: { target: true } });
      return;
    }
  }
  // Проверка введенного языка. Установка целевого языка.
  if (botSetting[0].general && botSetting[0].target) {
    // console.log('langKeysValues:\n', langKeysValues);
    const rawLangs = Object.entries(langs);
    const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const checkedToLanguage = langKeysValues.find(element => element && element[1] === text);
    // console.log('checkedToLanguage: ', checkedToLanguage);
    if (checkedToLanguage) {
      const [toSet] = checkedToLanguage;
      // console.log('fromSet: ', fromSet);
      // console.log('toSet: ', toSet);
      const answer = `Target language is changed to ${toSet}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb
      userCollection.updateOne({ user: userId }, { $set: { to: toSet } });
      // mongodb, set flag.
      botSetting = await botCollection.update(
        { user: userId },
        { $set: { general: false, target: false, translate: true } },
      );
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }

  // переводчик
  if (botSetting[0].translate) {
    // Если в монго установлены языки для данного пользователя, то берем параметры оттуда.
    const userSettings = await userCollection.find({ user: userId }).toArray();
    // console.log('isObject[0]:\n', isObject[0]);
    const fromSet = userSettings[0].from;
    const toSet = userSettings[0].to;
    // console.log('fromSet', fromSet);
    // console.log('toSet', toSet);
    const answer = await translator(text, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }
}

module.exports = direct;
