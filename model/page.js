const fs = require('fs-promise');

const secret_regex = /{{((?:(?:\s*\w+\s*)\|*)+)}}.*?{{\s*\/\s*}}/g;

const DiffMatchPatch = require("diff-match-patch");
const DMP = new DiffMatchPatch();

class Page {
    constructor(path) {
        this.path = path;
        return fs.ensureFile(path).then(() => {
            return fs.readFile(path, 'utf8');
        }).then(source => {
            this.source = source;
            return this;
        });
    }
    
    delete() {
        return fs.remove(this.path);
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
        
        return Promise.all(tagChecks).then(() => visibleSource);
    }
    updateAsUser(user, newSource) {
        let base = this.source;
        
        return this.getSourceForUser(user).then(visibleSource => {
            let visibleDifference = DMP.diff_main(visibleSource, base);
            let savePatch = DMP.patch_make(newSource, visibleDifference);
            
            this.source = DMP.patch_apply(savePatch, newSource)[0];
            
            return fs.writeFile(this.path, this.source).then(() => this.source);
        })
    }
}

module.exports = Page;