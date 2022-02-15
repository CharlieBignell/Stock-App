var express = require('express');
var router = express.Router();
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

                            res.send(
                                {
                                    areaGraph: getData_areaGraph()
                                }
                            )
                        });
                });
        });

});

function getData_areaGraph(){
    return daily_stocks
}

module.exports = router;
