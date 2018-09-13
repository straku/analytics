const url = require('url');
const { send, json, createError } = require('micro');

const scheduler = require('./scheduler');

async function readMeta(req) {
  try {
    const body = await json(req);
    if (body.meta) {
      return body.meta;
    } else {
      throw new Error('No meta in the body of the request');
    }
  } catch (error) {
    console.error('Failed processing meta', error);
    return null;
  }
}

async function analytics(req, res) {
  const { pathname, query } = url.parse(req.url, true);

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (String(query.all) === 'true') {
    try {
      const data = scheduler.getAll(pathname);
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
    const currentViews = scheduler.has(pathname)
      ? scheduler.get(pathname).views.length
      : 0;

    if (req.method === 'POST') {
      meta = await readMeta(req);
    }

    const data = { time: Date.now() };
    if (meta) {
      data.meta = meta;
    }

    if (shouldIncrement) {
      scheduler.put(pathname, data);
    }

    send(res, 200, {
      views: shouldIncrement ? currentViews + 1 : currentViews,
    });
  } catch (err) {
    console.log(err);
    throw createError(500, 'Internal server error.');
  }
}

module.exports = analytics;
