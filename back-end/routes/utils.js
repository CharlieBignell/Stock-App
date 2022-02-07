import moment from 'moment';

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