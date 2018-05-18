'use strict';
module.exports = function(app) {
    var zipData = require('../controller/nodeController');

    app.route('/getPopData')
        .get(zipData.read_a_task);

};