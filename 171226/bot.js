/*jshint esversion: 6 */
const botClient = require('bot-client');

// только что созданные вами авторизационные данные
const creds = {
  email: "",
  password: ""
}; 
var newNote = false;
var dayForCreate = false;
var dayWeek;
var dayForGet = false;
const week = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

var notes = {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
}

const { comment } = botClient.connect(creds)

// оптимизация. Функция, которая повторялась. Она единственная асинхронная.
async function botPost (teamId, to, answer) {
    const att = [{ type: 'text', data: { text: answer } }]
    await comment.create(teamId, { to, att })
}

comment.onDirect(async message => {
  // когда кто-то напишет вам личное сообщение
  // будет работать этот коллбек
  console.log('ON_DIRECT', message)
  const { teamId } = message
  const to = message.data.content.from
  const { data: { text}} = message.data.content.att[0]

// help
  if (text.match(/help/i)) {
      const answer = "help - выводит это сообщение\nnew - создает новую заметку\nweek - показать все заметки за неделю\nday - показать все заметки за день."

      await botPost(teamId, to, answer)
      return
  }


// Новая заметка
  if (text.match(/new/i)) {
      const answer = "What day of week will you write note in? (mon,tue,wed,thu,fri,sat,sun)"
      newNote = true // сигнал для включения
      console.log("new: ", newNote)
      await botPost(teamId, to, answer)
      return
  }
  // Проверка ввода дня
  if (newNote) {

      if (week.indexOf(text) != -1) {

          console.log("Text of day is correct!");

          dayWeek = week[week.indexOf(text)];
          dayForCreate = true;
          newNote = false;

          console.log("dayWeek > ", dayWeek);

          const answer = `Ok, you've chosen ${dayWeek}. What note will you write on ${dayWeek}?`;

          await botPost(teamId, to, answer);
          return;
      } else {
          console.log("noDay");
          const answer = `It is not correct written. Please, type day from the list: (mon,tue,wed,thu,fri,sat,sun).`;

          await botPost(teamId, to, answer);
          return;
      }
  }
// Создание заметки и вывод того, что создано
  if (dayForCreate) {
      notes[dayWeek].push(text);
      dayForCreate = false;
            // notes.mon.push()
      console.log("notes.dayWeek > ", notes[dayWeek]);
      console.log("notes > \n", notes);

      const answer = `New ${dayWeek}'s note is: \n> ${notes[dayWeek][notes[dayWeek].length - 1]}`;

      await botPost(teamId, to, answer);
      return;
  }
  // Вывод всех заметок за неделю. Запрос и ответ.
  if (text.match(/week/i)) {
      const answer = `All notes of week are: \n${Object.keys(notes).map(key => {
          if (notes[key].length) {
              return `${key}: ${notes[key].join(`, `)}`;
          }
          return `${key}: There are no notes.`;
      }).join(`\n`)}`;

      await botPost(teamId, to, answer);
  }
  // Вывод всех заметок за один день. Запрос
  if (text.match(/day/i)) {
      const answer = "What day of week do you wish to read notes? (mon,tue,wed,thu,fri,sat,sun)";
      dayForGet = true; // сигнал для включения

      console.log("dayForGet: ", dayForGet)

      await botPost(teamId, to, answer)
      return
  }

// Вывод всех заметок за один день. Ответ
if (dayForGet) {
    if (week.indexOf(text) != -1) {
        console.log("Text of day is correct!")

        dayWeek = week[week.indexOf(text)]
        dayForGet = false

        console.log("dayWeek > ", dayWeek)

        const answer = `Notes of \n${dayWeek}: ${notes[dayWeek].length ? notes[dayWeek].join(', ') : 'empty'}.`

        await botPost(teamId, to, answer)
        return
    } else {
        console.log("noDay for read")
        const answer = `It is not correct written. Please, type day from the list: (mon,tue,wed,thu,fri,sat,sun).`

        await botPost(teamId, to, answer)
        return
    }
}
})
