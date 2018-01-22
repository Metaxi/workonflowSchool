
const botClient = require('bot-client');
const shortid = require('shortid');
// только что созданные вами авторизационные данные
const creds = {
  email: "",
  password: ""
};


var deleteStreamAskedFlag = false;
var renameStreamAskedFlag = false;
var newNameAskedFlag = false;
var checkStreamName;
var allNames;
var randomName;
// переменные для добавления пользователя
var checkUserInput;
var checkStreamInput;
var userAskedFlag = false;
var userCheckedStreamAskedFlag = false;
var adminStreamAskedFlag = false;
var userForAdminAskedFlag = false;


const { comment, stream, thread, contact } = botClient.connect(creds);

// оптимизация. Функция, которая повторялась. Она единственная асинхронная.
async function botPost (teamId, to, answer) {
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att });
}
// Функция принимает список стримов и возвращает список названий и id конкретного админа.
async function nameList(teamId) {
    let allStreams = await stream.read(teamId, {})
    // console.log("allStreams:\n", allStreams);
    let nameList = [];
    for (var i=0; i<allStreams.data.length; i++) {
                // в условии только админы с уникальным id
        if (allStreams.data[i].admins[0] == '5a3a587b19e9f8001fb1bf8b') {
            let objectStream = {};
            objectStream.title = allStreams.data[i].name;
            objectStream.id = allStreams.data[i]._id;
            nameList.push(objectStream);
        }
    }
    return nameList;
}
// Функция получения списка пользователей и вывод списка из трех параметров.
async function userList(teamId) {
    const userList = await contact.read ( teamId, {billingType: 'users'})
    // console.log("userList: \n", userList.data[0].basicData);
    let users = [];
    for (var i=0; i<userList.data.length; i++) {
                // в условии только админы с уникальным id
            let objectStream = {};
            objectStream.title = userList.data[i].basicData.name;
            objectStream.email = userList.data[i].basicData.email;
            objectStream.id = userList.data[i]._id;
            users.push(objectStream);
    }
    return users;
}
// Функция получения всех пользователей данного стрима
async function usersOfStreamList(teamId, streamId) {
    let oneStream = await stream.read(teamId, {id: streamId})
    // const userList = await contact.read ( teamId, {billingType: 'users'})
    let allUsers = await userList(teamId)
    // console.log("oneStream:\n", oneStream);
    console.log("allUsers:\n", allUsers);

    // let users = [];
    let userIdList = [];
    let checkedIdName = []
    // let objectStream = {};
    let checkIdReturnName = [];
    for (var i=0; i<oneStream.data[0].roles.length; i++) {
            userIdList.push(oneStream.data[0].roles[i]);
    }
    console.log("users of stream:\n", userIdList);
    // for (var i=0; i<userList.data.length; i++) {
    //
    //             // в условии только админы с уникальным id
    //         objectStream.title = userList.data[i].basicData.name;
    //         console.log("objectStream.title:\n", objectStream.title);
    //         objectStream.id = userList.data[i]._id;
    //         console.log("objectStream.id:\n", objectStream.id);
    //         users.push(objectStream);
    //         console.log("users of all 1:\n", users);
    // }
    // console.log("users of all 2:\n", users);
    for (var i=0; i<allUsers.length; i++) {
        checkIdReturnName = userIdList.map(userId => {
            if (userId == allUsers[i].id) {
                console.log('in condition >? ', allUsers[i])
                return allUsers[i]
            }
            // return allUsers[i].title && userId == allUsers[i].id
        })
        console.log("checkIdReturnName 1:\n", checkIdReturnName);
        if (checkIdReturnName) {
            checkedIdName.push(checkIdReturnName)
        }
        console.log("checkIdReturnName 2:\n", checkIdReturnName);
        console.log("checkedIdName 1:\n", checkedIdName);
    }
    console.log("checkedIdName 2:\n", checkedIdName);
    return checkedIdName

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

// основное тело программу
comment.onDirect(async message => {
  // когда кто-то напишет вам личное сообщение
  // будет работать этот коллбек
  // console.log('ON_DIRECT:\n', message)
    const { teamId } = message;
    const to = message.data.content.from;
    const { data: { text}} = message.data.content.att[0];

const checker =  await usersOfStreamList(teamId, "5a65b97e8b3b170015b418ea")
const users = await userList(teamId);
console.log("checker:\n", checker);
// console.log("users", users);

// help
    if (text.match(/help/i)) {
        const answer = "help - show the command help\nc s - create stream (with random name)\ng l s - get last stream\ng a s - get all streams\nd a s - delete all streams\nd l s - delete last stream\nd s - delete stream (you chosen)\nr s - rename stream\nn u - new user (add to stream you chosen)"
        await botPost(teamId, to, answer)
        return
    }
// создание стрима
    if (text.match(/c s/)) {
            const streamName = 'stream_' + shortid.generate()
            // создание стрима
            const createdStream = await stream.create(teamId, { name: streamName })
            // вывод в консоль
            // console.log('create stream:\n', createdStream)
            // мой ответ бота
            const answer = `Stream named ${streamName}, \nwith id ${createdStream.data.id}\nis created.`
            await botPost(teamId, to, answer)
            return
        }
// получение id только что созданного стрима
    if (text.match(/g l s/)) {
      const streamsNameAndId = await nameList(teamId)
      if (streamsNameAndId.length != 0) {
          const answer = `The last stream is: ${streamsNameAndId[streamsNameAndId.length - 1].title}`
          await botPost(teamId, to, answer)
          return
      } else {
          const answer = 'There are no streams to delete'
          await botPost(teamId, to, answer)
      }
    }
// получение всех стримов
    if (text.match(/g a s/)) {
        const streamsNameAndId = await nameList(teamId)
        if (streamsNameAndId.length != 0) {
            const answer = `There are streams like these: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}`
            await botPost(teamId, to, answer)
            return
        } else {
            const answer = 'There are no streams to show'
            await botPost(teamId, to, answer)
        }

    }
// удаление всех стримов
    if (text.match(/d a s/)) {
        const streamsNameAndId = await nameList(teamId)
        // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
        if (streamsNameAndId.length != 0) {
            for (var i=0; i<streamsNameAndId.length; i++) {
                await stream.delete(teamId, { id: streamsNameAndId[i].id })
                const answer = `Stream ${streamsNameAndId[i].title} is deleted`
                await botPost(teamId, to, answer)
            }
        } else {
            const answer = 'There are no streams to delete'
            await botPost(teamId, to, answer)
        }
    }
// удаление только последнего стрима. Глючит иногда
    if (text.match(/d l s/)) {
        const streamsNameAndId = await nameList(teamId)
        // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
        if (streamsNameAndId.length != 0) {
            await stream.delete(teamId, { id: streamsNameAndId[streamsNameAndId.length - 1].id })
            const answer = `Stream ${streamsNameAndId[streamsNameAndId.length - 1].title} is deleted`
            await botPost(teamId, to, answer)
        } else {
            const answer = 'There are no streams to delete'
            await botPost(teamId, to, answer)
        }
    }
// запрос на удаление стрима по его названию
    if (text.match(/d s/)) {
        const streamsNameAndId = await nameList(teamId)
        // console.log('streamsNameAndId >>> ', streamsNameAndId)
        const answer = `Which stream would you like to delete? Please, type name from the list: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}`
        await botPost(teamId, to, answer)

        deleteStreamAskedFlag = true;
        // console.log("del stream: ", deleteStreamAskedFlag);
        // console.log("streamsNameAndId: \n", streamsNameAndId);
        return
    }
// Удаление стрима. Ответ
    if (deleteStreamAskedFlag) {
        // console.log("text: \n", text);
        const streamsNameAndId = await nameList(teamId)
        let check = streamsNameAndId.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        // console.log('check > ', check)
        if (check) {
            // console.log("Text of deleting stream is correct!")
            // console.log("streamNameToDelete > ", text)
            const response = await stream.delete(teamId, { id: check.id })
            if (response.code == 200) {
                const answer = `Stream named ${check.title} is deleted.`
                await botPost(teamId, to, answer)
                deleteStreamAskedFlag = false;
                return
            } else {
                const answer = `Some ERR: ${response.message}`
                await botPost(teamId, to, answer)
                return
            }
        } else {
            // console.log("noDay for read")
            const answer = `There are no stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(stream => {return stream.title})}.`

            await botPost(teamId, to, answer)
            return
        }
    }
// Запрос. Какой стрим переименовать?
    if (text.match(/r s/)) {
        const streamsNameAndId = await nameList(teamId)
        // console.log('streamsNameAndId >>> ', streamsNameAndId)
        const answer = `Which stream would you like to rename? Please, type name from the list: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}`
        await botPost(teamId, to, answer)

        renameStreamAskedFlag = true;
        // console.log("renameStreamAskedFlag: ", renameStreamAskedFlag);
        // console.log("streamsNameAndId: \n", streamsNameAndId);

        return
    }
// Переименование стрима. Ответ и запрос и снова ответ.
    if (renameStreamAskedFlag) {
        const streamsNameAndId = await nameList(teamId)
        checkStreamName = streamsNameAndId.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        // console.log('checkStreamName > ', checkStreamName)
        if (checkStreamName) {
            // console.log("Text of renaming stream is correct!")
            // console.log("streamNameToRename > ", text)
            const answer = `What new name would you like to set for ${checkStreamName}?`
            await botPost(teamId, to, answer)

            newNameAskedFlag = true;
            console.log("checkedNameSet: ", checkedNameSet);
            renameStreamAskedFlag = false
            return
        } else {
            console.log("noDay for read")
            const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}.`

            await botPost(teamId, to, answer)
            return
        }
        return
    }
// Получение нового имени и переименование
    if (newNameAskedFlag) {
        console.log("We are renaming");
        const response = await stream.setName(teamId, { id: checkStreamName.id, name: text })
            if (response.code == 200) {
                const answer = `Stream named ${checkStreamName.title} is renamed.`
                await botPost(teamId, to, answer)
                newNameAskedFlag = false;
                return
            } else {
                const answer = `Some ERR: ${response.message}`
                await botPost(teamId, to, answer)
                return
            }
        newNameAskedFlag = false;
    }
// Запрос. Выберите пользователя?
    if (text.match(/n u/)) {
        const users = await userList(teamId);
        // console.log("users:\n", users);
        const answer = `What user do you want to add? Choose from list, please. ${users.map(stream => {return "\n" + stream.title})}.`
        await botPost(teamId, to, answer);

        userAskedFlag = true;
        return;
    }
// Ответ. Проверка пользователя. Выберите стрим?
    if (userAskedFlag) {
        const users = await userList(teamId);
        const streamsNameAndId = await nameList(teamId)
        // console.log("streamsNameAndId:\n", streamsNameAndId);
        // проверка введенного имени на сответствие дному из списка пользователей.
        checkUserInput = users.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        // console.log('checkUserSet > ', checkUserSet)

        if (checkUserInput) {
            const answer = `Ok. What stream from the list below do you wish to add ${checkUserInput.title} to? ${streamsNameAndId.map(stream => {return "\n" + stream.title})}`
            await botPost(teamId, to, answer)
            userCheckedStreamAskedFlag = true
            userAskedFlag = false

            return
        } else {
            const answer = `There are no user like: ${text}. Please, type name of user from the list below: ${users.map(stream => {return "\n" + stream.title})}.`

            await botPost(teamId, to, answer)
            return
        }
    }
    // Ответ. Проверка стрима. Добавление пользователя в стрим.
    if (userCheckedStreamAskedFlag) {
        const streamsNameAndId = await nameList(teamId)
        // console.log("We are inside userCheckedStreamAskedFlag");
        // console.log("streamsNameAndId:\n", streamsNameAndId);
        checkStreamInput = streamsNameAndId.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        if (checkStreamInput) {
            const response = await stream.setUser(teamId, { id: checkStreamInput.id, userId: checkUserInput.id })
                if (response.code == 200) {
                    const answer = `${checkUserInput.title} has added to ${checkStreamInput.title}.`
                    await botPost(teamId, to, answer)
                    userCheckedStreamAskedFlag = false;
                    return
                } else {
                    const answer = `Some ERR: ${response.message}`
                    await botPost(teamId, to, answer)
                    return
                }
            userCheckedStreamAskedFlag = false;
        } else {
            // console.log("There are no stream like this")
            const answer = `There are no stream like: ${text}. Please, type name of stream from the list below: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}.`
            await botPost(teamId, to, answer)
            return
        }
    }
// Назначить пользователя админом стрима. Запрос. Какой стрим?
// Запрос. Какой стрим переименовать?
    if (text.match(/a u/)) {
        const streamsNameAndId = await nameList(teamId)
        // console.log('streamsNameAndId >>> ', streamsNameAndId)
        const answer = `Where do you going to set admin? Please, type name from the list: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}`
        await botPost(teamId, to, answer)
        adminStreamAskedFlag = true;
        // console.log("adminStreamAskedFlag: ", adminStreamAskedFlag);
        // console.log("streamsNameAndId: \n", streamsNameAndId);
        return
    }
// Переименование стрима. Ответ и запрос и снова ответ.
    if (adminStreamAskedFlag) {
        const streamsNameAndId = await nameList(teamId)

        checkStreamName = streamsNameAndId.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        // console.log('checkStreamName > ', checkStreamName)
        if (checkStreamName) {
            // console.log("Text of stream is correct!")
            // console.log("streamNameToSetAdmin > ", text)
            const usersListOfStream = await usersOfStreamList(teamId, checkStreamName.id)
            console.log("usersListOfStream:\n", usersListOfStream);
            const users = await userList(teamId);
            const answer = `What user would you like to set admin in ${checkStreamName.title}. List users to choose: ${usersListOfStream.map(stream => {return "\n" + stream})}. ?`
            await botPost(teamId, to, answer)

            userForAdminAskedFlag = true;
            console.log("userForAdminAskedFlag: ", userForAdminAskedFlag);
            adminStreamAskedFlag = false
            return
        } else {
            console.log("noDay for read")
            const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(stream => {return "\n" + stream.title})}.`
            await botPost(teamId, to, answer)
            return
        }
        return
    }
