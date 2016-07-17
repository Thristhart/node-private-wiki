'use strict';

const config = require('./config.json');
const fs = require('fs');

const http = require('http');
const https = require('https');

let httpsOptions = {
  key: fs.readFileSync(config.keyPath, 'ascii'),
  cert: fs.readFileSync(config.certPath, 'ascii'),
};

const koa = require('koa');
const enforceHttps = require('koa-sslify');

const app = koa();

// Force HTTPS on all page
app.use(enforceHttps());


const koa_nunjucks = require('koajs-nunjucks');
const template_middleware = koa_nunjucks('./views/', {});

app.use(template_middleware);

app.use(function *() {
  yield this.render('login.html');
});


// start the server
http.createServer(app.callback()).listen(80);
https.createServer(httpsOptions, app.callback()).listen(443);
