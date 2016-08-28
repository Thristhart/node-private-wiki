const path = require('path');
const fs = require('fs-promise');

const Page = require('../model/page');

const marked = require('marked');

module.exports.index = function*(unsafePath, next) {
    if(!unsafePath || typeof unsafePath !== "string") {
        unsafePath = "/";
    }
    yield Page.getVisibleForUserInFolder(unsafePath, this.session.user).then(items => {
        this.body = this.render("index.html", {items: items, path: unsafePath});
    });
};
module.exports.get = function*(unsafePath, next) {
    let filePath = unsafePath + ".md";
    
    yield new Page(filePath).then(page => {
       return page.getSourceForUser(this.session.user).then(source => {
           if(source.trim()) {
               let sourceWithPrettyTags = source.replace(/{{((?:(?:\s*\w+\s*)\|*)+)}}/g, "").replace(/{{\s*\/\s*}}/g, "");
               if(this.request.querystring === "edit") {
                   this.body = this.render("editor.html", {
                       path: unsafePath,
                       page_source: source,
                       rendered_page: marked(sourceWithPrettyTags)
                   });
               }
               else {
                   this.body = this.render("wiki_page.html", {
                       path: unsafePath,
                       page_source: source,
                       rendered_page: marked(sourceWithPrettyTags)
                   });
               }
           }
           else {
               this.body = this.render("editor.html", {path: unsafePath, new: true});
           }
       });
    });
};

module.exports.post = function*(unsafePath, next) {
    if(!this.request.body) {
        this.status = 400;
        return;
    }
    
    let filePath = unsafePath + ".md";
    
    yield new Page(filePath).then(page => {
        return page.updateAsUser(this.session.user, this.request.body.source).then(() => {
            return this.redirect(`/${unsafePath}`);
        });
    });
};