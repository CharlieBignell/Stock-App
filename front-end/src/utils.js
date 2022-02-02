export function formatNav(target) {
    let items = document.querySelectorAll('.item')
    items.forEach(function (i) {
        i.classList.remove('active')
    });

    document.getElementById(target).classList.add('active')
}

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