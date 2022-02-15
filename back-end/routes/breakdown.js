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

function getData_areaGraph() {
    Date.prototype.addDays = function (days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    let currentDate = new Date(daily_stocks[0].date)
    let lastDate = new Date(daily_stocks[daily_stocks.length - 1].date)

    let output = []

    while (currentDate <= lastDate) {
        let relevantDays = daily_stocks.filter(row => { return new Date(row.date).getDate() === currentDate.getDate() })

        let day = { date: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDay()}` }

        if (relevantDays.length > 0) {
            for (let s of relevantDays) {
                day[s.ticker] = s.value
            }
        }
        output.push(day)
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return output
}

module.exports = router;
