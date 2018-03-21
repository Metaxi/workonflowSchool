const langs = require('google-translate-api/languages');

const common = require('./common');

const {
  translator, botPost, nameList, botList,
} = common;

let checkStreamInput;

async function direct(
  userId,
  teamId,
  to,
  comment,
  streamId,
  threadId,
  text,
  userCollection,
  botCollection,
  stream,
  contact,
) {
  // take list of langs
  const rawLangs = Object.entries(langs);
  const langKeysValues = rawLangs.slice(0, rawLangs.length - 2);

  // // mongodb, create default lang object settings.
  // const userSettingDefault = await userCollection.find({ user: userId }).toArray();
  // if (userSettingDefault.length === 0) {
  //   await userCollection.insert({
  //     user: userId,
  //     from: 'auto',
  //     to: 'en',
  //     streams: [],
  //   });
  // }
  // mongodb. create default state object settings.
  const botSetting = await botCollection.find({ user: userId }).toArray();
  console.log('botSettingD:\n', botSetting);
  // if (botSetting.length === 0) {
  //   await botCollection.insert({
  //     user: userId,
  //     general: false,
  //     translate: true,
  //     help: false,
  //     current: false,
  //     source: false,
  //     target: false,
  //     addStreamAsked: false,
  //     addUserAsked: false,
  //     streams: [],
  //   });
  // }
  // Запрос. Выберите пользователя?
  if (text.match(/n u/)) {
    // mongodb, state update
    if (!botSetting[0].general) {
      await botCollection.update(
        { user: userId },
        { $set: { general: true, translate: false } },
      );
      const streamsNameAndId = await nameList(teamId, stream, userId);
      // console.log('streamsNameAndId:\n', streamsNameAndId);
      const answer = `What stream would you like to add bot? Choose stream from list, please. ${streamsNameAndId.map(element => `\n${element.title}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. state update
      await botCollection.update({ user: userId }, { $set: { addStreamAsked: true } });
      return;
    }
  }
  // Ответ. Проверка пользователя. Выберите стрим?
  if (botSetting[0].general && botSetting[0].addStreamAsked) {
    const users = await botList(teamId, contact);
    const streamsNameAndId = await nameList(teamId, stream, userId);
    // console.log('streamsNameAndId:\n', streamsNameAndId);
    // проверка введенного имени на сответствие дному из списка пользователей.
    checkStreamInput = streamsNameAndId.find(typeUser => typeUser && typeUser.title === text);
    // console.log('checkUserSet > ', checkUserSet)
    if (checkStreamInput) {
      const answer = `Ok. What user from the list below do you wish to add to ${checkStreamInput.title}? ${users.map(element => `\n${element.title}`)}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. state update
      await botCollection
        .update({ user: userId }, { $set: { addStreamAsked: false, addUserAsked: true } });
      return;
    }
    const answer = `There are no stream like: ${text}. Please, type name of user from the list below: ${streamsNameAndId.map(element => `\n${element.title}`)}.`;

    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }
  // Ответ. Проверка пользователя. Добавление пользователя в стрим.
  if (botSetting[0].general && botSetting[0].addUserAsked) {
    const users = await botList(teamId, contact);
    // console.log("We are inside streamCheckedUserAskedFlag");
    // console.log("streamsNameAndId:\n", streamsNameAndId);
    const checkUserInput = users.find(typeUser => typeUser && typeUser.title === text);
    if (checkUserInput) {
      const response = await stream.setUser(teamId, {
        id: checkStreamInput.id,
        userId: checkUserInput.id,
      });
      if (response.code === 200) {
        const answer = `${checkUserInput.title} has added to ${checkStreamInput.title}.`;
        await botPost(teamId, to, comment, streamId, threadId, answer);
        // mongo. state update
        await botCollection.update(
          { user: userId },
          { $set: { addUserAsked: false, general: false, translate: true } },
        );
        return;
      }
      const answer = `Some ERR: ${response.message}`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. state update
      await botCollection.update(
        { user: userId },
        { $set: { addUserAsked: false, general: false, translate: true } },
      );
      return;
    }
    // console.log("There are no stream like this")
    const answer = `There are no user like: ${text}. Please, type name of user from the list below: ${users.map(element => `\n${element.title}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }

  if (text.match(/t h/i)) {
    // mongo. state update
    if (!botSetting[0].general && !botSetting[0].help) {
      await botCollection.update(
        { user: userId },
        { $set: { general: true, help: true, translate: false } },
      );
      // Мануал
      const answer = 't h (translator help) - show this manual.\nt s l (translator source set) - set source language of bot translator.\nt t l (translator target set) - set target language of bot translator.\nt c s (translator current settings) - show current language settings.';
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. state update
      await botCollection.update(
        { user: userId },
        { $set: { general: false, help: false, translate: true } },
      );
      return;
    }
  }

  // Какие настройки сейчас?
  if (text.match(/t c s/i)) {
    // mongo. state update
    if (!botSetting[0].general && !botSetting[0].current) {
      await botCollection.update(
        { user: userId },
        { $set: { general: true, current: true, translate: false } },
      );
      // Какие настройки сейчас?
      const userSetting = await userCollection.find({ user: userId }).toArray();
      const [, toSetHuman] = langKeysValues
        .find(element => element && element[0] === userSetting[0].to);
      const [, fromSetHuman] = langKeysValues
        .find(element => element && element[0] === userSetting[0].from);
      const answer = `Current bot translator settings: \nsource language is ${fromSetHuman},\ntarget language is ${toSetHuman}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb, state update
      await botCollection.update(
        { user: userId },
        { $set: { general: false, current: false, translate: true } },
      );
      return;
    }
  }

  // translate bot settings. С какого языка?
  if (text.match(/t s l/i)) {
    // mongodb, state update
    if (!botSetting[0].general) {
      await botCollection.update(
        { user: userId },
        { $set: { general: true, translate: false } },
      );
      const answer = `What source language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. state update
      await botCollection.update({ user: userId }, { $set: { source: true } });
      return;
    }
  }
  // Проверка введенного языка. Установка языка источника.
  if (botSetting[0].general && botSetting[0].source) {
    const checkedFromLanguage = langKeysValues.find(element => element && element[1] === text);
    if (checkedFromLanguage) {
      const answer = `Source language is changed to <${checkedFromLanguage[1]}>`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongo. lang update.
      await userCollection.update({ user: userId }, { $set: { from: checkedFromLanguage[0] } });
      // mongodb, state update.
      await botCollection.update(
        { user: userId },
        { $set: { general: false, source: false, translate: true } },
      );
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of source language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }

  // translate bot settings. На какой язык?
  if (text.match(/t t l/i)) {
    // mongo. state update
    if (!botSetting[0].general) {
      await botCollection.update(
        { user: userId },
        { $set: { general: true, translate: false } },
      );
      const answer = `What target language would you set? Please, send me name of language from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb, state update.
      await botCollection.update({ user: userId }, { $set: { target: true } });
      return;
    }
  }
  // Проверка введенного языка. Установка целевого языка.
  if (botSetting[0].general && botSetting[0].target) {
    const checkedToLanguage = langKeysValues.find(element => element && element[1] === text);
    // console.log('checkedToLanguage: ', checkedToLanguage);
    if (checkedToLanguage) {
      const answer = `Target language is changed to <${checkedToLanguage[1]}>`;
      await botPost(teamId, to, comment, streamId, threadId, answer);
      // mongodb. lang update.
      await userCollection.update({ user: userId }, { $set: { to: checkedToLanguage[0] } });
      // mongodb, state update
      await botCollection.update(
        { user: userId },
        { $set: { general: false, target: false, translate: true } },
      );
      return;
    }
    const answer = `<${text}> is not correct input for me (bot). Please, send me correct name of target language exactly from the list:\n${langKeysValues.map(element => ` ${element[1]}`)}.`;
    await botPost(teamId, to, comment, streamId, threadId, answer);
    return;
  }

  // переводчик
  if (botSetting[0].translate) {
    // Если в монго установлены языки для данного пользователя, то берем параметры оттуда.
    const userSettings = await userCollection.find({ user: userId }).toArray();
    // console.log('isObject[0]:\n', isObject[0]);
    const fromSet = userSettings[0].from;
    const toSet = userSettings[0].to;
    // console.log('fromSet', fromSet);
    // console.log('toSet', toSet);
    const answer = await translator(text, fromSet, toSet);
    await botPost(teamId, to, comment, streamId, threadId, answer);
  }
}

module.exports = direct;
