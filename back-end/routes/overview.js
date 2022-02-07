var express = require('express');
var router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');

const moment = require('moment')

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
                                    treeMap: getData_treeMap()
                                }
                            )
                        });
                });
        });

});

function setRange(data, range) {
    let result = []

    let start = moment().subtract(8, "days")
    let end = moment().add(1, "days")

    if (range == "a") {
        result = data
    } else {
        switch (range) {
            case "w":
                break;
            case "m":
                start = moment().subtract(31, "days")
                break;
            case "y":
                start = moment().subtract(365, "days")
                break;
        }

        data.forEach(function (row) {
            if (moment(row["date"]).isAfter(start) && moment(row["date"]).isBefore(end)) {
                result.push(row)
            }
        })
    }

    return result
}

// function getData_barChart(){
//     return stocks
// }

// function getData_lineGraph(){
//     return daily
// }

function getData_treeMap() {
    let data = daily_stocks

    let ranges = ["a", "y", "m", "w"]

    const tickers_all = [...new Set(data.map(d => d.ticker))];

    let output = []
    for (let dRange of ranges) {
        let relevantData = setRange(daily_stocks, dRange)

        for (let t of tickers_all) {
            relevantData_ticker = relevantData.filter(row => { return row.ticker === t })
            first = relevantData_ticker[0]
            last = relevantData_ticker[relevantData_ticker.length - 1]

            output.push({
                ticker: t,
                dateRange: dRange,
                share: last.share,
                return: ((last.value / first.value) * 100).toFixed(2)
            })
        }
    }

    return output
}

module.exports = router;
