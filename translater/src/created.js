const common = require('./common');

const { translator, botPost } = common;

async function created(
  userId,
  teamId,
  to,
  comment,
  streamId,
  threadId,
  text,
  userCollection,
  type,
) {
  if (type === 'mail') {
    // mongodb, создание объекта с настройками по умолчанию.
    const userSettingDefault = await userCollection.find({ user: userId }).toArray();
    if (userSettingDefault.length === 0) {
      await userCollection.insert({ user: userId, from: 'auto', to: 'en' });
    }
    // console.log('type is mail');
    // console.log('text: ', text);
    // const emailBody = message.data.content.att[0].data.text;
    const userSettings = await userCollection.find({ user: userId }).toArray();
    // console.log('userSettings[0]:\n', userSettings[0]);
    const streamSettings = await userSettings[0]
      .streams.find(element => element && element.idStream === streamId);
    // console.log('streamSettings:\n', streamSettings);
    const fromSet = streamSettings.from;
    const toSet = streamSettings.to;
    const answer = await translator(text, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }
}

module.exports = created;
