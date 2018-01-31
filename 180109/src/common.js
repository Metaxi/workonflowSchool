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
// Функция дает боту постить сообщение, которое ему передается.
async function botPost(teamId, to, answer, comment) {
  const att = [{
    type: 'text',
    data: {
      text: answer,
    },
  }];
  await comment.create(teamId, {
    to,
    att,
  });
}
// Функция получения всех статусов стрима
async function statusList(teamId, status, id) {
  const statusOfStream = await status.read(teamId, { streamId: id });
  // console.log("userList: \n", userList.data[0].basicData);
  const statuses = [];
  for (let i = 0; i < statusOfStream.data.length; i += 1) {
    // в условии только админы с уникальным id
    const objectStream = {};
    objectStream.title = statusOfStream.data[i].name;
    objectStream.id = statusOfStream.data[i]._id;
    statuses.push(objectStream);
  }
  return statuses;
}
// Функция получения списка всех пользователей и вывод списка из трех параметров.
async function userList(teamId, contact) {
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
async function usersOfStreamList(teamId, stream, contact, streamId) {
  const oneStream = await stream.read(teamId, { id: streamId });
  const allUsers = await userList(teamId, contact);
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

module.exports = {
  nameList,
  botPost,
  statusList,
  userList,
  usersOfStreamList,
};
