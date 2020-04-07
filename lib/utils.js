let util = require('util'),
  fs = require('fs'),
  Task = require('data.task'),
  Either = require('data.either'),
  { sequence, curry, compose, is } = require('ramda');

require('isomorphic-fetch');

const noop = () => {};
const log = res => console.log(util.inspect(res, false, null));

// For debugging in a compose
const trace = x => {
  console.log('>>> ', x);
  return x;
};

// 1 Just getting an array w/ unique values using a object/keys then getting the keys
const keys = obj => Object.keys(obj);
// 2
const createObjectKeyMap = curry((key, arry) =>
  arry.reduce((acc, el) => {
    acc[el[key]] = 1;
    return acc;
  }, {})
);
// 3
const getUniqueKeys = (key, arry) =>
  compose(keys, createObjectKeyMap(key))(arry);

// eitherToTask :: Either -> Task
const eitherToTask = either => either.fold(Task.rejected, Task.of);

const concatUnique = (x, ys) =>
  Either.fromNullable(ys.filter(y => y === x)[0]).fold(
    () => ys.concat(x),
    y => ys
  );

const dynamicSortObjArry = property => (a, b) =>
  a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;

// getDateAsSeconds :: Object -> Number
const dateObjToSeconds = ({ year, month, day }) =>
  new Date(year, month, day).valueOf() / 1000;

const formatSecondsToDate = seconds =>
  new Date(parseInt(seconds * 1000)).toLocaleDateString();

const formatSecondsToDateObj = seconds => new Date(parseInt(seconds * 1000));

const getMatchDates = str =>
  str.match(
    /\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/gi
  );

const getMatchTimes = str => str.match(/(\d{1,2})\s*:\s*(\d{2})\s*([ap]m?)/gi);

const hrTo24 = (hr, pm) => {
  hr = parseInt(hr);
  let fhr = (hr === 12 ? 0 : hr) + (pm ? 12 : 0);
  if (fhr < 10) {
    fhr = '0' + fhr;
  }
  return fhr;
};

const formatSecondsToHHMM = seconds => {
  let d = Number(seconds),
    h = Math.floor(d / 3600),
    m = Math.floor((d % 3600) / 60);
  return (h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m;
};

// Convert one of these 9:00 AM, 5:00 PM to 09:00 or 17:00
const convertTimeStrToHourStr = (str, is24 = true) => {
  let parts = str.toLowerCase().split(' '),
    time = parts[0].split(':'),
    hr = is24 ? hrTo24(time[0], parts[1] === 'pm') : time[0];
  return [hr, time[1]].join(':');
};

const formatSecDurationToStr = seconds => {
  let hhmm = formatSecondsToHHMM(seconds),
    split = hhmm.split(':'),
    tothrs = parseInt(split[0]),
    days = Math.floor(tothrs / 8),
    hrs = tothrs % 8,
    mins = parseInt(split[1]);

  return (
    (days ? days + ' days' : '') +
    (hrs ? ' ' + hrs + ' hrs' : '') +
    (mins ? ' ' + mins + ' mins' : '')
  );
};

// http://www.techrepublic.com/article/convert-the-local-time-to-another-time-zone-with-this-javascript/
const convertDateToTimeZone = (date, offset) => {
  let dlocalTime = date.getTime(),
    dlocalOffset = date.getTimezoneOffset() * 60000,
    dutcMS = dlocalTime + dlocalOffset,
    targetzonemc = dutcMS + 3600000 * offset;

  return new Date(targetzonemc);
};

const validateEmail = email => {
  let regex = /.+@.+/;
  return regex.test(email);
};

// HTML tags
const removeTagsStr = str => str.replace(/(<([^>]+)>)/gi, '');
// carriage returns and line feeds
const removeCRLFStr = str => str.replace(/(\r\n|\n|\r)/gi, ' ');
// HTML entities
const removeEntityStr = str =>
  str.replace(/(&(#?)(?:[a-z\d]+|#\d+|#x[a-f\d]+);)/gi, '');

// removeHTML :: String -> String
const removeHTML = str =>
  Either.fromNullable(str)
    .map(removeEntityStr)
    .map(removeTagsStr)
    .map(removeCRLFStr)
    .fold(
      () => '',
      s => s
    );

/*
 Turn an object of {key1:value1, key2:value2, ...} into paramname=value[&...]
 Only works on shallow objects
 */
// acc += (idx > 0 ? '&' : '') + key + '=' + encodeURIComponent(objArry[key]);
const parameterize = objArry =>
  Object.keys(objArry)
    .reduce(
      (acc, key) => {
        acc.push(key + '=' + encodeURIComponent(objArry[key]));
        return acc;
      },
      ['?']
    )
    .join('&');

// Chain an array of Tasks in to one task
const chainTasks = taskArry => sequence(Task.of, taskArry);

const runTask = task => task.fork(console.warn, log);

const runTaskTime = (label, output, task) => {
  console.time(label);
  task.fork(console.warn, r => {
    console.timeEnd(label);
    if (output) {
      log(r);
    }
  });
};

const writefile = (text, fileName = 'debug.log') => {
  let log_file = fs.createWriteStream(__dirname + '/' + fileName, {
      flags: 'w'
    }),
    log_stdout = process.stdout;
  log_file.write(util.format(text) + '\n');
  //log_stdout.write(util.format(text) + '\n');
};

const writeTask = task =>
  task.fork(console.warn, res => {
    writefile(JSON.stringify(res));
    log(res);
    console.log('File written!');
  });

let anonymousCounter = 1;
let anonymousMap = {};

// Create a simple fake name. Stores the input name to a map so that you get back
// the same fake name each time you call it for a given input name
const anonymizeName = name => {
  if (anonymousMap.hasOwnProperty(name)) {
    return anonymousMap[name];
  }

  let next = anonymousCounter++,
    firstName = 'FirstName' + next,
    lastName = 'LastName' + next,
    fullName = [firstName, lastName].join(' '),
    email = `${lastName.toLowerCase()}@company.com`,
    mbox = `mailto:${email}`; //xapi style mbox

  anonymousMap[name] = { firstName, lastName, fullName, email, mbox };

  return anonymousMap[name];
};

// "Simplify" and anonymize LRS statements
const anonymizeStatements = (arry, key = 'name') =>
  arry.map(statement => {
    let { actor, verb, object, id, timestamp, stored, version } = statement,
      anonymized = anonymizeName(actor[key]);

    actor.name = anonymized.fullName;
    actor.mbox = anonymized.mbox;

    return {
      actor,
      verb,
      object,
      id,
      timestamp,
      stored,
      version
    };
  });

module.exports = {
  noop,
  log,
  runTask,
  runTaskTime,
  writefile,
  writeTask,
  anonymizeName,
  anonymizeStatements,
  trace,
  getUniqueKeys,
  dynamicSortObjArry,
  removeHTML,
  dateObjToSeconds,
  formatSecondsToDate,
  formatSecondsToDateObj,
  formatSecDurationToStr,
  convertTimeStrToHourStr,
  getMatchDates,
  getMatchTimes,
  parameterize,
  chainTasks,
  validateEmail
};
