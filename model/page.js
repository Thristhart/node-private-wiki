const fs = require('fs-promise');
const path = require('path');

const rootPath = path.resolve(path.join(__dirname, "../wiki"));

const secret_regex = /{{((?:(?:\s*\w+\s*)\|*)+)}}(?:\s|.)*?{{\s*\/\s*}}/g;

const DiffMatchPatch = require("diff-match-patch");
const DMP = new DiffMatchPatch();

class Page {
    constructor(unsafePath) {
        this.path = Page.sanitizePath(unsafePath);
        return fs.stat(this.path).then(() => {
            return fs.readFile(this.path, 'utf8');
        }).catch(() => "").then(source => {
            this.source = source;
            return this;
        });
    }
    
    delete() {
        return fs.remove(this.path);
    }
    
    static sanitizePath(unsafePath) {
        return path.join(rootPath, path.join(path.sep, unsafePath)).toLowerCase();
    }
    
    static getVisibleForUserInFolder(unsafePath, user) {
        let safePath = Page.sanitizePath(unsafePath);
        return fs.readdir(safePath).then(paths => {
            return Promise.all(paths.map(filePath => {
                return fs.stat(path.resolve(safePath, filePath)).then(stats => {
                    return {path: filePath, is_dir: stats.isDirectory()};
                });
            })).then(items => {
                return items.map(item => {
                    let relative = item.path;
                    relative = relative.replace(/\.md$/, "");
                    item.path = path.join(path.relative(rootPath, safePath), relative);
                    return item;
                }); 
            });
        }).then(itemsInDir => {
            return itemsInDir.reduce((promise, item) => {
                return promise.then(visibleItems => {
                    if(item.is_dir) {
                        return Page.getVisibleForUserInFolder(path.resolve(unsafePath, item.path), user).then(visibleInSubDir => {
                            if(visibleInSubDir.length > 0) {
                                return visibleItems.concat(item);
                            }
                            else {
                                return visibleItems;
                            }
                        });
                    }
                    else {
                        return new Page(item.path + ".md").then(checkPage => {
                            return checkPage.getSourceForUser(user).then(visibleSource => {
                                if(visibleSource.trim()) {
                                    return visibleItems.concat(item);
                                }
                                else {
                                    return visibleItems;
                                }
                            });
                        });
                    }
                });
            }, Promise.resolve([]));
        });
    }
    
    getSourceForUser(user) {
        let visibleSource = this.source;
        
        let scanner = new RegExp(secret_regex);
        let result;
        let tagChecks = [];
        
        do { 
            result = scanner.exec(this.source);
            if(result) {
                let section = result[0];
                let tags = result[1].replace(/\s/g, "").split("|");
                let lookup = user.hasAnyOfTheseTags(tags);
                lookup.then(hasTags => {
                    if(!hasTags) {
                        visibleSource = visibleSource.replace(section, "");
                    }
                });
                tagChecks.push(lookup);
            }
        } while(result);
        
        return Promise.all(tagChecks).then(() => {
            return visibleSource;
        });
    }
    updateAsUser(user, newSource) {
        let base = this.source;
        newSource = newSource.trim();
        
        return this.getSourceForUser(user).then(visibleSource => {
            let visibleDifference = DMP.diff_main(visibleSource, base);
            let savePatch = DMP.patch_make(newSource, visibleDifference);
            
            this.source = DMP.patch_apply(savePatch, newSource)[0];
            this.source = this.source.trim();
            
            return fs.ensureFile(this.path).then(() => {
                return fs.writeFile(this.path, this.source).then(() => this.source);
            });
        });
    }
    
}

module.exports = Page;