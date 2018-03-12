const common = require('./common');
const shortid = require('shortid');
const { MongoClient } = require('mongodb').MongoClient;
// const assert = require('assert');

const {
  nameList,
  botPost,
  userList,
  usersOfStreamList,
} = common;

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

async function streamFunction(teamId, to, text, comment, stream, contact) {
  // Connection URL
  const url = 'mongodb://localhost:27017';
  // Use connect method to connect to the server
  const mongoConnect = await MongoClient.connect(url);
  const db = mongoConnect.db('bot');
  const streamCollection = db.collection('streamCollection');
  const threadCollection = db.collection('threadCollection');

  //  help
  if (text.match(/help/i)) {
    const answer = 'help - show the command help\nc s - create stream (with random name)\ng l s - get last stream\ng a s - get all streams\nd a s - delete all streams\nd l s - delete last stream\nd s - delete stream (you chosen)\nr s - rename stream\nn u - new user (add to stream you chosen)';
    await botPost(teamId, to, answer, comment);
  }

  // создание стрима
  if (text.match(/s n/)) {
    const streamName = `stream_${shortid.generate()}`;
    // создание стрима
    const createdStream = await stream.create(teamId, {
      name: streamName,
      settings: {
        widgets:
          {
            Priority: { on: true, type: 'Priority' },
            DataTime: { on: true, type: 'DataTime' },
            Resposible: { on: true, type: 'Resposible' },
          },
      },
    });
    if (createdStream.code === 200) {
      const answer = `Stream named ${streamName}, \nwith id ${createdStream.data.id}\nis created.`;
      await botPost(teamId, to, answer, comment);
      // mongo создание документа.
      const streamToMongoDB = await stream.read(teamId, { id: createdStream.data.id });
      streamCollection.insert(streamToMongoDB.data[0]);
      // console.log('streamToMongoDB.settings:\n', streamToMongoDB.settings);
      return;
    }
    const answer = `Some ERR: ${createdStream.message}`;
    await botPost(teamId, to, answer, comment);
    return;
  }

  // получение id только что созданного стрима
  if (text.match(/g l s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    if (streamsNameAndId.length !== 0) {
      const answer = `The last stream is: ${streamsNameAndId[streamsNameAndId.length - 1].title}`;
      await botPost(teamId, to, answer, comment);
      return;
    }
    const answer = 'There are no last stream';
    await botPost(teamId, to, answer, comment);
  }

  // получение всех стримов
  if (text.match(/g a s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    if (streamsNameAndId.length !== 0) {
      const answer = `There are streams like these: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, answer, comment);
      return;
    }
    const answer = 'There are no streams to show';
    await botPost(teamId, to, answer, comment);
  }

  // удаление всех стримов
  if (text.match(/d a s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
    if (streamsNameAndId.length !== 0) {
      for (let i = 0; i < streamsNameAndId.length; i += 1) {
        await stream.delete(teamId, {
          id: streamsNameAndId[i].id,
        });
        const answer = `Stream ${streamsNameAndId[i].title} is deleted`;
        await botPost(teamId, to, answer, comment);
      }
      // mongoDB
      await streamCollection.remove({});
      await threadCollection.remove({});
      return;
    }
    const answer = 'There are no streams to delete';
    await botPost(teamId, to, answer, comment);
  }

  // удаление только последнего стрима.
  if (text.match(/d l s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("streamsNameAndId:\n", streamsNameAndId.length == 0);
    if (streamsNameAndId.length !== 0) {
      const response = await stream.delete(teamId, {
        id: streamsNameAndId[streamsNameAndId.length - 1].id,
      });
      if (response.code === 200) {
        const answer = `Stream ${streamsNameAndId[streamsNameAndId.length - 1].title} is deleted`;
        await botPost(teamId, to, answer, comment);
        // mongoDB
        const count = await streamCollection.count() - 1;
        // console.log('count:\n', count);
        const idToDelete = await streamCollection.find().skip(count).toArray();
        console.log('idToDelete[0]._id:\n', idToDelete[0]._id);
        await streamCollection.deleteOne({ _id: idToDelete[0]._id });
        await threadCollection.deleteMany({ streamId: idToDelete[0]._id });
        // console.log('streamDeleted:\n', streamDeleted);
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer, comment);
      return;
    }
    const answer = 'There are no streams to delete';
    await botPost(teamId, to, answer, comment);
  }

  // запрос на удаление стрима по его названию
  if (text.match(/d s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Which stream would you like to delete? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer, comment);

    deleteStreamAskedFlag = true;
    // console.log("del stream: ", deleteStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);
    return;
  }
  // Удаление стрима. Ответ
  if (deleteStreamAskedFlag) {
    // console.log("inside");
    const streamsNameAndId = await nameList(teamId, stream);
    const check = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('check > ', check)
    if (check) {
      // console.log("Text of deleting stream is correct!")
      // console.log("streamNameToDelete > ", text)
      const response = await stream.delete(teamId, {
        id: check.id,
      });
      if (response.code === 200) {
        const answer = `Stream named ${check.title} is deleted.`;
        await botPost(teamId, to, answer, comment);
        deleteStreamAskedFlag = false;
        // mongoDB
        // console.log('check.id:\n', check.id);
        await streamCollection.deleteOne({ _id: check.id });
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer, comment);
      return;
    }
    // console.log("noDay for read")
    const answer = `There are no stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => element.title)}.`;
    await botPost(teamId, to, answer, comment);
  }

  // Запрос. Какой стрим переименовать?
  if (text.match(/r s/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Which stream would you like to rename? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer, comment);

    renameStreamAskedFlag = true;
    // console.log("renameStreamAskedFlag: ", renameStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);

    return;
  }
  // Переименование стрима. Ответ и запрос и снова ответ.
  if (renameStreamAskedFlag) {
    const streamsNameAndId = await nameList(teamId, stream);
    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkStreamName > ', checkStreamName)
    if (checkStreamName) {
      // console.log("Text of renaming stream is correct!")
      // console.log("streamNameToRename > ", text)
      const answer = `What new name would you like to set for ${checkStreamName.title}?`;
      await botPost(teamId, to, answer, comment);

      newNameAskedFlag = true;
      // console.log('newNameAskedFlag: ', newNameAskedFlag);
      renameStreamAskedFlag = false;
      return;
    }
    // console.log('noDay for read');
    const answer = `There are not stream like: ${text}. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;

    await botPost(teamId, to, answer, comment);
    return;
  }
  // Получение нового имени и переименование
  if (newNameAskedFlag) {
    // console.log("We are renaming");
    const response = await stream.setName(teamId, {
      id: checkStreamName.id,
      name: text,
    });
    if (response.code === 200) {
      const answer = `Stream named ${checkStreamName.title} is renamed.`;
      await botPost(teamId, to, answer, comment);
      newNameAskedFlag = false;
      // mongoDB
      await streamCollection.update({ _id: checkStreamName.id }, { $set: { name: text } });
      return;
    }
    const answer = `Some ERR: ${response.message}`;
    await botPost(teamId, to, answer, comment);
    newNameAskedFlag = false;
  }

  // Запрос. Выберите пользователя?
  if (text.match(/n u/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("users:\n", users);
    const answer = `Where do you want to add user? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);

    streamAskedFlag = true;
    return;
  }
  // Ответ. Проверка пользователя. Выберите стрим?
  if (streamAskedFlag) {
    const users = await userList(teamId, contact);
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log("streamsNameAndId:\n", streamsNameAndId);
    // проверка введенного имени на сответствие дному из списка пользователей.
    checkStreamInput = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkUserSet > ', checkUserSet)

    if (checkStreamInput) {
      const answer = `Ok. What user from the list below do you wish to add to ${checkStreamInput.title}? ${users.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, answer, comment);
      streamCheckedUserAskedFlag = true;
      streamAskedFlag = false;

      return;
    }
    const answer = `There are no stream like: ${text}. Please, type name of user from the list below: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;

    await botPost(teamId, to, answer, comment);
    return;
  }
  // Ответ. Проверка стрима. Добавление пользователя в стрим.
  if (streamCheckedUserAskedFlag) {
    const users = await userList(teamId, contact);
    // console.log("We are inside streamCheckedUserAskedFlag");
    // console.log("streamsNameAndId:\n", streamsNameAndId);
    checkUserInput = users.find(typeUser => typeUser && typeUser.title === text);
    if (checkUserInput) {
      const response = await stream.setUser(teamId, {
        id: checkStreamInput.id,
        userId: checkUserInput.id,
      });
      if (response.code === 200) {
        const answer = `${checkUserInput.title} has added to ${checkStreamInput.title}.`;
        await botPost(teamId, to, answer, comment);
        streamCheckedUserAskedFlag = false;
        // mongoDB
        await streamCollection.update(
          { _id: checkStreamInput.id },
          { $push: { roles: checkUserInput.id } },
        );
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, answer, comment);
      streamCheckedUserAskedFlag = false;
      return;
    }
    // console.log("There are no stream like this")
    const answer = `There are no user like: ${text}. Please, type name of user from the list below: ${users.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
  }

  // Назначить пользователя админом стрима. Запрос. Какой стрим?
  // Запрос. Какой стрим переименовать?
  if (text.match(/a u/)) {
    const streamsNameAndId = await nameList(teamId, stream);
    // console.log('streamsNameAndId >>> ', streamsNameAndId)
    const answer = `Where do you going to set admin? Please, type name from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer, comment);
    adminStreamAskedFlag = true;
    // console.log("adminStreamAskedFlag: ", adminStreamAskedFlag);
    // console.log("streamsNameAndId: \n", streamsNameAndId);
    return;
  }
  // Переименование стрима. Ответ и запрос и снова ответ.
  if (adminStreamAskedFlag) {
    const streamsNameAndId = await nameList(teamId, stream);

    checkStreamName = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkStreamName > ', checkStreamName)
    if (checkStreamName) {
      // console.log("Text of stream is correct!")
      // console.log("streamNameToSetAdmin > ", text)
      const usersListOfStream = await usersOfStreamList(
        teamId,
        stream,
        contact,
        checkStreamName.id,
      );
      // console.log("usersListOfStream:\n", usersListOfStream);
      const answer = `What user would you like to set admin in <${checkStreamName.title}>. List users to choose: ${usersListOfStream.map(element => `\n${element.title}`)}?`;
      await botPost(teamId, to, answer, comment);

      userForAdminAskedFlag = true;
      // console.log("userForAdminAskedFlag: ", userForAdminAskedFlag);
      adminStreamAskedFlag = false;
      return;
    }
    // console.log("noDay for read")
    const answer = `There are not stream like: <${text}>. Please, type name of stream from the list: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, answer, comment);
    return;
  }
  // Получение имени и назначение админа
  if (userForAdminAskedFlag) {
    const streamForAdmin = await stream.read(teamId, { id: checkStreamName.id });
    const usersListOfStream = await usersOfStreamList(teamId, stream, contact, checkStreamName.id);
    // проверка введенного имени на сответствие одному из списка пользователей.
    checkUserInput = usersListOfStream.find(typeUser => typeUser && typeUser.title === text);
    if (checkUserInput) {
      const checker = streamForAdmin.data[0].admins.find(element => element === checkUserInput.id);
      if (!checker) {
        // console.log('checkUserInput.id ==\n', checker);
        // Проверка прошла успешно. Делаем пользователя админом.
        // console.log('We are inside admin Set');
        const response = await stream.setAdmin(teamId, {
          id: checkStreamName.id,
          userId: checkUserInput.id,
        });
        if (response.code === 200) {
          const answer = `User ${checkUserInput.title} has become the admin of ${checkStreamName.title}.`;
          await botPost(teamId, to, answer, comment);
          newNameAskedFlag = false;
          // mongoDB
          const checkAdmin = await streamCollection.find({
            _id: checkStreamName.id,
            admins: checkUserInput.id,
          }).toArray();
          // console.log('checkAdmin:\n', checkAdmin);
          if (checkAdmin.length === 0) {
            await streamCollection.update(
              { _id: checkStreamName.id },
              { $push: { admins: checkUserInput.id } },
            );
          }
          return;
        }
        const answer = `Some ERR: ${response.message}`;
        await botPost(teamId, to, answer, comment);
        userForAdminAskedFlag = false;
        return;
      }
      const answer = `There is admin like ${text} in ${checkStreamName.title}.`;
      await botPost(teamId, to, answer, comment);
      return;
    }
    const answer = `There are no users like ${text} in ${checkStreamName.title}. Please, choose user from the list: ${usersListOfStream.map(element => `\n${element.title}`)}`;
    await botPost(teamId, to, answer, comment);
  }
  // console.log([4, 6, 8, 12].find(element => element && element === 6));
}

module.exports = streamFunction;
