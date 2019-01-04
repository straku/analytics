const url = require('url');

const { send, json, createError } = require('micro');
const fetch = require('node-fetch');

const AC_ALLOW_ORIGIN = process.env.AC_ALLOW_ORIGIN || '*';
const KEEN_PROJECT_ID = process.env.KEEN_PROJECT_ID;
const KEEN_WRITE_KEY = process.env.KEEN_WRITE_KEY;

if (!KEEN_PROJECT_ID || !KEEN_WRITE_KEY) {
  console.error('Keen.io required data not supplied.');
  process.exit(1);
}

const DEFAULT_GET_EVENT = 'view';

// credit due to https://stackoverflow.com/a/19524949
function getIpFromRequest(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',').pop() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
}

function getUrl(event) {
  return `https://api.keen.io/3.0/projects/${KEEN_PROJECT_ID}/events/${event}?api_key=${KEEN_WRITE_KEY}`;
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

async function sendEvent(event, payload) {
  const res = await fetch(getUrl(event), {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {
      'content-type': 'application/json',
    },
  });

  if (!res.ok) {
    try {
      console.error(res.status, res.statusText);
      const body = await res.json();
      console.error(body);
    } catch (e) {
      // log body of the unsuccessful request to keen.io as it is descriptive
      // if response body cannot be parsed as a valid json, let's display only
      // status of the response and json parsing error
      console.error(e);
    }

    throw createError(
      500,
      'Error occured while trying to comunicate with keen.io'
    );
  }
}

async function handleGetRequest(req, res) {
  const { pathname } = url.parse(req.url, true);

  if (pathname.length === 0) {
    throw createError(400, 'Please include a path to a page.');
  }

  await sendEvent(DEFAULT_GET_EVENT, {
    page: pathname,
    ...getCommonEventProperties(req),
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

  await sendEvent(event, {
    ...payload,
    ...getCommonEventProperties(req),
  });

  send(res, 200);
}

async function analytics(req, res) {
  res.setHeader('access-control-allow-origin', AC_ALLOW_ORIGIN);

  if (req.method === 'OPTIONS') {
    res.setHeader('access-control-allow-headers', 'content-type');
    return send(res, 204);
  }

  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res);
    case 'POST':
      return handlePostRequest(req, res);
    default:
      throw createError(400, 'Please make a GET or a POST request.');
  }
}

module.exports = analytics;
