const Sequelize = require('sequelize');

var db_path = require('../config.json').dbPath;
let db = new Sequelize("wiki", null, null, {
    dialect: 'sqlite',
    storage: db_path,
    logging: false
});

const UserModel = db.define('user', {
    id: {
        primaryKey: true,
        type: Sequelize.INTEGER
    },
    name: {
        type: Sequelize.STRING
    },
    username: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    url: {
        type: Sequelize.STRING
    }
});

const TagModel = db.define('tag', {
    id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING
    }
});

UserModel.hasMany(TagModel);

UserModel.sync({force: true});
TagModel.sync({force: true});


const bcrypt = require('bcryptjs');

class User {
    addTag(/*string*/ tag){
        tag = tag.toLowerCase();
        return TagModel.findOrCreate({
            where: {
                userId: this.ID,
                name: tag
            }
        }).then(([row, created]) => {
            return created;
        });
    }
    
    checkTag(/*string*/ tag)
    {
        tag = tag.toLowerCase();
        if(this.row.username && tag === this.row.username.toLowerCase())
        {
            return Promise.resolve(true);
        }
        return TagModel.findOne({
            where: {
                name: tag,
                userId: this.ID
            }
        }).then((row) => {
            if(row) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    
    hasAnyOfTheseTags(/*array[string]*/ tags)
    {
        tags = tags.map(tag => tag.toLowerCase());
        if(tags.find(tag => this.row.username && tag === this.row.username.toLowerCase())) {
            return Promise.resolve(true);
        }
        
        return TagModel.findOne({
            where: {
                name: {
                    in: tags
                },
                userId: this.ID
            }
        }).then((row) => {
            if(row) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    
    removeTag(/*string*/ tag)
    {
        tag = tag.toLowerCase();
        return TagModel.destroy({
            where: {
                name: tag,
                userId: this.ID
            }
        }).then((row) => {
            if(row) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    
    clearTags()
    {
        return TagModel.findAll({
            where: {
                userId: this.ID
            }
        }).then((rows) => {
            if(rows.length===0) {
                return [];
            }
            else
            {
                return TagModel.destroy({
                    where: {
                        userId: this.ID
                    }
                }).then((numDestroyed) => {
                    return rows.map(row => row.name);
                });
            }
        });
    }
    
    delete()
    {
        return this.clearTags().then(() => {
            return UserModel.destroy({
                where: {
                    id: this.ID
                }
            }); 
        })
    }
    
    update(values) {
        return this.row.update(values);
    }
    
    constructor(ID) {
        this.ID = ID;
        return UserModel.findOrCreate({
            where: {
                id: ID
            }
        }).then(([row, created]) => {
            this.row = row;
            
            return this;
        })
    }
}

module.exports = User;
