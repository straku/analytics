# Analytics

Simple server (~150 lines of code) for handling analytics data and passing it to [Keen.io](https://keen.io/) as a storage.

API heavily inspired by [micro-analytics](https://github.com/micro-analytics/micro-analytics-cli), all credit due.

## Introduction

I was looking for a simple solution for counting views or simple events on my personal site. I wanted to keep it simple by setting up following constraints:
- zero cookies usage on the site
- negligible effect on bundle size of the site
- nice UI for browsing events
- gather useful information about the users (location, device type) without any way of identyfing them
- minimize "sysadmin" work needed to get it up and running (ideally no full blown database to store the events
- free / cheap hosting

I discovered [Keen.io](https://keen.io/) which covers most of the above needs, is cheap for relatively small traffic (see [pricing](https://keen.io/pricing/)), is offering great UI for browsing the events and even takes care of things like parsing User Agent strings or getting geo location data from passed IP information.

On the other hand most of the functionality provided by their tracking script ([keen-tracking](https://github.com/keen/keen-tracking.js/)) is not needed for my simple needs thus this tiny server has come to life.

## Prerequisites

You will need to setup your own project in [Keen.io](https://keen.io/), to do this, please follow this [guide](https://keen.io/docs/access/projects/#creating-a-new-project-by-hand). Once you have your project you will need two types of information in order to launch the server: `projectId` and `writeKey`, you can obtain them in your projects access tab (these are the same kind of information that their normal tracking script [uses](https://keen.io/docs/api/#record-a-single-event)). 

## Setup

First you will need to clone this repository.

```
git clone https://github.com/straku/analytics.git
```

After that install the dependencies

```
npm install
```

Run the server locally

```
KEEN_PROJECT_ID=your_project_id KEEN_WRITE_KEY=your_write_key npm start
```

Server is up and running on `localhost:3000` and every event you send to it will be stored in [Keen.io](https://keen.io/) project specified in env variables used in above command.

As the project is using [`micro`](https://github.com/zeit/micro) and [`micro-dev`](https://github.com/zeit/micro-dev) you can also use dev mode (check [`micro-dev`](https://github.com/zeit/micro-dev) docs to see the features of dev mode) locally:

```
KEEN_PROJECT_ID=your_project_id KEEN_WRITE_KEY=your_write_key npm run dev
```

You can also allow traffic only from specific origin using `AC_ALLOW_ORIGIN` env variable. The domain you will provide as a value of this env will be used for [`Access-Control-Allow-Origin'](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) response header.

## Usage

Server supports two types of requests
- `GET`
- `POST`

---

`GET` request is intended for simple views of a specific page, hitting:
```
localhost:3000/test
```
Will create `view` event with following payload:
```
{
  page: '/test'
}
```

---

`POST` request is not requiring any additional pathname (hit `localhost:3000`) but needs json body with following shape:
```
{
  "event": "name_of_the_event",
  "payload": {
    "example_key": "example_value"
  }
}
```
`event` field is required, `payload` is optional

It will create `name_of_the_event` with following payload:
```
{
  example_key: 'example_value'
}
```

---

Every payload is enriched with following information:
- geographical location (based on the IP read from request connection, IP is removed and not pushed to [Keen.io](https://keen.io/)), check [docs](https://keen.io/docs/api/#ip-to-geo-parser) for details
- parsed User Agent string data, check [docs](https://keen.io/docs/api/#user-agent-parser) for details
- datetime info, check [docs](https://keen.io/docs/api/#datetime-parser) for details

## Deployment

I've used [`now`](https://zeit.co/now) (version 1) to deploy my instance of this server. The instruction is as follows (it assumes you have `now` installed and are in repository root directory):

```
now -e KEEN_PROJECT_ID=your_project_id -e KEEN_WRITE_KEY=your_write_key
```

If you want to learn more about env variables usage in now, check this [blog post](https://zeit.co/blog/environment-variables-secrets)


