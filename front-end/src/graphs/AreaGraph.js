import React, { Component } from "react";
// import {  } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/AreaGraph.scss';

class AreaGraph extends Component {
    componentDidMount() {
        areaGraph(this.props.data, this.props.id)
    }

    componentDidUpdate() {
        areaGraph(this.props.data, this.props.id)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_areaGraph"></div>
            {/* <div id="tooltip_areaGraph" className="tooltip">
                <p id="tooltip_areaGraph_name"></p>
                <p id="tooltip_areaGraph_price"></p>
            </div> */}
        </div>
    }
}

function areaGraph(data, id) {

    // Add loading text
    let container_loading = document.getElementById("loading_areaGraph")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild);
        }

        let dataset = JSON.parse(data).areaGraph
        console.log(dataset)

    }

}

export default AreaGraph;