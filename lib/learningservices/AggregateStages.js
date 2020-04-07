/*
Helpers to create aggregate pipelines
*/

let { mergeAll } = require('ramda');

const actorMBox = (mbox) => {
  return {
    'statement.actor.mbox': 'mailto:' + mbox,
  };
};

const verbIdsAny = (arry) => {
  return {
    'statement.verb.id': {
      $in: [...arry],
    },
  };
};

const dateRange = (start, end) => {
  return {
    timestamp: {
      $gte: {
        $dte: `${start}T00:00:00Z`,
      },
      $lte: {
        $dte: `${end}T00:00:00Z`,
      },
    },
  };
};

const match = (arry) => {
  let params = mergeAll(arry);
  return {
    $match: params,
  };
};

module.exports = {
  actorMBox,
  verbIdsAny,
  dateRange,
  match,
  project: {
    $project: {
      statement: 1,
      timestamp: 1,
      _id: 0,
    },
  },
  sortDsc: {
    $sort: {
      timestamp: 1,
    },
  },
  sortAsc: {
    $sort: {
      timestamp: -1,
    },
  },
  simpleGroup: {
    $group: {
      _id: {
        actor: '$statement.actor.name',
        verb: '$statement.verb.id',
        object: '$statement.object.definition.name.en',
        timestamp: '$statement.timestamp',
      },
    },
  },
};
