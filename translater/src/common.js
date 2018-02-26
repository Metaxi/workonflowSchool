const translate = require('google-translate-api');
const langs = require('google-translate-api/languages');
// Функция дает боту постить сообщение, которое ему передается.
async function botPost(teamId, to, comment, streamId, threadId, answer) {
  const att = [
    {
      type: 'text',
      data: { text: answer },
    },
  ];
  await comment.create(teamId, {
    to, att, streamId, threadId,
  });
}

async function translator(text, fromSet, toSet) {
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

module.exports = { botPost, translator };
