'use strict';

const config = require('./config.json');
const fs = require('fs');

const http = require('http');

const Sequelize = require('sequelize');

const koa = require('koa');
const route = require('koa-route');
const mount = require('koa-mount');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session-store');
const sequelizeStore = require('./model/session');

const User = require('./model/user');

const page = require('./routes/page');


let sequelize = new Sequelize("wiki", null, null, {
    dialect: 'sqlite',
    storage: config.dbPath,
    logging: false
});


const app = koa();

app.keys = ['this is a poorly kept secret'];

app.use(session({
  store: new sequelizeStore(sequelize)
}));

const Grant = require('grant-koa');
let grant = new Grant(config.oauth);

app.use(mount(grant));

const request = require('request-promise-native');

app.use(route.get(config.oauth.server.callback, function*(next) {
  this.session.auth = {
    access_token: this.query.access_token,
    refresh_token: this.query.refresh_token,
  };
  yield request(`https://library.evaryont.me/api/v3/user?access_token=${this.session.auth.access_token}`, {json: true}).then(response => {
    return new User(response.id).then(userInstance => {
      userInstance.update({
        name: response.name,
        username: response.username,
        email: response.email,
        url: response.web_url
      });
      
      this.session.user = userInstance;
      
      this.session.views = 0;
      
      this.redirect(this.session.attempt_path || '/');
    })
  });
}));

if(config.keyPath) {
  const https = require('https');

  let httpsOptions = {
    key: fs.readFileSync(config.keyPath, 'ascii'),
    cert: fs.readFileSync(config.certPath, 'ascii'),
  };

  const enforceHttps = require('koa-sslify');

  // Force HTTPS on all pages
  app.use(enforceHttps());

  https.createServer(httpsOptions, app.callback()).listen(443);
}

const path = require('path');
const nunjucks = require('nunjucks');
const renderer = nunjucks.configure(path.resolve('./views/'));
app.context.render = function(path, data) {
  return renderer.render(path, data);
};
  

app.use(function *(next) {
  // do whatever setup for the session is necessary here
  if(!this.session.user) {
    this.session.attempt_path = this.request.path;
    return this.redirect('/connect/evaryont_library');
  }
  yield new User(this.session.user.ID).then(user => {
    this.session.user = user;
  });
  
  yield next;
});

app.use(mount('/', require('koa-static')("./static")));

app.use(bodyParser());
app.use(route.get('/', page.index));
app.use(route.get('/:path*(/)', page.index));
app.use(route.get('/:path*', page.get));
app.use(route.post('/:path+', page.post));

console.log("wiki starting");

// start the server
http.createServer(app.callback()).listen(80);
