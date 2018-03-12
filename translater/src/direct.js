const langs = require('google-translate-api/languages');

const common = require('./common');

const { translator, botPost, nameList } = common;

let askedLangFrom = false;
let askedLangTo = false;
let setTranslator = true;
const firstHelp = true;
let setLangStreamAskedFlag = false;
const streamCheckedTargetAsked = false;
let streamCheckedTargetAsked2 = false;

async function direct(
  userId,
  teamId,
  to,
  comment,
  streamId,
  threadId,
  text,
  userCollection,
  stream,
) {
  // mongodb, создание объекта с настройками по умолчанию.
  const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault.length === 0) {
    await userCollection.insert({
      user: userId,
      from: 'auto',
      to: 'en',
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

  // Мануал
  if (text.match(/t h/i)) {
    setTranslator = false;
    const answer = `t h (translator help) - show this manual.
    \nt s s (translator source set) - set source language of bot translator.
    \nt t s (translator target set) - set target language of bot translator.
    \nt c s (translator current settings) - show current language settings.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    setTranslator = true;
    return;
  }

  // Какие настройки сейчас?
  if (text.match(/t c s/i)) {
    setTranslator = false;
    const userSetting = await userCollection.find({ user: userId }).toArray();
    const rawLangs = Object.entries(langs);
    const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const [, toSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].to);
    const [, fromSetHuman] = langKeysValues.find(element => element && element[0] === userSetting[0].from);
    const answer = `Current bot translator settings. \nSource language is ${fromSetHuman},\ntarget language is ${toSetHuman}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    setTranslator = true;
    return;
  }

  // translate bot settings. С какого языка?
  if (text.match(/t s l/i)) {
    setTranslator = false;
    const rawLangs = Object.entries(langs);
    const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    askedLangFrom = true;
    return;
  }
  // Проверка введенного языка
  if (askedLangFrom) {
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
      setTranslator = true;
      askedLangFrom = false;
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }

  // translate bot settings. На какой язык?
  if (text.match(/t t l/i)) {
    setTranslator = false;
    const rawLangs = Object.entries(langs);
    const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
    const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    askedLangTo = true;
    return;
  }
  // Проверка введенного языка
  if (askedLangTo) {
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
      setTranslator = true;
      askedLangTo = false;
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }

  // переводчик
  if (setTranslator) {
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

  // if (text.match(/t s s/i)) {
  //   setTranslator = false;
  //   const streamsNameAndId = await nameList(teamId, stream, userId);
  //   // console.log('streamsNameAndId >>> ', streamsNameAndId)
  //   const answer = `In which stream do you want to translate e-mail messages? Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
  //   await botPost(teamId, to, comment, streamId, threadId, answer);
  //
  //   setLangStreamAskedFlag = true;
  //   return;
  // }
  // Удаление стрима. Ответ
  if (setLangStreamAskedFlag) {
    // console.log("inside");
    const streamsNameAndId = await nameList(teamId, stream, userId);
    const check = streamsNameAndId.find(element => element && element.title === text);
    console.log('check \t', check);
    if (check) {
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      // console.log("Text of deleting stream is correct!")
      // console.log("streamNameToDelete > ", text)
      const userSettings = await userCollection
        .find({
          user: userId,
          streams: { $elemMatch: { idStream: check.id } },
        })
        .toArray();
      console.log('userSettings:\n', userSettings);
      if (userSettings.length === 0) {
        await userCollection.update(
          { user: userId },
          {
            $push: {
              streams: {
                idStream: check.id,
                nameStream: check.title,
                from: 'auto',
                to: 'en',
                flag: false,
              },
            },
          },
          true,
        );
        const response = await userCollection.find({ user: userId }).toArray();
        console.log('response:\n', response);
        const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        streamCheckedTargetAsked2 = true;
        return;
      }
      streamCheckedTargetAsked2 = true;
      return;
    }
    // console.log("noDay for read")
    const answer = `There are no stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }
  // if (streamCheckedTargetAsked2) {
  //
  // }
}

module.exports = direct;
