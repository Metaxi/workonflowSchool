const langs = require('google-translate-api/languages');
const common = require('./common');

const { translator, botPost, nameList } = common;

let setTranslator = true;
let askedLangFrom = false;
let askedLangTo = false;

async function mention(
  userId,
  teamId,
  to,
  comment,
  streamId,
  threadId,
  mail,
  text,
  userCollection,
  stream,
) {
  // mongodb, создание объекта с настройками по умолчанию в общем
  const userSettingDefault0 = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault0.length === 0) {
    await userCollection.insert({ user: userId, from: 'auto', to: 'en' });
  }
  // mongodb в стриме
  const streamsNameAndId = await nameList(teamId, stream, userId);
  const check = streamsNameAndId.find(element => element && element.id === streamId);
  // console.log('check: \n', check);
  const userSettingDefault1 = await userCollection
    .find({
      user: userId,
      streams: { $elemMatch: { idStream: check.id } },
    })
    .toArray();
  if (userSettingDefault1.length === 0) {
    await userCollection.update(
      { user: userId },
      {
        $push: {
          streams: {
            idStream: check.id,
            nameStream: check.title,
            from: 'Auto',
            to: 'en',
            flag: false,
          },
        },
      },
      true,
    );
    const response = await userCollection.find({ user: userId }).toArray();
    console.log('response:\n', response);
    return;
  }

  // Пустая ли строка
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  if (isBlank(text.split('@')[2])) {
    // console.log('[2] is empty');
    // const emails = await mail.read(teamId, {});
    // const emailBody = emails.data.find(element => element && element.threadId === threadId).text;
    // // console.log('emailBody:\n', emailBody);
    // const userSettings = await userCollection.find({ user: userId }).toArray();
    // // console.log('userSettings[0]:\n', userSettings[0]);
    // const fromSet = userSettings[0].from;
    // const toSet = userSettings[0].to;
    // const answer = await translator(emailBody, fromSet, toSet);
    const answer = 'What do you mean?';
    await botPost(teamId, to, comment, streamId, threadId, answer);
  } else {
    // console.log('text1:\n', text);
    const [, , textBody] = text.split('@');
    const textBodyTrimmed = textBody.trim();
    // console.log('textBody1:\n', `<${textBody}>`);
    // код отправить в ответ сообщение "привет"
    if (textBody.match(/t s l/)) {
      setTranslator = false;
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      askedLangFrom = true;
      return;
    }
    if (askedLangFrom) {
      const rawLangs = Object.entries(langs);
      const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
      // console.log('langKeysValues:\n', langKeysValues);
      // console.log('textBody2:\n', `<${textBody.trim()}>`);
      const checkedFromLanguage = langKeysValues.find(element => element && element[1] === textBodyTrimmed);
      // console.log('checkedFromLanguage: ', checkedFromLanguage);
      if (checkedFromLanguage) {
        const [fromSet] = checkedFromLanguage;
        // console.log('fromSet: ', fromSet);
        // console.log('toSet: ', toSet);
        const answer = `Source language is changed to ${fromSet}`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo создание документа.
        await userCollection.update(
          { user: userId, 'streams.idStream': check.id },
          { $set: { 'streams.$.from': fromSet, 'streams.$.flag': true } },
        );
        // const response = await userCollection.find({ user: userId }).toArray();
        // console.log('response:\n', response);
        askedLangFrom = false;
        setTranslator = true;
        return;
      }
      const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      return;
    }
    // translate bot settings. На какой язык?
    if (textBody.match(/t t l/i)) {
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
      const checkedToLanguage = langKeysValues
        .find(element => element && element[1] === textBodyTrimmed);
      // console.log('checkedToLanguage: ', checkedToLanguage);
      if (checkedToLanguage) {
        const [toSet] = checkedToLanguage;
        // console.log('fromSet: ', fromSet);
        // console.log('toSet: ', toSet);
        const answer = `Target language is changed to ${toSet}`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo создание документа.
        await userCollection.update(
          { user: userId, 'streams.idStream': check.id },
          { $set: { 'streams.$.to': toSet, 'streams.$.flag': true } },
        );
        setTranslator = true;
        askedLangTo = false;
        return;
      }
      const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
    // переводчик
    if (setTranslator) {
      const userSettings = await userCollection.find({ user: userId }).toArray();
      // console.log('userSettings[0].streams[0].from:\n', userSettings[0].streams[0].from);
      const streamSettings = await userSettings[0]
        .streams.find(element => element && element.idStream === check.id);
      // console.log('streamSettings:\n', streamSettings);
      const fromSet = streamSettings.from;
      const toSet = streamSettings.to;
      const answer = await translator(textBody, fromSet, toSet);
      await botPost(teamId, to, comment, streamId, threadId, answer);
      return;
    }
  }
}
module.exports = mention;
