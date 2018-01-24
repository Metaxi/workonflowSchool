let streamAskedForGetThreadsFlag = false;
let streamAskedForCreateThreadsFlag = false;
let streamCheckedThreadNameAsked = false;
let streamAskedForRenameThreadsFlag = false;
let streamCheckedThreadforRenameAsked = false;
let threadCheckedNameAsked = false;
let threadInChecked;
let checkStreamName;

// Функция дает боту постить сообщение, которое ему передается.
async function botPost(teamId, to, answer, comment) {
  const att = [{ type: 'text', data: { text: answer } }];
  await comment.create(teamId, { to, att });
}
// Функция принимает список стримов и возвращает список названий и id конкретного админа.
async function nameList(teamId, stream) {
  const allStreams = await stream.read(teamId, {});
  // console.log("allStreams:\n", allStreams);
  const streams = [];
  for (let i = 0; i < allStreams.data.length; i += 1) {
  // в условии только админы с уникальным id
    if (allStreams.data[i].admins[0] === '5a3a587b19e9f8001fb1bf8b') {
      const objectStream = {};
      objectStream.title = allStreams.data[i].name;
      objectStream.id = allStreams.data[i]._id;
      streams.push(objectStream);
    }
  }
  return streams;
}
//
async function newThread(text, teamId, to, stream, thread) {
  if (text.match(/n t/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("users:\n", users);
    const answer = `Where do you want to create thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    streamAskedForCreateThreadsFlag = true;
    return;
  }
  // Проверка стрима. Какое имя?
  if (streamAskedForCreateThreadsFlag) {
    const streamsNameAndId = await nameList(teamId);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      // console.log("threads:\n", threadIn);
      const answer = `What name of thread do you wish to create in ${checkStreamName.title}?`;
      await botPost(teamId, to, answer);
      streamAskedForCreateThreadsFlag = false;
      streamCheckedThreadNameAsked = true;
      // console.log("streamCheckedThreadNameAsked: ", streamCheckedThreadNameAsked);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    return;
  }
  // Получение имени треда и создание последнего
  if (streamCheckedThreadNameAsked) {
    // console.log("checkStreamName.id: ", checkStreamName.id);
    const streamIn = await stream.read(teamId, { id: checkStreamName.id });
    // console.log('streamIn: ', streamIn);
    // let countThreads = streamIn.data[0].threadsSequence.length;
    // console.log('Число задач до создания новой заметки: ', countThreads);
    const status = streamIn.data[0].threadStatuses[0];
    // console.log('status: ', status);
    const threadCreate = await thread.create(teamId, {
      statusId: status,
      streamId: checkStreamName.id,
      title: text,
      deadline: [null, 1231231231231],
      responsibleUserId: '5a3a587b19e9f8001fb1bf8b',
    });
    // console.log('threadCreate: ', threadCreate);
    const threadIn = await thread.read(
      teamId,
      { id: threadCreate.data },
    );
    // console.log('thread: ', threadIn.data[0].title);
    const answer = `Thread named ${threadIn.data[0].title} is created.`;
    await botPost(teamId, to, answer);
  }
}
async function getAllThreads(text, teamId, to, thread) {
  // Вывод списка тредов. Какой стрим?
  if (text.match(/g a t/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("users:\n", users);
    const answer = `Where do you want to see threads? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    streamAskedForGetThreadsFlag = true;
    return;
  }
  // Проверка стрима. Если верно имя, то вывод всех тредов.
  if (streamAskedForGetThreadsFlag) {
    const streamsNameAndId = await nameList(teamId);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const threadIn = await thread.read(
        teamId,
        { streamId: checkStreamName.id },
      );
      // console.log("threads:\n", threadIn);
      const answer = `Threads of ${checkStreamName.title} are ${threadIn.data.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, answer);
      streamAskedForGetThreadsFlag = false;
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
  }
}
async function renameThread(text, teamId, to, thread) {
  // Переименование треда. Какой стрим?
  if (text.match(/r t/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("users:\n", users);
    const answer = `Where do you want to rename thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    streamAskedForRenameThreadsFlag = true;
    return;
  }
  // Проверка стрима. Какое тред переименовывать?
  if (streamAskedForRenameThreadsFlag) {
    const streamsNameAndId = await nameList(teamId);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    if (checkStreamName) {
      const threadIn = await thread.read(
        teamId,
        { streamId: checkStreamName.id },
      );
      // console.log('threads:\n', threadIn);
      const answer = `What thread do you wish to rename in ${checkStreamName.title}? There are the threads: ${threadIn.data.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, answer);
      streamAskedForRenameThreadsFlag = false;
      streamCheckedThreadforRenameAsked = true;
      // console.log('streamCheckedThreadforRenameAsked: ', streamCheckedThreadforRenameAsked);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
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
      const answer = `What new name do you wish to give to thread: ${threadInChecked.title}?`;
      await botPost(teamId, to, answer);
      threadCheckedNameAsked = true;
      // console.log('threadCheckedNameAsked:\n', threadCheckedNameAsked);
      streamCheckedThreadforRenameAsked = false;
      return;
    }
    const answer = `There are not thread like: ${text} in stream: ${checkStreamName.title}. Please, type name of thread from the list: ${threadIn.data.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    return;
  }
  // Переименование треда.
  if (threadCheckedNameAsked) {
    // console.log('threadInChecked._id: ', threadInChecked._id);
    await thread.setTitle(teamId, { id: threadInChecked._id, title: text });
    const answer = `Thread ${threadInChecked.title} renamed to ${text} in stream: ${checkStreamName.title}`;
    await botPost(teamId, to, answer);
    threadCheckedNameAsked = false;
  }
}
export { newThread, getAllThreads, renameThread };