// Получение имени и назначение админа
    if (userForAdminAskedFlag) {
        const users = await userList(teamId);
        const usersListOfStream = await usersOfStreamList(teamId, checkStreamName.id)
        const streamsNameAndId = await nameList(teamId)
        // console.log("streamsNameAndId:\n", streamsNameAndId);
        // проверка введенного имени на сответствие дному из списка пользователей.
        checkUserInput = users.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        if (checkUserInput) {
            checkUserId = usersListOfStream.find(typeUser => {
                return typeUser && typeUser == checkUserInput.id
            })
            if (checkUserId) {
                console.log("We are inside admin Set");
                const response = await stream.setAdmin(teamId, { id: checkStreamName.id, userId: checkUserId.id })
                    if (response.code == 200) {
                        const answer = `User ${checkUserInput.title} has become the admin of ${checkStreamName.title}.`
                        await botPost(teamId, to, answer)
                        newNameAskedFlag = false;
                        return
                    } else {
                        const answer = `Some ERR: ${response.message}`
                        await botPost(teamId, to, answer)
                        return
                    }
                userForAdminAskedFlag = false;
            } else {
                const answer = `There are no users like ${text} in ${checkStreamName.title}.`
                await botPost(teamId, to, answer)
            }

        } else {
            const answer = `There are no users like ${text} in ${checkStreamName.title}.`
            await botPost(teamId, to, answer)
        }
    }

// создание треда хардкорно с полями предзаданными и случайным именем.
    if (text.match(/new thread/)) {
      let streamIn = await stream.read(teamId, { id: "5a5ca9748b3b170015b41734"})
      console.log("streamIn: ", streamIn);

      console.log("Число задач до создания новой заметки: ", streamIn.data[0].threadsSequence.length);
      const countThreads = streamIn.data[0].threadsSequence.length
      const status = streamIn.data[0].threadStatuses[0]
      console.log('status: ', status)

      const res = await thread.create(teamId, {
          statusId: status,
          streamId: "5a5ca9748b3b170015b41734",
          title: 'new thread ' + shortid.generate(),
          deadline: [null, 1231231231231],
          responsibleUserId: "5a3a587b19e9f8001fb1bf8b"
      })
      streamIn = await stream.read(teamId, { id: "5a5ca9748b3b170015b41734"})
      const threadIn = await thread.read(teamId, { id: streamIn.data[0].threadsSequence[countThreads - 1] })
      console.log("thread: ", threadIn );
      console.log("Число задач после создания новой заметки: ", streamIn.data[0].threadsSequence.length);
      console.log(`Новая задача с именем ${threadIn.data[0].title}`);
  }


})
