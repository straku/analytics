const url = require('url');
const { send, json, createError } = require('micro');

// credit due to https://stackoverflow.com/a/19524949
function getIpFromRequest(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',').pop() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
}

function getCommonEventProperties(req) {
  return {
    ip: getIpFromRequest(req),
    user_agent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    keen: {
      addons: [
        {
          name: 'keen:ip_to_geo',
          input: {
            ip: 'ip',
            remove_ip_property: true,
          },
          output: 'geo',
        },
        {
          name: 'keen:ua_parser',
          input: {
            ua_string: 'user_agent',
          },
          output: 'parsed_user_agent',
        },
        {
          name: 'keen:date_time_parser',
          input: {
            date_time: 'timestamp',
          },
          output: 'timestamp_info',
        },
      ],
    },
  };
}

function handleGetRequest(req, res) {
  const { pathname } = url.parse(req.url, true);

  if (pathname.length === 0) {
    throw createError(400, 'Please include a path to a page.');
  }

  // instead of logging - send to keen.io
  console.log({
    event: 'view',
    payload: {
      page: pathname,
      ...getCommonEventProperties(req),
    },
  });

  send(res, 200);
}

async function handlePostRequest(req, res) {
  let event = null;
  let payload = null;
  try {
    const body = await json(req);
    event = body.event;
    payload = body.payload;
  } catch (error) {
    throw createError(400, 'Cannot parse body.');
  }

  if (!event) {
    throw createError(400, 'No event specified in the body.');
  }

  // instead of logging - send to keen.io
  console.log({
    event: event,
    payload: {
      ...payload,
      ...getCommonEventProperties(req),
    },
  });

  send(res, 200);
}

async function analytics(req, res) {
  res.setHeader('access-control-allow-origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('access-control-allow-headers', 'content-type');
    return send(res, 204);
  }

  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res);
    case 'POST':
      return await handlePostRequest(req, res);
    default:
      throw createError(400, 'Please make a GET or a POST request.');
  }
}

module.exports = analytics;
