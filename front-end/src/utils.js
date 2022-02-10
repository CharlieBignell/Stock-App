import moment from 'moment';

export let red = "#e78380"
export let blue = "#5891e0"
export let green = "#5ddb58"
export let yellow = "#e6e675"
export let purple = "#bd63eb"
export let orange = "#eda961"
export let turquoise = "#5bd4ba"
export let grey = "#bfbfbf"

export let colours_core = [red, blue, green, yellow, purple, orange]
export let colours_smooth = [blue, turquoise, green, yellow, orange, red, purple]

export let colourScale = ["#c94747", "#ed8585", "#c9c9c9", "#8fde85", "#55bf47"]

export let colourScale_text = ["#611818","#8f3232", "#575757", "#326625", "#254f1a"]

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

    return result
}

export function getReturns(data, column, dateRange) {
    data = setRange(data, dateRange)
    let startVal = data[0][column]

    let counter = 1
    while (startVal == 0) {
        startVal = data[counter][column]
        counter++
    }

    let endVal = data[data.length - 1][column]

    return (((endVal / startVal) - 1) * 100).toFixed(2)
}

export function roundedRect(x, y, w, h, r, tl, tr, bl, br) {
    var retval;
    retval = "M" + (x + r) + "," + y;
    retval += "h" + (w - 2 * r);
    if (tr) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r; }
    else { retval += "h" + r; retval += "v" + r; }
    retval += "v" + (h - 2 * r);
    if (br) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + r; }
    else { retval += "v" + r; retval += "h" + -r; }
    retval += "h" + (2 * r - w);
    if (bl) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r; }
    else { retval += "h" + -r; retval += "v" + -r; }
    retval += "v" + (2 * r - h);
    if (tl) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r; }
    else { retval += "v" + -r; retval += "h" + r; }
    retval += "z";
    return retval;
}