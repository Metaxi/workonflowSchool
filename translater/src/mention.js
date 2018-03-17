const langs = require('google-translate-api/languages');
const common = require('./common');

const { translator, botPost, nameList } = common;

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
  botCollection,
  stream,
) {
  // Get list of langs
  const rawLangs = Object.entries(langs);
  const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);
  // mongodb, create default lang object for general settings
  const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault.length === 0) {
    await userCollection.insert({
      user: userId,
      from: 'auto',
      to: 'en',
      streams: [],
    });
  }
  const streamsNameAndId = await nameList(teamId, stream, userId);
  // current stream is your as admin stream
  const check = streamsNameAndId.find(element => element && element.id === streamId);
  // console.log('check: \n', check);
  const userStreamSettingDefault = await userCollection
    .find({
      user: userId,
      streams: { $elemMatch: { idStream: check.id } },
    })
    .toArray();
    // mongodb. create default lang object for stream settings. Не работают, так как флаг = 0
  if (userStreamSettingDefault.length === 0) {
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
    return;
  }
  // mongodb. create default state object for general settings for the stream.
  const botGeneralSetting = await botCollection.find({ user: userId }).toArray();
  // console.log('botStreamSetting:\n', botStreamSetting);
  if (botGeneralSetting.length === 0) {
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
  let botStreamSetting = await botCollection
    .find({
      user: userId,
      streams: { $elemMatch: { idStream: check.id } },
    })
    .toArray();
  // mongodb. create default state object settings for the stream.
  if (botStreamSetting.length === 0) {
    await botCollection.update(
      { user: userId },
      {
        $push: {
          streams: {
            idStream: check.id,
            nameStream: check.title,
            general: false,
            translate: true,
            source: false,
            target: false,
          },
        },
      },
      true,
    );
    return;
  }

  // Пустая ли строка
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  if (isBlank(text.split('@')[2])) {
    console.log('[2] is empty');
    console.log('threadId:\n', threadId);
    const emails = await mail.read(teamId, {});
    // console.log('emails\n', emails);
    const emailBody = emails.data.find(element => element && element.threadId === threadId).text;
    console.log('emailBody:\n', emailBody);
    if (threadId && emailBody) {
      // берем настройки из mongodb
      const userSettings = await userCollection
        .find({}, { user: userId, streams: { $elemMatch: { idStream: check.id } } })
        .toArray();
      // console.log('userSettings[0].streams[0]\n', userSettings[0].streams[0]);
      const fromSet = userSettings[0].streams[0].from;
      const toSet = userSettings[0].streams[0].to;
      const answer = await translator(emailBody, fromSet, toSet);
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
    const answer = 'There are no emails with text in the chat. Please, mention me in the thread where text in email is.';
    await botPost(teamId, to, comment, streamId, threadId, answer);
  } else {
    // если при упоминании бота строка сообщение не пустое, то либо настройки, либо перевод.
    // console.log('text1:\n', text);
    const [, , textBody] = text.split('@');
    const textBodyTrimmed = textBody.trim();
    // console.log('textBody1:\n', `<${textBody}>`);
    // Какие настройки сейчас?
    if (textBodyTrimmed.match(/t c s/i)) {
      if (!botStreamSetting[0].general && !botStreamSetting[0].current) {
        botStreamSetting = await botCollection.update(
          { user: userId },
          { $set: { general: true, help: true, translate: false } },
        );
        // берем настройки из mongodb
        const userSettings = await userCollection
          .find({}, { user: userId, streams: { $elemMatch: { idStream: check.id } } })
          .toArray();
        const [, toSetHuman] = langKeysValues
          .find(element => element && element[0] === userSettings[0].streams[0].to);
        const [, fromSetHuman] = langKeysValues
          .find(element => element && element[0] === userSettings[0].streams[0].from);
        const answer = `Current bot translator settings. \nSource language is ${fromSetHuman},\ntarget language is ${toSetHuman}.`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo. state update
        await botCollection.update(
          { user: userId },
          { $set: { general: false, help: false, translate: true } },
        );
        return;
      }
    }
    // код отправить в ответ сообщение "привет"
    if (textBodyTrimmed.match(/t s l/)) {
      if (!botStreamSetting[0].general && !botStreamSetting[0].source) {
        await botCollection.update(
          { user: userId },
          { $set: { general: true, translate: false } },
        );
        const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo, state update
        await botCollection.update({ user: userId }, { $set: { source: true } });
        return;
      }
    }
    if (botStreamSetting[0].general && botStreamSetting[0].source) {
      const checkedFromLanguage = langKeysValues
        .find(element => element && element[1] === textBodyTrimmed);
      // console.log('checkedFromLanguage: ', checkedFromLanguage);
      if (checkedFromLanguage) {
        const answer = `Source language is changed to <${checkedFromLanguage[1]}>`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo. lang update.
        await userCollection.update(
          { user: userId, 'streams.idStream': check.id },
          { $set: { 'streams.$.from': checkedFromLanguage[0], 'streams.$.flag': true } },
        );
        // mongo. state update
        await botCollection.update(
          { user: userId },
          { $set: { general: false, source: false, translate: true } },
        );
        return;
      }
      const answer = `<${textBodyTrimmed}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      return;
    }
    // translate bot settings. На какой язык?
    if (textBodyTrimmed.match(/t t l/i)) {
      if (!botStreamSetting[0].general && !botStreamSetting[0].target) {
        await botCollection.update(
          { user: userId },
          { $set: { general: true, translate: false } },
        );
        const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // Монго, set state.
        await botCollection.update({ user: userId }, { $set: { target: true } });
        return;
      }
    }
    // Проверка введенного языка
    if (botStreamSetting[0].general && botStreamSetting[0].target) {
      const checkedToLanguage = langKeysValues
        .find(element => element && element[1] === textBodyTrimmed);
      // console.log('checkedToLanguage: ', checkedToLanguage);
      if (checkedToLanguage) {
        const answer = `Target language is changed to <${checkedToLanguage[1]}>`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo. lang update.
        await userCollection.update(
          { user: userId, 'streams.idStream': check.id },
          { $set: { 'streams.$.to': checkedToLanguage[0], 'streams.$.flag': true } },
        );
        // mongo. state update.
        await botCollection.update(
          { user: userId },
          { $set: { general: false, target: false, translate: true } },
        );
        return;
      }
      const answer = `<${textBodyTrimmed}> is not correct input for me (bot). Please, send me correct name of language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
    // переводчик
    if (botStreamSetting[0].translate) {
      // берем настройки из mongodb
      const userSettings = await userCollection
        .find({}, { user: userId, streams: { $elemMatch: { idStream: check.id } } })
        .toArray();
      // console.log('userSettings[0].streams[0]\n', userSettings[0].streams[0]);
      const fromSet = userSettings[0].streams[0].from;
      const toSet = userSettings[0].streams[0].to;
      const answer = await translator(textBodyTrimmed, fromSet, toSet);
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
  }
}
module.exports = mention;
