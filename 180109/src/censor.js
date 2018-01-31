const common = require('./common');

const { nameList, botPost } = common;

let streamAskedForCensorFlag = false;
const stopWords = ['qwer', 'asdf'];

async function censor(text, teamId, to, comment, stream) {
  if (text.match(/c c/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log('ok? ', 'ok');
    const answer = `Where do you want to check comments on stop-words? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    streamAskedForCensorFlag = true;
    return;
  }
  // Проверка стрима. Проверка комментариев на стоп слова. Удаление.
  if (streamAskedForCensorFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    const checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const allComments = await comment.read(teamId, {
        streamId: checkStreamName.id,
      });
      // console.log('Last comment: ',allComments.data[6].att[0]);
      // console.log(allComments.data);
      // console.log('Amount of coments: ', allComments.data.length);
      for (let i = 0; i < allComments.data.length; i += 1) {
        if (allComments.data[i].att[0] !== undefined &&
          stopWords.indexOf(allComments.data[i].att[0].data.text) !== -1) {
          // console.log('comment to delete: ', allComments.data[i].att[0].data.text);
          await comment.delete(teamId, {
            id: allComments.data[i]._id,
          });
          const answer = `Comment <${allComments.data[i].att[0].data.text}> contents stop-word(s) and deleted.`;
          await botPost(teamId, to, answer, comment);
          streamAskedForCensorFlag = false;
          return;
        }
      }
      const answer = 'There are no comments with stop-word(s).';
      await botPost(teamId, to, answer, comment);
      streamAskedForCensorFlag = false;
      return;
    }
    const answer = `There are no stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
  }
}

module.exports = censor;
