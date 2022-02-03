import moment from 'moment';

export let red = "#e78380"
export let blue = "#6bade2"
export let green = "#72ca76"

// Change the active nav item
export function formatNav(target) {
    let items = document.querySelectorAll('.item')
    items.forEach(function (i) {
        i.classList.remove('active')
    });

    document.getElementById(target).classList.add('active')
}

// Format a value (money)
export function formatValue(x) {
    // Round to integer
    x = Math.round(parseFloat(x))

    // Add prefix if negative
    let prefix = ""
    if (x < 0) {
        prefix = "- "
    }
    x = Math.abs(x)

    let xLength = x.toString().length
    let format = `£${(x)}`

    if (xLength >= 4 && xLength <= 6) {
        format = `${prefix}£${(x / 1000).toFixed(0)}k`
    } else if (xLength > 6) {
        format = `${prefix}£${(x / 1000000).toFixed(0)}M`
    }
    return format
}

// Calculate a moving average for a given list of data
export function movingAvg(values, window) {

    let result = []

    for (let i = 0; i < values.length; i++) {

        // Set to all values up to this point
        let windowSlice = values.slice(0, i + 1);

        // If we have passed a full windows-worth of values (or more)
        if (i >= window - 1) {
            // Set the window slice to be the current position back one windows length
            windowSlice = values.slice(i - window + 1, i + 1);
        }

        // Sum and average
        const sum = windowSlice.reduce((prev, curr) => prev + curr, 0);
        result.push((sum / windowSlice.length).toFixed(2));
    }

    return result
}

// Apply movingAvg to a range of columns and add to the original dataset
export function getMovingAvgs(data, values, win) {

    if (data.length / win < 5) {
        win = Math.ceil(data.length / 5)
    }

    // Calculate moveing average for each column
    let values_movingAvg = []
    values.forEach(function (l) {
        let value_raw = data.map(r => parseFloat(r[l]));
        values_movingAvg.push(movingAvg(value_raw, win))
    })

    // Add moving average values back to original dataset
    data.forEach(function (row, i) {
        values.forEach(function (l, j) {
            row[l + "_ma"] = values_movingAvg[j][i]
        })
    })

    // let result = []
    // // Only keep every 'win'-th value
    // data.forEach(function (row, i) {
    //     if (i % win == 0) {
    //         result.push(row)
    //     }
    // })

    return data
}

// Limit a dataset by the given date range
export function setRange(data, range) {
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
    console.log(result)

    return result
}