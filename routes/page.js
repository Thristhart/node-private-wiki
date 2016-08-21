const path = require('path');
const fs = require('fs-promise');
const rootPath = path.resolve(path.join(__dirname, "../wiki"));

const Page = require('../model/page');

const marked = require('marked');


function sanitizePath(unsafePath) {
    return path.join(rootPath, path.join(path.sep, unsafePath));
}
module.exports.get = function*(unsafePath, next) {
    let filePath = unsafePath + ".md";
    
    let safePath = sanitizePath(filePath);
    
    yield new Page(safePath).then(page => {
       return page.getSourceForUser(this.session.user).then(source => {
           if(source.trim()) {
               let sourceWithPrettyTags = source.replace(/{{((?:(?:\s*\w+\s*)\|*)+)}}/g, "").replace(/{{\s*\/\s*}}/g, "");
               this.body = this.render("editor.html", {
                   path: unsafePath,
                   page_source: source,
                   rendered_page: marked(sourceWithPrettyTags)
               });
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
    
    let safePath = sanitizePath(filePath);
    
    yield new Page(safePath).then(page => {
        return page.updateAsUser(this.session.user, this.request.body.source).then(() => {
            return this.redirect(`/${unsafePath}`);
        });
    });
};