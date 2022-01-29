var express = require('express');
var router = express.Router();
// var mysql = require('mysql')
// const config = require("../db.config.js");
const csv = require('csv-parser');
const fs = require('fs');

router.get('/', function (req, res, next) {
    stocks = []
    daily = []
    daily_stocks = []

    fs.createReadStream('../data/outputs/stocks.csv')
        .pipe(csv())
        .on('data', (row) => {
            stocks.push(row)
        })
        .on('end', () => {
            fs.createReadStream('../data/outputs/daily.csv')
                .pipe(csv())
                .on('data', (row) => {
                    daily.push(row)
                })
                .on('end', () => {
                    fs.createReadStream('../data/outputs/daily_stocks.csv')
                        .pipe(csv())
                        .on('data', (row) => {
                            daily_stocks.push(row)
                        })
                        .on('end', () => {
                            res.send([stocks, daily, daily_stocks])
                        });
                });
        });



    // var connection = mysql.createConnection({
    //     host: config.HOST,
    //     user: config.USER,
    //     password: config.PASSWORD,
    //     database: config.DB
    // })

    // connection.connect()

    // connection.query('SELECT * FROM stocks WHERE belongs_to = "o"', function (err, rows, fields) {
    //     if (err) throw err

    //     res.send(rows);
    // })

    // connection.end()

});

module.exports = router;
