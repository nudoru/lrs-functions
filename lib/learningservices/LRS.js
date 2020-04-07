/**
 * Simple module to send xAPI statements to an LRS
 * Tested on Learning Locker
 * Matt Perkins, hello@mattperkins.me
 * Last Updated, 3/30/20
 */

let Task = require('data.task'),
  Either = require('data.either'),
  { curry, compose, concat, is, mergeAll } = require('ramda'),
  { parameterize, validateEmail, log } = require('../utils'),
  defaultProps;

// Set defaults to be applied to each statement
const setStatementDefaults = (defaultObj) => {
  defaultProps = Object.assign(Object.create(null), defaultObj);
};

// If params is a string, it's assumed it's a properly formatted endpoint + function + query
// and just runs it
const createLRSQuery = (wsOptions, method = 'POST', params, body) =>
  new Task((reject, resolve) => {
    let url = is(String, params)
      ? wsOptions.endpoint + params
      : wsOptions.endpoint + 'data/xAPI/statements' + parameterize(params);
    fetch(url, {
      method: method,
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + wsOptions.token,
        'X-Experience-API-Version': wsOptions.version,
      },
    })
      .then((res) => {
        //console.log('Response', res);
        res.json().then((json) => {
          resolve(json);
        });
      })
      .catch((e) => {
        reject('createLRSQuery: ' + e);
      });
  });

// Create an xAPI statement object from a partial
const createStatement = (partialStatement) => {
  let statement,
    {
      subjectName,
      subjectID,
      verbDisplay,
      objectID,
      objectType,
      objectName,
    } = partialStatement;

  statement = Object.assign(Object.create(null), {
    actor: {
      name: subjectName,
      mbox: 'mailto:' + subjectID,
    },
    verb: {
      id: verbURLPrefix + verbDisplay.toLowerCase(),
      display: { 'en-US': verbDisplay.toLowerCase() },
    },
    object: {
      id: objectID,
      definition: {
        type: objectType ? activityURLPrefix + objectType : null,
        name: { 'en-US': objectName },
      },
    },
  });
  return statement;
};

// Send an xAPI statement
// statement may be an array of statements
// ex: sendStatement(opts, createStatement(fragment)).fork(console.warn, log);
const sendStatement = curry((options, statement) => {
  return Either.fromNullable(options).fold(
    () => new Task.rejected('sendStatement: Need LRS options'),
    () => createLRSQuery(lrsConnection, 'POST', {}, JSON.stringify(statement))
  );
});

// Send a partial xAPI statement to the LRS. Will first be filled out w/ defaults
const sendFragment = curry((options, fragment) =>
  compose(sendStatement(options), createStatement)(fragment)
);

// Helper to create an LRS statement query from an email address
const createAgentEmailQuery = (email) => {
  if (!validateEmail(email)) {
    console.error(
      'createAgentEmailQuery with "' +
        email +
        '" is not a valid email address. Request will fail.'
    );
  }

  return {
    agent: JSON.stringify({
      objectType: 'Agent',
      mbox: `mailto:${email}`,
    }),
  };
};

// Get first 100 statements from the LRS
// Statement may be an individual ID, array or null for all of them
// ex: requestStatements(opts, createAgentEmailQuery('blueberry@pietown.com')).fork(console.warn, log);
const requestStatements = curry((options, query) => {
  return Either.fromNullable(options || lrsConnection).fold(
    () => new Task.rejected('requestStatements: Need LRS options'),
    () => createLRSQuery(lrsConnection, 'GET', query)
  );
});

// Recursively query for all user statements with pagination
const requestAllStatements = curry((options, query) => {
  return new Task((rej, res) => {
    const makeQuery = (more) =>
      Either.fromNullable(options || lrsConnection).fold(
        () => new Task.rejected('requestAllStatements: Need LRS options'),
        () => {
          return more
            ? createLRSQuery(lrsConnection, 'GET', more)
            : createLRSQuery(lrsConnection, 'GET', query);
        }
      );

    // Recursively execute tasks
    const next = (task, accumulator) => {
      task.fork(
        (e) => {
          console.error(e);
          rej(e);
        },
        (statmentRes) => {
          if (statmentRes.more) {
            next(
              makeQuery(statmentRes.more),
              concat(accumulator, statmentRes.statements)
            );
          } else {
            res(concat(accumulator, statmentRes.statements));
          }
        }
      );
    };

    // Start
    next(makeQuery(null), []);
  });
});

// TODO fromNullable check
const createAggregateQuery = (arry) => {
  let pipeline = arry ? arry : [{ $match: {} }];

  return (
    '/api/v1/statements/aggregate?pipeline=' +
    encodeURIComponent(JSON.stringify(pipeline)) +
    '&cache=false&maxTimeMS=1000000&maxScan=5000'
  );
};

const requestAggregate = curry((options, query) => {
  return Either.fromNullable(options).fold(
    () => new Task.rejected('requestAggregate: Need LRS options'),
    () =>
      createLRSQuery(options, 'GET', query).map((res) => {
        return res.result;
      })
  );
});

module.exports = {
  createLRSQuery,
  setStatementDefaults,
  createStatement,
  sendStatement,
  sendFragment,
  createAgentEmailQuery,
  requestStatements,
  requestAllStatements,
  requestAggregate,
  createAggregateQuery,
};
