/*
Helpers to create aggregate pipelines
*/

let {mergeAll} = require('ramda');

const actorMBox = (mbox) => {
  return {
    'statement.actor.mbox': 'mailto:' + mbox,
  };
};

const objectIdsAny = (arry) => {
  return {
    'statement.object.id': {
      $in: [...arry],
    },
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

const project = _ => ({
  $project: {
    statement: 1,
    timestamp: 1,
    _id      : 0,
  },
});

const sortDsc = _ => ({
  $sort: {
    timestamp: 1,
  }
});

const sortAsc = _ => ({
  $sort: {
    timestamp: -1,
  }
});

// Stage 1 grouping that using to simplify the data
const group1 = _ => ({
  $group: {
    _id: {
      actor    : '$statement.actor.name',
      verb     : '$statement.verb.id',
      object   : '$statement.object.definition.name.en',
      timestamp: '$statement.timestamp',
    },
  },
});

// Stage 1 grouping for Kaltura statement simplification
const kalturaGroup1 = _ => ({
  $group: {
    _id: {
      actor    : "$statement.actor.name",
      mbox     : "$statement.actor.mbox",
      verb     : "$statement.verb.id",
      progress : "$statement.result.extensions.https://w3id&46;org/xapi/cmi5/result/extensions/progress",
      medianame: "$statement.object.definition.name.en",
      mediaid  : "$statement.object.id",
      timestamp: "$statement.timestamp"
    }
  }
});

const kalturaGroup2ByVideo = _ => ({
  "$group": {
    "_id"     : {
      "mediaid"  : "$_id.mediaid",
      "medianame": "$_id.medianame",
      "count"    : "$count"
    },
    "activity": {
      "$push": {
        "name"    : "$_id.actor",
        "progress": "$_id.progress",
        "count"   : "$count"
      }
    }
  }
});

const kalturaGroup2ByUser = _ => ({
  "$group": {
    "_id": {
      "name":"$_id.actor",
      "mbox":"$_id.mbox"
    },
    "activity": {
      "$push": {
        "mediaid": "$_id.mediaid",
        "medianame": "$_id.medianame",
        "progress":"$_id.progress"
      }
    }
  }
});

const kalturaMediaProgressGTE = val => ({
  "statement.result.extensions.https://w3id&46;org/xapi/cmi5/result/extensions/progress": {"$gte": val}
});

module.exports = {
  actorMBox,
  objectIdsAny,
  verbIdsAny,
  dateRange,
  match,
  project,
  sortDsc,
  sortAsc,
  group1,
  kalturaGroup1,
  kalturaGroup2ByVideo,
  kalturaGroup2ByUser,
  kalturaMediaProgressGTE
};
