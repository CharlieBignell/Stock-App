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
                                    lineGraph: getData_lineGraph(),
                                    treeMap: getData_treeMap(),
                                    barChart: getData_barChart(),
                                    pieChart: getData_pieChart()
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

function getData_pieChart() {

    // Get a list of all sectors and industries
    const sectors_all = [...new Set(stocks.map(d => d.sector))];
    const industries_all = [...new Set(stocks.map(d => d.industry))];

    let data = []

    for (let s of sectors_all) {

        // Get the relevant stocks and sum the shares
        let relevantStocks = stocks.filter(row => { return row.sector === s })
        let node = {}
        if (relevantStocks.length > 0) {
            let share = relevantStocks.map(stock => stock.share).reduce((prev, next) => parseFloat(prev) + parseFloat(next));

            // This is the root node for this sector
            node = {
                "nodeData": {
                    "name": s,
                    "share": share
                }
            }
        }

        let subdata = []
        for (let i of industries_all) {

            // Get the relevant stocks and sum the shares
            let relevantStocks = stocks.filter(row => { return row.industry === i & row.sector === s })

            if (relevantStocks.length > 0) {
                let share = relevantStocks.map(stock => stock.share).reduce((prev, next) => parseFloat(prev) + parseFloat(next));

                // This is a sub node for the current sector
                subdata.push({
                    "nodeData": {
                        "name": i,
                        "share": share
                    }
                })
            }
        }
        node.subData = subdata
        data.push(node)
        data.sort((a, b) => a.nodeData.share > b.nodeData.share ? -1 : 1)

    }
    return data
}

function getData_barChart() {
    return daily
}

function getData_lineGraph() {
    return daily
}

function getData_treeMap() {

    let ranges = ["a", "y", "m", "w"]

    const tickers_all = [...new Set(daily_stocks.map(d => d.ticker))];

    let output = []
    for (let dRange of ranges) {
        let relevantData = setRange(daily_stocks, dRange)

        for (let t of tickers_all) {
            relevantData_ticker = relevantData.filter(row => { return row.ticker === t })
            if (relevantData_ticker.length > 0) {
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
    }

    return output
}

module.exports = router;
