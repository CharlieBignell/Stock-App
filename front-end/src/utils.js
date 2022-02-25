import moment from 'moment';

export let red = "#e78380"
export let blue = "#5891e0"
export let green = "#60b35d"
export let yellow = "#e6e675"
export let purple = "#bd63eb"
export let orange = "#eda961"
export let turquoise = "#5bd4ba"
export let grey = "#bfbfbf"

export let colours_core = [red, blue, green, yellow, purple, orange]
export let colours_smooth = [blue, turquoise, green, yellow, orange, red, purple]

export let colourScale = ["#c94747", "#ed8585", "#c9c9c9", "#8fde85", "#55bf47"]

export let colourScale_text = ["#611818", "#8f3232", "#575757", "#326625", "#254f1a"]

// Change the active nav item
export function formatNav(target, date) {

    let items = document.querySelectorAll('.item')
    items.forEach(function (i) {
        i.classList.remove('active')
    });

    document.getElementById(target).classList.add('active')
    document.getElementById(`${target}_underline`).classList.add('activeUnderline')
    document.getElementById("TITM")

    function showTime() {
        let time = getTimeString(moment(date, "YYYY-MM-DD"))
        document.getElementById("TITM").innerText = time;
        setTimeout(showTime, 1000);
    }

    showTime();
}

export function getTimeString(date) {
    let diff_year = moment().diff(date, "years", true)
    let diff_month = moment().diff(date, "months", true)
    let diff_days = moment().diff(date, "days", true)
    let diff_hours = moment().diff(date, "hours", true)
    let diff_minutes = moment().diff(date, "minutes", true)
    let diff_seconds = moment().diff(date, "seconds", true)

    let remaining = moment()
    let timeString = ""

    if (diff_year > 1) {
        let y = Math.floor(diff_year)
        timeString += y > 1 ? `${y} years, ` : `${y} year, `
        remaining = remaining.subtract(y, "years")
        diff_month = remaining.diff(date, "months", true)
        diff_days = remaining.diff(date, "days", true)
        diff_hours = remaining.diff(date, "hours", true)
        diff_minutes = remaining.diff(date, "minutes", true)
        diff_seconds = remaining.diff(date, "seconds", true)

    }

    if (diff_month > 1) {
        let y = Math.floor(diff_month)
        timeString += y > 1 ? `${y} months, ` : `${y} month, `
        remaining = remaining.subtract(y, "months")
        diff_days = remaining.diff(date, "days", true)
        diff_hours = remaining.diff(date, "hours", true)
        diff_minutes = remaining.diff(date, "minutes", true)
        diff_seconds = remaining.diff(date, "seconds", true)
    }

    if (diff_days > 1) {
        let y = Math.floor(diff_days)
        timeString += y > 1 ? `${y} days, ` : `${y} day, `
        remaining = remaining.subtract(y, "days")
        diff_hours = remaining.diff(date, "hours", true)
        diff_minutes = remaining.diff(date, "minutes", true)
        diff_seconds = remaining.diff(date, "seconds", true)
    }

    if (diff_hours > 1) {
        let y = Math.floor(diff_hours)
        timeString += y > 1 ? `${y} hours, ` : `${y} hour, `
        remaining = remaining.subtract(y, "hours")
        diff_minutes = remaining.diff(date, "minutes", true)
        diff_seconds = remaining.diff(date, "seconds", true)
    }

    if (diff_minutes > 1) {
        let y = Math.floor(diff_minutes)
        timeString += y > 1 ? `${y} minutes, ` : `${y} minute, `
        remaining = remaining.subtract(y, "minutes")
        diff_seconds = remaining.diff(date, "seconds", true)
    }

    let y = Math.floor(diff_seconds)
    timeString += y > 1 ? `${y} seconds ` : `${y} second `

    return timeString
}

// Format a value (money)
export function formatValue(x) {

    x = Math.round(parseFloat(x))

    // Add prefix if negative
    let prefix = x < 0 ? "- " : ""

    x = Math.abs(x)

    let xLength = x.toString().length
    let format = `£${(x)}`

    if (xLength == 4) {
        format = `${prefix}£${(x / 1000).toFixed(1)}k`
    } else if (xLength > 4 && xLength <= 6) {
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