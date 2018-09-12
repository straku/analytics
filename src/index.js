const url = require('url');
const { send, createError } = require('micro');

const scheduler = require('./scheduler');

async function readMeta(req) {
  try {
    return (await json(req)).meta;
  } catch (error) {
    console.error('Failed parsing meta', error);
    return null;
  }
}

async function analytics(req, res) {
  const { pathname, query } = url.parse(req.url, true);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (String(query.all) === 'true') {
    try {
      const data = {
        data: await scheduler.getAll(pathname),
        time: Date.now(),
      };
      return send(res, 200, data);
    } catch (err) {
      console.log(err);
      throw createError(500, 'Internal server error.');
    }
  }

  // check that a page is provided
  if (pathname.length === 0) {
    throw createError(400, 'Please include a path to a page.');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return send(res, 204);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    throw createError(400, 'Please make a GET or a POST request.');
  }

  const shouldIncrement = String(query.inc) !== 'false';
  try {
    let meta;
    const currentViews = (await scheduler.has(pathname))
      ? (await scheduler.get(pathname)).views.length
      : 0;

    console.log(await scheduler.has(pathname));

    if (req.method === 'POST') {
      meta = await readMeta(req);
    }

    const data = { time: Date.now() };
    if (meta) {
      data.meta = meta;
    }

    if (shouldIncrement) {
      await scheduler.put(pathname, data);
    }

    console.log('--', scheduler.data);

    send(res, 200, {
      views: shouldIncrement ? currentViews + 1 : currentViews,
    });
  } catch (err) {
    console.log(err);
    throw createError(500, 'Internal server error.');
  }
}

module.exports = analytics;
