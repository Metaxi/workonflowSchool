const translate = require('google-translate-api');
// const langs = require('google-translate-api/languages');
// Функция дает боту постить сообщение, которое ему передается.
async function botPost(teamId, to, comment, streamId, threadId, answer) {
  const att = [
    {
      type: 'text',
      data: { text: answer },
    },
  ];
  await comment.create(teamId, {
    to,
    att,
    streamId,
    threadId,
  });
}

async function translator(text, fromSet, toSet) {
  let answer;
  await translate(text, { from: fromSet, to: toSet })
    .then((res) => {
      answer = res.text;
      // console.log('res:\n', res);
      // console.log('res.text.OnDirect:\n', res.text);
      // console.log('res.from.text.autoCorrected:\n', res.from.text.autoCorrected);
      // console.log('res.from.language.iso:\n', res.from.language.iso);
      // console.log('res.from.text.value:\n', res.from.text.value);
      // console.log('res.from.text.didYouMean:\n', res.from.text.didYouMean);
    })
    .catch((err) => {
      console.error(err);
    });
  return answer;
}

// Функция принимает список стримов и возвращает список названий и id конкретного админа.
async function nameList(teamId, stream, userId) {
  const allStreams = await stream.read(teamId, {});
  // console.log('allStreams:\n', allStreams.data[0]);
  const streams = [];
  allStreams.data.forEach((elementStream) => {
    elementStream.admins.forEach((elementAdmin) => {
      if (elementAdmin === userId) {
        const objectStream = {};
        objectStream.title = elementStream.name;
        objectStream.id = elementStream._id;
        streams.push(objectStream);
      }
    });
  });
  // console.log('streams', streams);
  return streams;
}

module.exports = { botPost, translator, nameList };
