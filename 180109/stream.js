/*jshint esversion: 6 */
const botClient = require('bot-client');
const shortid = require('shortid');
// только что созданные вами авторизационные данные
const creds = {
  email: "",
  password: ""
};

var delStream = false;
var res;
var checkId = false;
var streamNamesIdFlag = false;
var allNames;
var randomName;
var check;

const { comment, stream, thread } = botClient.connect(creds);

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
            let objectStream = {}
            objectStream.title = allStreams.data[i].name
            objectStream.id = allStreams.data[i]._id
            nameList.push(objectStream)
        }
    }
    return nameList
}

// Функция для обработки ответов пользователя.
// async function requestResponse (paramGet, text, firstAsk, errorAsk, confirm) {
//     const answer = firstAsk
//     await botPost(teamId, to, answer)
//
//     let matching = await text.match(/paramGet/i)
//     if (matching == paramGet) {
//         const answer = confirm
//         await botPost(teamId, to, answer)
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
// test
  // let allNames = await stream.read(teamId, {})
  // console.log("all names:\n", allNames.data[1].name );

// создание стрима
    if (text.match(/c s/)) {
      //  генератор случайной строки
            // if ( var a !== 3) {
            //     console.log(shortid.generate());
            //     randomName = shortid.generate()
            //     a++;
            // }
            const name = 'stream_' + shortid.generate()
            // создание стрима
            res = await stream.create(teamId, { name: name })
            // вывод в консоль
            console.log('create stream:\n', res)
            // мой ответ бота
            const answer = `Stream named ${name}, \nwith id ${res.data.id}\nis created.`
            await botPost(teamId, to, answer)
            return
        }
// получение id только что созданного стрима
    if (text.match(/g l s/)) {
      //  получение объекта стрим
        const resGet = await stream.read(teamId, { id: res.data.id })
      // сообщение в консоль
        console.log('read stream:\n', resGet)
      // сообщение бота
        const answer = `Getting stream with id ${res.data.id}...`
        await botPost(teamId, to, answer)
        return
    }
// получение всех стримов
    if (text.match(/g a s/)) {
      // получение всех стримов
        const resGet = await stream.read(teamId, {})

        console.log('read stream:\n', resGet)

        const answer = `Getting streams...`
        await botPost(teamId, to, answer)

        return
    }
// удаление всех стримов
    if (text.match(/d a s/)) {
        // получение всех стримов
        let allStreams = await stream.read(teamId, {})
        console.log("allStreams:\n", allStreams);
        console.log("allStreams.data.length:\n", allStreams.data.length);
        // удаление всех стримов бота с определенным id
        for (var i=0; i<allStreams.data.length; i++) {
         // в условии только админы с уникальным id
            if (allStreams.data[i].admins[0] == '5a3a587b19e9f8001fb1bf8b') {
                console.log("allStreams.data.id:\n", allStreams.data[i]._id);
                await stream.delete(teamId, { id: allStreams.data[i]._id })
            }
        }

        console.log('Streams of hello@bot are deleted')
        return
    }
// удаление только последнего стрима. Глючит иногда
    if (text.match(/d l s/)) {

        let allStreams = await stream.read(teamId, {})
        console.log("allStreams:\n", allStreams);
        console.log("allStreams.data.length:\n", allStreams.data.length);
        // удаление всех стримов бота с определенным id
        for (var i=allStreams.data.length - 1; i>0; i--) {
            // в условии только админы с уникальным id
            console.log(`allStreams.data.admins:\n`, i, " = ", allStreams.data[i].admins[0]);
                if (allStreams.data[i].admins[0] == '5a3a587b19e9f8001fb1bf8b') {
                    console.log("allStreams.data.id to delete:\n",i, " = ", allStreams.data[i]._id);
                    await stream.delete(teamId, { id: allStreams.data[i]._id })
                    console.log("deleted allStreams.data.id:\n", allStreams.data[i]._id);
                    console.log("allStreams:\n", allStreams);
                    console.log("allStreams.data.length:\n", allStreams.data.length)
                    break
                }
            }

            console.log('Last stream of hello@bot are deleted')
            return
    }
// запрос на удаление стрима по его названию
    if (text.match(/d s/)) {

        const streamNamesId = await nameList(teamId)
        // console.log('streamNamesId >>> ', streamNamesId)
        const answer = `Which stream would you like to delete? Please, type name from the list: ${streamNamesId.map(stream => {return "\n" + stream.title})}`
        await botPost(teamId, to, answer)

        delStream = true;
        // console.log("del stream: ", delStream);
        // console.log("streamNamesId: \n", streamNamesId);

        return
    }
// Удаление стрима. Ответ
    if (delStream) {
        // console.log("text: \n", text);
        const streamNamesId = await nameList(teamId)
        let check = streamNamesId.find(typeUser => {
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
                delStream = false;
                return
            } else {
                const answer = `Some ERR: ${response.message}`
                await botPost(teamId, to, answer)
                return
            }
        } else {
            // console.log("noDay for read")
            const answer = `There are no stream like: ${text}. Please, type name of stream from the list: ${streamNamesId.map(stream => {return stream.title})}.`

            await botPost(teamId, to, answer)
            return
        }
    }
// переименование стрима по запросу пользователя
    if (text.match(/n s/)) {
        const streamNamesId = await nameList(teamId)
        // console.log('streamNamesId >>> ', streamNamesId)
        const answer = `Which stream would you like to rename? Please, type name from the list: ${streamNamesId.map(stream => {return "\n" + stream.title})}`
        await botPost(teamId, to, answer)

        streamNamesIdFlag = true;
        // console.log("streamNamesIdFlag: ", streamNamesIdFlag);
        console.log("streamNamesId: \n", streamNamesId);

        return
    }

// Переименование стрима. Ответ и запрос и снова ответ.
    if (streamNamesIdFlag) {
        console.log("text: \n", text);
        const streamNamesId = await nameList(teamId)

        check = streamNamesId.find(typeUser => {
            return typeUser && typeUser.title == text
        })
        console.log('check > ', check)

        if (check) {

            console.log("Text of renaming stream is correct!")
            console.log("streamNameToRename > ", text)

            const answer = "Input new name for chosen stream"
            await botPost(teamId, to, answer)

            checkId = true;
            console.log("checkId: ", checkId);
            streamNamesIdFlag = false
            return
        } else {
            console.log("noDay for read")
            const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamNamesId.map(stream => {return "\n" + stream.title})}.`

            await botPost(teamId, to, answer)
            return
        }
        return
    }

// Получение нового имени и Удаление
    if (checkId) {
        console.log("We are inside checkId");
        const response = await stream.setName(teamId, { id: check.id, name: text })
            if (response.code == 200) {
                const answer = `Stream named ${check.title} is renamed.`
                await botPost(teamId, to, answer)
                delStream = false;
                return
            } else {
                const answer = `Some ERR: ${response.message}`
                await botPost(teamId, to, answer)
                return
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
