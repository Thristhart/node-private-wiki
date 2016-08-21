const Sequelize = require('sequelize');
const User = require('./user');

class Session {
    constructor(sequelizeInstance) {
        this.database = sequelizeInstance;
        this.model = this.database.define("session", {
            id: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            sessionData: {
                type: Sequelize.STRING
            }
        });
        this.model.sync({force: true});
    }
    load(sid) {
        return this.model.findOrCreate({where: {id: sid}}).then(([row, created]) => {
            return row.sessionData;
        });
    }
    save(sid, sessionData) {
        return this.model.insertOrUpdate({
            id: sid,
            sessionData: sessionData
        });
    }
    remove(sid) {
        return this.model.destroy({where: {id: sid}});
    }
}

module.exports = Session;