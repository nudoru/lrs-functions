let Task = require('data.task'),
  { curry, concat } = require('ramda'),
  config = require('./secrets.json'),
  {
    createStatement,
    sendStatement,
    sendFragment,
    createAgentEmailQuery,
    requestStatements,
    requestAllStatements,
    requestAggregate,
    createAggregateQuery,
  } = require('./lib/learningservices/LRS'),
  {
    actorMBox,
    verbIdsAny,
    dateRange,
    match,
    project,
    sortDsc,
    simpleGroup,
  } = require('./lib/learningservices/AggregateStages'),
  {
    log,
    noop,
    runTask,
    runTaskTime,
    writefile,
    writeTask,
  } = require('./lib/utils');

/*
Agregate queries



{
      $match: {
        "statement.actor.mbox": "mailto:mperkins@redhat.com"
      }
    }
*/

const queryStatements = () => {
  let vquery = createAggregateQuery([
    project,
    match([
      actorMBox('mperkins@redhat.com'),
      dateRange('2019-03-25', '2020-03-31'),
    ]),
    sortDsc,
    simpleGroup,
  ]);

  runTask(requestAggregate(config, vquery));
};

//setLRSOptions(config);
// sendTestStatement();
queryStatements();

//['statement.verb.display.en-US']: 'loggedin'

// console.log(createAggregateQuery({['statement.verb.display.en-US']: 'completed'}))

// Will extract and write all statements from the given LRS store
// writeTask(requestAggregate(config.webservice.lrs, createAggregateQuery()));

// writeTask(requestAggregate(config.webservice.lrs, createAggregateQuery({
//  ['statement.actor.mbox']        : 'mailto:mperkins@redhat.com'
// })));

// requestStatements(config)(createAgentEmailQuery('mperkins@redhat.com')).fork(
//   console.warn,
//   log
// );

//let anon = anonymizeStatements(rawLogFile, 'mbox');
//writefile(JSON.stringify(anon), 'lynda-anon.log');

// const sendTestStatement = () => {
//   let fragment = {
//     subjectName: 'Blue Berry',
//     subjectID: 'blueberry@pietown.com',
//     verbDisplay: 'completed',
//     objectName: 'Filling the pies',
//     objectType: 'course',
//     objectID: 'http://pietown.com/Apple_Pie_Filling_101'
//   };

//   //sendStatement(config, createStatement(fragment)).fork(console.warn, log);
//   sendFragment(config)(fragment).fork(console.warn, log);
// };

// requestAllStatements(config)(
//     createAgentEmailQuery('tepatel@redhat.com')
//   ).fork(console.warn, res => {
//     //console.log(JSON.stringify(res));
//     writefile(JSON.stringify(res));
//     console.log('got statments', res.length);
//   });
