# forms-engine-plugin-example-ui

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_forms-engine-plugin-example-ui&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_forms-engine-plugin-example-ui)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_forms-engine-plugin-example-ui&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_forms-engine-plugin-example-ui)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_forms-engine-plugin-example-ui&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_forms-engine-plugin-example-ui)

Core delivery platform Node.js Frontend Template.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Server-side Caching](#server-side-caching)
- [Redis](#redis)
- [Local Development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Local submission viewer](#local-submission-viewer)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v24` and [npm](https://nodejs.org/) `>= 12`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd forms-engine-plugin-example-ui
nvm use
```

## Server-side Caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and CatboxMemory for
local development.
You can override the default behaviour by setting the `SESSION_CACHE_ENGINE` environment variable to either `redis` or
`memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be shared between each
instance of the service and it will not persist between restarts.

## Redis

Redis is an in-memory key-value store. Every instance of a service has access to the same Redis key-value store similar
to how services might have a database (or MongoDB). All frontend services are given access to a namespaced prefixed that
matches the service name. e.g. `my-service` will have access to everything in Redis that is prefixed with `my-service`.

If your service does not require a session cache to be shared between instances or if you don't require Redis, you can
disable setting `SESSION_CACHE_ENGINE=false` or changing the default value in `~/src/config/index.js`.

## Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

### Local submission viewer

The read-only submission dashboard shows totals, recent submissions and
submission counts by form, with links to paginated form-specific lists and
individual submissions, including nested answers. The existing all-submissions
viewer remains available, with 25 submissions per page. There is no editing or
export functionality.

The form count includes distinct non-empty form IDs found in saved submissions,
including historical forms, not configured forms without submissions.
Submissions without a usable form ID are shown separately and included in
submission totals. Today, this week (from Monday) and this month are calendar
periods in UK time up to the time the dashboard is loaded; future timestamps
and missing or invalid timestamps are excluded from those period counts but
remain in all-time totals. Counts are live reads and can change between pages.

Start MongoDB (for example, `docker compose up -d mongodb`) and set these values
in your local `.env` file:

```dotenv
NODE_ENV=development
ENABLE_SUBMISSION_VIEWER=true
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=pet_passports
```

Run `npm run dev`, then visit <http://127.0.0.1:3000/submissions/dashboard>
or use the homepage's "View submission dashboard" link. The existing viewer is
at <http://127.0.0.1:3000/submissions>. Use the same database settings as your
form submissions; `MONGODB_DATABASE` defaults to `pet_passports`.

The flag defaults to false. Routes and the homepage link are only enabled in
development with the flag set, and enabling the viewer binds the whole app to
`127.0.0.1`. It is intended for running the app directly on your computer, not
through Docker port forwarding or another device. No sign-in is required:
use only local test data, and do not deploy this viewer or expose it through a
proxy/tunnel. Existing form sign-in requirements are unchanged.

Database failures produce the application's normal error page and server log,
not an empty submissions list. Viewing submissions does not modify them.
For larger datasets, review MongoDB indexes on `submittedAt` and on
`form.id`, `submittedAt`, and `_id` together; this POC does not create indexes
automatically. The dashboard aggregates live data and is intended for small
local datasets.

To run the MongoDB reporting integration tests against a local MongoDB instance:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017 node --test test/submission-report.integration.js
```

The tests create and remove a uniquely named test collection in a dedicated
temporary database. They do not use the configured submissions database.

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json)
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag forms-engine-plugin-example-ui:development .
```

Run:

```bash
docker run -p 3000:3000 forms-engine-plugin-example-ui:development
```

### Production image

Build:

```bash
docker build --no-cache --tag forms-engine-plugin-example-ui .
```

Run:

```bash
docker run -p 3000:3000 forms-engine-plugin-example-ui
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- MongoDB
- This service.
- A commented out backend example.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
