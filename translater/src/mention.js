// const langs = require('google-translate-api/languages');

const common = require('./common');

const { translator, botPost } = common;

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
) {
  // mongodb, создание объекта с настройками по умолчанию.
  const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  if (userSettingDefault.length === 0) {
    await userCollection.insert({ user: userId, from: 'auto', to: 'en' });
  }
  // Пустая ли строка
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  if (isBlank(text.split('@')[2])) {
    // console.log('[2] is empty');
    const emails = await mail.read(teamId, {});
    const emailBody = emails.data.find(element => element && element.threadId === threadId).text;
    // console.log('emailBody:\n', emailBody);
    const userSettings = await userCollection.find({ user: userId }).toArray();
    // console.log('userSettings[0]:\n', userSettings[0]);
    const fromSet = userSettings[0].from;
    const toSet = userSettings[0].to;
    const answer = await translator(emailBody, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  } else {
    // console.log('text1:\n', text);
    const [, , textBody] = text.split('@');
    // console.log('text2:\n', text);
    // код отправить в ответ сообщение "привет"
    if (textBody) {
      const userSettings = await userCollection.find({ user: userId }).toArray();
      // console.log('userSettings[0]:\n', userSettings[0]);
      const fromSet = userSettings[0].from;
      const toSet = userSettings[0].to;
      const answer = await translator(textBody, fromSet, toSet);
      await botPost(teamId, to, comment, streamId, threadId, answer);
    }
  }
}

module.exports = mention;
