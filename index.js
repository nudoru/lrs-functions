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
    objectIdsAny,
    verbIdsAny,
    dateRange,
    match,
    project,
    sortDsc,
    group1,
    kalturaGroup1,
    kalturaGroup2ByVideo,
    kalturaGroup2ByUser
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
Kaltura Verbs
https://brindlewaye.com/xAPITerms/verbs/loggedin/
http://activitystrea.ms/schema/1.0/watch
http://activitystrea.ms/schema/1.0/play
http://id.tincanapi.com/verb/paused
http://adlnet.gov/expapi/verbs/interacted
Seek in a video - http://id.tincanapi.com/verb/skipped
Looked at a channel page - http://id.tincanapi.com/verb/viewed
 */

const queryStatements = () => {
  let vquery = createAggregateQuery([
    project(),
    match([
      verbIdsAny(['http://activitystrea.ms/schema/1.0/watch']),
      actorMBox(''),
      objectIdsAny(['']),
      dateRange('2019-03-25', '2020-04-08'),
    ]),
    sortDsc(),
    kalturaGroup1(),
    kalturaGroup2ByUser()
  ]);

  runTask(requestAggregate(config, vquery));
  // writeTask(requestAggregate(config, vquery)); // output to lib/debug.log
};


queryStatements();

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

// sendTestStatement();
//['statement.verb.display.en-US']: 'loggedin'

// console.log(createAggregateQuery({['statement.verb.display.en-US']: 'completed'}))

// Will extract and write all statements from the given LRS store
// writeTask(requestAggregate(config.webservice.lrs, createAggregateQuery()));

// writeTask(requestAggregate(config.webservice.lrs, createAggregateQuery({
//  ['statement.actor.mbox']        : 'mailto:blah@blah.com'
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
