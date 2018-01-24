// import {botClient} from 'bot-client';
// import { newThread, getAllThreads, renameThread } from './threads';

const threads = require('threads');

// const getAllThreads = require('threads');
// const renameThread = require('threads');

const { newThread, getAllThreads, renameThread } = threads;

const botClient = require('bot-client');
const shortid = require('shortid');

// только что созданные вами авторизационные данные
const creds = {
  email: '',
  password: '',
};

let deleteStreamAskedFlag = false;
let renameStreamAskedFlag = false;
let newNameAskedFlag = false;
let checkStreamName;
// переменные для добавления пользователя
let checkUserInput;
let checkStreamInput;
let streamAskedFlag = false;
let streamCheckedUserAskedFlag = false;
let adminStreamAskedFlag = false;
let userForAdminAskedFlag = false;
// let streamAskedForGetThreadsFlag = false;
// let streamAskedForCreateThreadsFlag = false;
// let streamCheckedThreadNameAsked = false;
// let streamAskedForRenameThreadsFlag = false;
// let streamCheckedThreadforRenameAsked = false;
// let threadCheckedNameAsked = false;
// let threadInChecked;

const {
  comment, stream, thread, contact,
} = botClient.connect(creds);

// Функция дает боту постить сообщение, которое ему передается.
async function botPost(teamId, to, answer) {
  const att = [{ type: 'text', data: { text: answer } }];
  await comment.create(teamId, { to, att });
}
// Функция принимает список стримов и возвращает список названий и id конкретного админа.
async function nameList(teamId) {
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
// Функция получения списка всех пользователей и вывод списка из трех параметров.
async function userList(teamId) {
  const allUsers = await contact.read(teamId, { billingType: 'users' });
  // console.log("userList: \n", userList.data[0].basicData);
  const users = [];
  for (let i = 0; i < allUsers.data.length; i += 1) {
    // в условии только админы с уникальным id
    const objectStream = {};
    objectStream.title = allUsers.data[i].basicData.name;
    objectStream.email = allUsers.data[i].basicData.email;
    objectStream.id = allUsers.data[i]._id;
    users.push(objectStream);
  }
  return users;
}
// Функция получения всех пользователей данного стрима
async function usersOfStreamList(teamId, streamId) {
  const oneStream = await stream.read(teamId, { id: streamId });
  const allUsers = await userList(teamId);
  const userIdList = [];
  const checkedIdName = [];
  let checkIdReturnName = [];
  for (let i = 0; i < oneStream.data[0].roles.length; i += 1) {
    userIdList.push(oneStream.data[0].roles[i]);
  }
  // console.log("users of stream:\n", userIdList);
  for (let i = 0; i < allUsers.length; i += 1) {
    checkIdReturnName = userIdList.map((userId) => {
      if (userId === allUsers[i].id) {
        // console.log('in condition >? ', allUsers[i])
        return allUsers[i];
      }
      return [];
    });
    // console.log("checkIdReturnName 1:\n", checkIdReturnName);
    for (let k = 0; k < checkIdReturnName.length; k += 1) {
      if (checkIdReturnName[k] != null) {
        checkedIdName.push(checkIdReturnName[k]);
        // console.log("checkedIdName 1:\n", checkedIdName)
      }
    }
  }
  // console.log("checkedIdName 2:\n", checkedIdName);
  return checkedIdName;
}
// Функция для обработки ответов пользователя.
// async function requestResponse (paramGet, text, firstAsk, errorAsk, confirm) {
//     const answer = firstAsk
//     await botPost(teamId, to, answer)
//
//     let matching = await text.match(/paramGet/i)
//     if (matching == paramGet) {
//    ch botPost(teamId, to, answer)
//         return
//     } else {
//         const answer = errorAsk
//         await botPost(teamId, to, answer)
//     }
// }

// основное тело программы
comment.onDirect(async (message) => {
  // когда кто-то напишет вам личное сообщение
  // будет работать этот коллбек
  // console.log('ON_DIRECT:\n', message)
  const { teamId } = message;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  // Функции, которые работают с тредами.
  await newThread(text, teamId, to, stream, thread);
  getAllThreads(text, teamId, to, thread);
  renameThread(text, teamId, to, thread);

  // help
  if (text.match(/help/i)) {
    const answer = 'help - show the command help\nc s - create stream (with random name)\ng l s - get last stream\ng a s - get all streams\nd a s - delete all streams\nd l s - delete last stream\nd s - delete stream (you chosen)\nr s - rename stream\nn u - new user (add to stream you chosen)';
    await botPost(teamId, to, answer);
    return;
  }
  // создание стрима
  if (text.match(/c s/)) {
    const streamName = `stream_${shortid.generate()}`;
    // создание стрима
    const createdStream = await stream.create(teamId, { name: streamName });
    // вывод в консоль
    // console.log('create stream:\n', createdStream)
    // мой ответ бота
    const answer = `Stream named ${streamName}, \nwith id ${createdStream.data.id}\nis created.`;
    await botPost(teamId, to, answer);
    return;
  }
  // получение id только что созданного стрима
  if (text.match(/g l s/)) {
    const streamsNameAndId = await nameList(teamId);
    if (streamsNameAndId.length !== 0) {
      const answer = `The last stream is: ${streamsNameAndId[streamsNameAndId.length - 1].title}`;
      await botPost(teamId, to, answer);
      return;
    }
    const answer = 'There are no streams to delete';
    await botPost(teamId, to, answer);
  }
  // получение всех стримов
  if (text.match(/g a s/)) {
    const streamsNameAndId = await nameList(teamId);
    if (streamsNameAndId.length !== 0) {
      const answer = `There are streams like these: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, answer);
      return;
    }
    const answer = 'There are no streams to show';
    await botPost(teamId, to, answer);
  }
  // удаление всех стримов
  if (text.match(/d a s/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
    if (streamsNameAndId.length !== 0) {
      for (let i = 0; i < streamsNameAndId.length; i += 1) {
        await stream.delete(teamId, { id: streamsNameAndId[i].id });
        const answer = `Stream ${streamsNameAndId[i].title} is deleted`;
        await botPost(teamId, to, answer);
      }
    } else {
      const answer = 'There are no streams to delete';
      await botPost(teamId, to, answer);
    }
  }
  // удаление только последнего стрима. Глючит иногда
  if (text.match(/d l s/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
    if (streamsNameAndId.length !== 0) {
      await stream.delete(teamId, { id: streamsNameAndId[streamsNameAndId.length - 1].id });
      const answer = `Stream ${streamsNameAndId[streamsNameAndId.length - 1].title} is deleted`;
      await botPost(teamId, to, answer);
    } else {
      const answer = 'There are no streams to delete';
      await botPost(teamId, to, answer);
    }
  }
  // запрос на удаление стрима по его названию
  if (text.match(/d s/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Which stream would you like to delete? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer);

    deleteStreamAskedFlag = true;
    // console.log("del stream: ", deleteStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);
    return;
  }
  // Удаление стрима. Ответ
  if (deleteStreamAskedFlag) {
    // console.log("text: \n", text);
    const streamsNameAndId = await nameList(teamId);
    const check = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('check > ', check)
    if (check) {
      // console.log("Text of deleting stream is correct!")
      // console.log("streamNameToDelete > ", text)
      const response = await stream.delete(teamId, { id: check.id });
      if (response.code === 200) {
        const answer = `Stream named ${check.title} is deleted.`;
        await botPost(teamId, to, answer);
        deleteStreamAskedFlag = false;
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are no stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => element.title)}.`;

    await botPost(teamId, to, answer);
    return;
  }
  // Запрос. Какой стрим переименовать?
  if (text.match(/r s/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Which stream would you like to rename? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer);

    renameStreamAskedFlag = true;
    // console.log("renameStreamAskedFlag: ", renameStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);

    return;
  }
  // Переименование стрима. Ответ и запрос и снова ответ.
  if (renameStreamAskedFlag) {
    const streamsNameAndId = await nameList(teamId);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkStreamName > ', checkStreamName)
    if (checkStreamName) {
      // console.log("Text of renaming stream is correct!")
      // console.log("streamNameToRename > ", text)
      const answer = `What new name would you like to set for ${checkStreamName.title}?`;
      await botPost(teamId, to, answer);

      newNameAskedFlag = true;
      // console.log('newNameAskedFlag: ', newNameAskedFlag);
      renameStreamAskedFlag = false;
      return;
    }
    // console.log('noDay for read');
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;

    await botPost(teamId, to, answer);
    return;
  }
  // Получение нового имени и переименование
  if (newNameAskedFlag) {
    // console.log("We are renaming");
    const response = await stream.setName(teamId, { id: checkStreamName.id, name: text });
    if (response.code === 200) {
      const answer = `Stream named ${checkStreamName.title} is renamed.`;
      await botPost(teamId, to, answer);
      newNameAskedFlag = false;
      return;
    }
    const answer = `Some ERR: ${response.message}`;
    await botPost(teamId, to, answer);
    newNameAskedFlag = false;
    return;
  }
  // Запрос. Выберите пользователя?
  if (text.match(/n u/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log("users:\n", users);
    const answer = `Where do you want to add user? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);

    streamAskedFlag = true;
    return;
  }
  // Ответ. Проверка пользователя. Выберите стрим?
  if (streamAskedFlag) {
    const users = await userList(teamId);
    const streamsNameAndId = await nameList(teamId);
    // console.log("streamsNameAndId:\n", streamsNameAndId);
    // проверка введенного имени на сответствие дному из списка пользователей.
    checkStreamInput = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkUserSet > ', checkUserSet)

    if (checkStreamInput) {
      const answer = `Ok. What user from the list below do you wish to add to ${checkStreamInput.title}? ${users.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, answer);
      streamCheckedUserAskedFlag = true;
      streamAskedFlag = false;

      return;
    }
    const answer = `There are no stream like: ${text}. Please, type name of user from the list below: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;

    await botPost(teamId, to, answer);
    return;
  }
  // Ответ. Проверка стрима. Добавление пользователя в стрим.
  if (streamCheckedUserAskedFlag) {
    const users = await userList(teamId);
    // console.log("We are inside streamCheckedUserAskedFlag");
    // console.log("streamsNameAndId:\n", streamsNameAndId);
    checkUserInput = users.find(typeUser => typeUser && typeUser.title === text);
    if (checkUserInput) {
      const response = await stream.setUser(
        teamId,
        { id: checkStreamInput.id, userId: checkUserInput.id },
      );
      if (response.code === 200) {
        const answer = `${checkUserInput.title} has added to ${checkStreamInput.title}.`;
        await botPost(teamId, to, answer);
        streamCheckedUserAskedFlag = false;
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer);
      streamCheckedUserAskedFlag = false;
      return;
    }
    // console.log("There are no stream like this")
    const answer = `There are no user like: ${text}. Please, type name of user from the list below: ${users.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    return;
  }
  // Назначить пользователя админом стрима. Запрос. Какой стрим?
  // Запрос. Какой стрим переименовать?
  if (text.match(/a u/)) {
    const streamsNameAndId = await nameList(teamId);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Where do you going to set admin? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer);
    adminStreamAskedFlag = true;
    // console.log("adminStreamAskedFlag: ", adminStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);
    return;
  }
  // Переименование стрима. Ответ и запрос и снова ответ.
  if (adminStreamAskedFlag) {
    const streamsNameAndId = await nameList(teamId);

    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkStreamName > ', checkStreamName)
    if (checkStreamName) {
      // console.log("Text of stream is correct!")
      // console.log("streamNameToSetAdmin > ", text)
      const usersListOfStream = await usersOfStreamList(teamId, checkStreamName.id);
      // console.log("usersListOfStream:\n", usersListOfStream);
      const answer = `What user would you like to set admin in ${checkStreamName.title}. List users to choose: ${usersListOfStream.map(element => `\n${element.title}`)}?`;
      await botPost(teamId, to, answer);

      userForAdminAskedFlag = true;
      // console.log("userForAdminAskedFlag: ", userForAdminAskedFlag);
      adminStreamAskedFlag = false;
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer);
    return;
  }
  // Получение имени и назначение админа
  if (userForAdminAskedFlag) {
    const usersListOfStream = await usersOfStreamList(teamId, checkStreamName.id);
    // проверка введенного имени на сответствие одному из списка пользователей.
    checkUserInput = usersListOfStream.find(typeUser => typeUser && typeUser.title === text);
    if (checkUserInput) {
      // Проверка прошла успешно. Делаем пользователя админом.
      // console.log('We are inside admin Set');
      const response = await stream.setAdmin(
        teamId,
        { id: checkStreamName.id, userId: checkUserInput.id },
      );
      if (response.code === 200) {
        const answer = `User ${checkUserInput.title} has become the admin of ${checkStreamName.title}.`;
        await botPost(teamId, to, answer);
        newNameAskedFlag = false;
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer);
      userForAdminAskedFlag = false;
      return;
    }
    const answer = `There are no users like ${text} in ${checkStreamName.title}. Please, choose user from the list: ${usersListOfStream.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer);
  }
  // создание треда. В каком стриме?
  // if (text.match(/n t/)) {
  //   const streamsNameAndId = await nameList(teamId);
  //   // console.log("users:\n", users);
  //   const answer = `Where do you want to create thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   streamAskedForCreateThreadsFlag = true;
  //   return;
  // }
  // // Проверка стрима. Какое имя?
  // if (streamAskedForCreateThreadsFlag) {
  //   const streamsNameAndId = await nameList(teamId);
  //   checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
  //   if (checkStreamName) {
  //     // console.log("threads:\n", threadIn);
  //     const answer = `What name of thread do you wish to create in ${checkStreamName.title}?`;
  //     await botPost(teamId, to, answer);
  //     streamAskedForCreateThreadsFlag = false;
  //     streamCheckedThreadNameAsked = true;
  //     console.log("streamCheckedThreadNameAsked: ", streamCheckedThreadNameAsked);
  //     return;
  //   }
  //   // console.log("noDay for read")
  //   const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   return;
  // }
  // // Получение имени треда и создание последнего
  // if (streamCheckedThreadNameAsked) {
  //   // console.log("checkStreamName.id: ", checkStreamName.id);
  //   let streamIn = await stream.read(teamId, { id: checkStreamName.id });
  //   // console.log('streamIn: ', streamIn);
  //   // let countThreads = streamIn.data[0].threadsSequence.length;
  //   // console.log('Число задач до создания новой заметки: ', countThreads);
  //   const status = streamIn.data[0].threadStatuses[0];
  //   // console.log('status: ', status);
  //   const threadCreate = await thread.create(teamId, {
  //     statusId: status,
  //     streamId: checkStreamName.id,
  //     title: text,
  //     deadline: [null, 1231231231231],
  //     responsibleUserId: '5a3a587b19e9f8001fb1bf8b',
  //   });
  //   // console.log('threadCreate: ', threadCreate);
  //   const threadIn = await thread.read(
  //     teamId,
  //     { id: threadCreate.data },
  //   );
  //   // console.log('thread: ', threadIn.data[0].title);
  //   const answer = `Thread named ${threadIn.data[0].title} is created.`;
  //   await botPost(teamId, to, answer);
  //   return;
  // }
  // // Вывод списка тредов. Какой стрим?
  // if (text.match(/g a t/)) {
  //   const streamsNameAndId = await nameList(teamId);
  //   // console.log("users:\n", users);
  //   const answer = `Where do you want to see threads? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   streamAskedForGetThreadsFlag = true;
  //   return;
  // }
  // // Проверка стрима. Если верно имя, то вывод всех тредов.
  // if (streamAskedForGetThreadsFlag) {
  //   const streamsNameAndId = await nameList(teamId);
  //   checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
  //   if (checkStreamName) {
  //     const threadIn = await thread.read(
  //       teamId,
  //       { streamId: checkStreamName.id },
  //     );
  //     // console.log("threads:\n", threadIn);
  //     const answer = `Threads of ${checkStreamName.title} are ${threadIn.data.map(element => `\n${element.title}`)}.`;
  //     await botPost(teamId, to, answer);
  //     streamAskedForGetThreadsFlag = false;
  //     return;
  //   }
  //   // console.log("noDay for read")
  //   const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   return;
  // }
  // // Переименование треда. Какой стрим?
  // if (text.match(/r t/)) {
  //   const streamsNameAndId = await nameList(teamId);
  //   // console.log("users:\n", users);
  //   const answer = `Where do you want to rename thread? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   streamAskedForRenameThreadsFlag = true;
  //   return;
  // }
  // // Проверка стрима. Какое тред переименовывать?
  // if (streamAskedForRenameThreadsFlag) {
  //   const streamsNameAndId = await nameList(teamId);
  //   checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
  //   if (checkStreamName) {
  //     const threadIn = await thread.read(
  //       teamId,
  //       { streamId: checkStreamName.id },
  //     );
  //     // console.log('threads:\n', threadIn);
  //     const answer = `What thread do you wish to rename in ${checkStreamName.title}? There are the threads: ${threadIn.data.map(element => `\n${element.title}`)}.`;
  //     await botPost(teamId, to, answer);
  //     streamAskedForRenameThreadsFlag = false;
  //     streamCheckedThreadforRenameAsked = true;
  //     // console.log('streamCheckedThreadforRenameAsked: ', streamCheckedThreadforRenameAsked);
  //     return;
  //   }
  //   // console.log("noDay for read")
  //   const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   return;
  // }
  // // Проверка имени треда. Какое новое имя будет у треда?
  // if (streamCheckedThreadforRenameAsked) {
  //   const threadIn = await thread.read(
  //     teamId,
  //     { streamId: checkStreamName.id },
  //   );
  //   // console.log('threads:\n', threadIn);
  //   threadInChecked = threadIn.data.find(typeUser => typeUser && typeUser.title === text);
  //   // console.log('threadInChecked:\n', threadInChecked);
  //   if (threadInChecked) {
  //     const answer = `What new name do you wish to give to thread: ${threadInChecked.title}?`;
  //     await botPost(teamId, to, answer);
  //     threadCheckedNameAsked = true;
  //     // console.log('threadCheckedNameAsked:\n', threadCheckedNameAsked);
  //     streamCheckedThreadforRenameAsked = false;
  //     return;
  //   }
  //   const answer = `There are not thread like: ${text} in stream: ${checkStreamName.title}. Please, type name of thread from the list: ${threadIn.data.map(element => `\n${element.title}`)}.`;
  //   await botPost(teamId, to, answer);
  //   return;
  // }
  // // Переименование треда.
  // if (threadCheckedNameAsked) {
  //   // console.log('threadInChecked._id: ', threadInChecked._id);
  //   await thread.setTitle(teamId, { id: threadInChecked._id, title: text });
  //   const answer = `Thread ${threadInChecked.title} renamed to ${text} in stream: ${checkStreamName.title}`;
  //   await botPost(teamId, to, answer);
  //   threadCheckedNameAsked = false;
  //   return;
  // }

});
