import React, { Component } from "react";
import { formatValue } from '../utils.js';

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

                    <p className="summary_heading">Invested</p>
                    <p id="invested" className = "summary_value"></p>

                    <p className="summary_heading">In the Market</p>
                    <p id="itm" className = "summary_value"></p>

                    <p className="summary_heading">Current Value</p>
                    <div id="value_container">
                        <p id="value" className = "summary_value"></p>
                        <p id="return_num" className = "summary_value"></p>
                        <p id="return_per" className = "summary_value"></p>
                    </div>

                    <p className="summary_heading">Volatility</p>
                    <p id="vix" className = "summary_value"></p>

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
        document.getElementById("summary_content").style.display = "block"

        // Extract the right dataset and generate the rquired moving avg lines
        let dataset = JSON.parse(data).summary

        let return_num = formatValue(dataset[0].totalReturn_amount)
        let return_per = `(+${dataset[0].totalReturn_per}%)`
        let vix = `${dataset[0].VIX_current}`

        switch (dateRange) {
            case "w":
                return_num = formatValue(dataset[0].weekReturn_amount)
                return_per = `(+${dataset[0].weekReturn_per}%)`
                vix = `${dataset[0].VIX_week}`
                break;
            case "m":
                return_num = formatValue(dataset[0].monthReturn_amount)
                return_per = `(+${dataset[0].monthReturn_per}%)`
                vix = `${dataset[0].VIX_month}`
                break;
            case "y":
                return_num = formatValue(dataset[0].yearReturn_amount)
                return_per = `(+${dataset[0].yearReturn_per}%)`
                vix = `${dataset[0].VIX_year}`
                break;
        }

        document.getElementById("invested").innerHTML = formatValue(dataset[0].totalInvested)
        document.getElementById("itm").innerHTML = formatValue(dataset[0].totalITM)
        document.getElementById("value").innerHTML = formatValue(dataset[0].currentValue)
        document.getElementById("return_num").innerHTML = return_num
        document.getElementById("return_per").innerHTML = return_per
        document.getElementById("vix").innerHTML = vix

    }
}
export default Summary;
