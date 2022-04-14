import React, { Component } from "react";
import { formatValue, red, green } from '../utils.js';

import '../styles/components/Summary.scss';

class Summary extends Component {

    componentDidMount() {
        generateSummary(this.props.data, this.props.dateRange)
    }

    componentDidUpdate() {
        generateSummary(this.props.data, this.props.dateRange)
    }

    render() {
        return (
            <div id="main_summary">
                <div id="loading_summary" className="loadingDiv"></div>
                <h2 className="cardTitle" id="title_summary">Summary</h2>

                <div id="summary_content">
                    <div>
                        <p className="summary_heading">Invested</p>
                        <p id="invested" className="summary_value"></p>
                    </div>

                    <div>
                        <p className="summary_heading">In the Market / Withdrawn</p>
                        <p id="itm" className="summary_value"></p>
                    </div>

                    <div>
                        <p className="summary_heading">Current Value</p>
                        <div id="value_container">
                            <p id="value" className="summary_value"></p>
                            <p id="return" className="summary_value"></p>
                        </div>
                    </div>

                    <div>
                        <p className="summary_heading" id="vol_heading">Volatility (mean VIX)</p>
                        <p id="vix" className="summary_value"></p>
                    </div>


                </div>

            </div>
        );
    }
}

function generateSummary(data, dateRange) {

    // Add loading text
    let container_loading = document.getElementById("loading_summary")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild);
        }

        container_loading.style.height = 0;
        document.getElementById("title_summary").style.display = "block"
        document.getElementById("summary_content").style.display = "flex"

        // Extract the right dataset and generate the rquired moving avg lines
        let dataset = JSON.parse(data).summary

        let return_num = dataset[0].totalReturn_amount
        let return_per = dataset[0].totalReturn_per
        let vix = dataset[0].VIX_current

        document.getElementById("vol_heading").innerHTML = "Volatility (mean VIX)"

        switch (dateRange) {
            case "w":
                return_num = dataset[0].weekReturn_amount
                return_per = dataset[0].weekReturn_per
                vix = `${dataset[0].VIX_week}`
                break;
            case "m":
                return_num = dataset[0].monthReturn_amount
                return_per = dataset[0].monthReturn_per
                vix = `${dataset[0].VIX_month}`
                break;
            case "y":
                return_num = dataset[0].yearReturn_amount
                return_per = dataset[0].yearReturn_per
                vix = `${dataset[0].VIX_year}`
                break;
            default:
                document.getElementById("vol_heading").innerHTML = "Volatility (current VIX)"
        }

        let prefix = return_num >= 0 ? "+" : ""
        let colour = return_num > 0 ? green : red

        let return_string = `&nbsp;&nbsp;${prefix}${formatValue(return_num)} (${prefix}${return_per}%)`
        let vix_string = `${vix}`

        // These are static
        document.getElementById("invested").innerHTML = formatValue(dataset[0].totalInvested)
        document.getElementById("itm").innerHTML = `${formatValue(dataset[0].totalITM)} / ${formatValue(dataset[0].totalInvested - dataset[0].totalITM)}`
        document.getElementById("value").innerHTML = formatValue(dataset[0].currentValue)

        // These change when the date range is changed
        document.getElementById("return").innerHTML = return_string
        document.getElementById("return").style.color = colour
        document.getElementById("vix").innerHTML = vix_string

    }
}
export default Summary;
