
const Listeners = require('./listener');
const Middlewares = require('./middleware');

module.exports = class MiddlewareManager {

    constructor() {
        util.readOnlyProp(this, 'listeners', new Listeners());
        util.readOnlyProp(this, 'middlewares', new Middlewares());
        util.readOnlyProp(this, 'postwares', new Middlewares());
        
    }

}