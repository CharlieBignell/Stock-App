var express = require('express');
var router = express.Router();
var mysql = require('mysql')
const config = require("../db.config.js");

router.get('/', function (req, res, next) {

    var connection = mysql.createConnection({
        host: config.HOST,
        user: config.USER,
        password: config.PASSWORD,
        database: config.DB
    })

    connection.connect()

    connection.query('SELECT * FROM stocks WHERE belongs_to = "d"', function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
    })

    connection.end()

});

module.exports = router;
