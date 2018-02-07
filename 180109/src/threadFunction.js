const common = require('./common');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const { nameList, botPost, statusList } = common;

let streamAskedForGetThreadsFlag = false;
let streamAskedForCreateThreadsFlag = false;
let streamCheckedThreadNameAsked = false;
let streamAskedForRenameThreadsFlag = false;
let streamCheckedThreadforRenameAsked = false;
let threadCheckedNameAsked = false;
let threadInChecked;
let checkStreamName;
let streamAskedForSetStatusThreadsFlag = false;
let streamCheckedThreadforStatusAsked = false;
let threadCheckedStatusAsked = false;

async function threadFunction(text, teamId, to, stream, thread, comment, status) {
  // Connection URL
  const url = 'mongodb://localhost:27017';
  // Use connect method to connect to the server
  const mongoConnect = await MongoClient.connect(url);
  const db = mongoConnect.db('bot');
  const threadCollection = db.collection('threadCollection');

  // создание треда. В каком стриме?
  if (text.match(/t n/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("users:\n", users);
    const answer = `Where do you want to create thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    streamAskedForCreateThreadsFlag = true;
    return;
  }
  // Проверка стрима. Какое имя?
  if (streamAskedForCreateThreadsFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      // console.log("threads:\n", threadIn);
      const answer = `What name of thread do you wish to create in <${checkStreamName.title}>?`;
      await botPost(teamId, to, answer, comment);
      streamAskedForCreateThreadsFlag = false;
      streamCheckedThreadNameAsked = true;
      // console.log('treamCheckedThreadNameAsked: ', streamCheckedThreadNameAsked);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Получение имени треда и создание последнего
  if (streamCheckedThreadNameAsked) {
    // console.log("checkStreamName.id: ", checkStreamName.id);
    const streamIn = await stream.read(teamId, { id: checkStreamName.id });
    // console.log('streamIn: ', streamIn);
    // let countThreads = streamIn.data[0].threadsSequence.length;
    // console.log('Число задач до создания новой заметки: ', countThreads);
    const statusOfThread = streamIn.data[0].threadStatuses[0];
    // console.log('status: ', status);
    const threadCreate = await thread.create(teamId, {
      statusId: statusOfThread,
      streamId: checkStreamName.id,
      title: text,
      deadline: [null, 1231231231231],
      responsibleUserId: '5a3a587b19e9f8001fb1bf8b',
    });
    if (threadCreate.code === 200) {
      // console.log('threadCreate: ', threadCreate);
      const threadIn = await thread.read(
        teamId,
        { id: threadCreate.data },
      );
      // console.log('thread: ', threadIn.data[0].title);
      const answer = `Thread <${threadIn.data[0].title}> is created in stream <${checkStreamName.title}>.`;
      await botPost(teamId, to, answer, comment);
      streamCheckedThreadNameAsked = false;
      // mongoDB

      return;
    }
    const answer = `Some ERR: ${threadCreate.message}`;
    await botPost(teamId, to, answer, comment);
  }

  // Вывод списка тредов. Какой стрим?
  if (text.match(/t g a/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("users:\n", users);
    const answer = `Where do you want to see threads? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    streamAskedForGetThreadsFlag = true;
    return;
  }
  // Проверка стрима. Если верно имя, то вывод всех тредов.
  if (streamAskedForGetThreadsFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const threadIn = await thread.read(
        teamId,
        { streamId: checkStreamName.id },
      );
      // console.log("threads:\n", threadIn);
      const answer = `Threads of <${checkStreamName.title}> are ${threadIn.data.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, answer, comment);
      streamAskedForGetThreadsFlag = false;
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }

  // Переименование треда. Какой стрим?
  if (text.match(/t r/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("users:\n", users);
    const answer = `Where do you want to rename thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    streamAskedForRenameThreadsFlag = true;
    return;
  }
  // Проверка стрима. Какое тред переименовывать?
  if (streamAskedForRenameThreadsFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const threadIn = await thread.read(
        teamId,
        { streamId: checkStreamName.id },
      );
      // console.log('threads:\n', threadIn);
      const answer = `What thread do you wish to rename in <${checkStreamName.title}>? There are the threads: ${threadIn.data.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, answer, comment);
      streamAskedForRenameThreadsFlag = false;
      streamCheckedThreadforRenameAsked = true;
      // console.log('streamCheckedThreadforRenameAsked: ', streamCheckedThreadforRenameAsked);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Проверка имени треда. Какое новое имя будет у треда?
  if (streamCheckedThreadforRenameAsked) {
    const threadIn = await thread.read(
      teamId,
      { streamId: checkStreamName.id },
    );
    // console.log('threads:\n', threadIn);
    threadInChecked = threadIn.data.find(typeUser => typeUser && typeUser.title === text);
    // console.log('threadInChecked:\n', threadInChecked);
    if (threadInChecked) {
      const answer = `What new name do you wish to give to thread: <${threadInChecked.title}>?`;
      await botPost(teamId, to, answer, comment);
      threadCheckedNameAsked = true;
      // console.log('threadCheckedNameAsked:\n', threadCheckedNameAsked);
      streamCheckedThreadforRenameAsked = false;
      return;
    }
    const answer = `There are not thread like: <${text}> in stream: <${checkStreamName.title}>. Please, type name of thread from the list: ${threadIn.data.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Переименование треда.
  if (threadCheckedNameAsked) {
    // console.log('threadInChecked._id: ', threadInChecked._id);
    await thread.setTitle(teamId, { id: threadInChecked._id, title: text });
    const answer = `Thread <${threadInChecked.title}> renamed to <${text}> in stream: ${checkStreamName.title}`;
    await botPost(teamId, to, answer, comment);
    threadCheckedNameAsked = false;
    return;
  }

  // Перемешение треда по статусам? Какой стрим?
  if (text.match(/t m ss/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("users:\n", users);
    const answer = `Where do you want to set status for thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    streamAskedForSetStatusThreadsFlag = true;
    return;
  }
  // Проверка стрима. Какой тред переносить?
  if (streamAskedForSetStatusThreadsFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const threadIn = await thread.read(
        teamId,
        { streamId: checkStreamName.id },
      );
      // console.log('threads:\n', threadIn);
      const answer = `What thread do you wish to set new status in <${checkStreamName.title}>? There are the threads: ${threadIn.data.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, answer, comment);
      streamAskedForSetStatusThreadsFlag = false;
      streamCheckedThreadforStatusAsked = true;
      // console.log('streamCheckedThreadforRenameAsked: ', streamCheckedThreadforRenameAsked);
      return;
    }
    const answer = `There are not stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Проверка треда. В какой статус переносить тред?
  if (streamCheckedThreadforStatusAsked) {
    const threadIn = await thread.read(
      teamId,
      { streamId: checkStreamName.id },
    );
    const statusOfStream = await statusList(teamId, status, checkStreamName.id);
    // console.log('threads:\n', threadIn);
    threadInChecked = threadIn.data.find(typeUser => typeUser && typeUser.title === text);
    // console.log('threadInChecked:\n', threadInChecked);
    if (threadInChecked) {
      const answer = `What new status do you wish to give to thread: <${threadInChecked.title}>? Please, choose from the list:${statusOfStream.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, answer, comment);
      threadCheckedStatusAsked = true;
      // console.log('threadCheckedNameAsked:\n', threadCheckedNameAsked);
      streamCheckedThreadforStatusAsked = false;
      return;
    }
    const answer = `There are not thread like: ${text} in stream: ${checkStreamName.title}. Please, type name of thread from the list: ${threadIn.data.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Проверка статуса. Перенос.
  if (threadCheckedStatusAsked) {
    const threadIn = await thread.read(
      teamId,
      { streamId: checkStreamName.id },
    );
    const statusOfStream = await statusList(teamId, status, checkStreamName.id);
    // console.log('statusOfStream:\n', statusOfStream);
    const statusChecked = statusOfStream.find(element => element && element.title === text);
    // console.log('statusChecked1:\n', statusChecked);
    // console.log('threadInChecked:\n', threadInChecked);
    if (statusChecked) {
      // console.log('statusChecked2:\n', statusChecked);
      // console.log('threadInChecked.id:\n', threadInChecked._id);
      // console.log('statusChecked._id:\n', statusChecked._id);
      await thread.setStatus(teamId, { id: threadInChecked._id, statusId: statusChecked.id });
      const answer = `Status of thread <${threadInChecked.title}> changed to <${statusChecked.title}> in stream <${checkStreamName.title}>?`;
      await botPost(teamId, to, answer, comment);
      threadCheckedStatusAsked = false;
      return;
    }
    const answer = `There are not status like: ${text} in stream: <${checkStreamName.title}>. Please, type name of thread from the list: ${threadIn.data.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
}
module.exports = threadFunction;
