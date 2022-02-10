import React, { Component } from "react";
import { colours_smooth } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/PieChart.scss';

class PieChart extends Component {
    componentDidMount() {
        pieChart(this.props.data, this.props.id, colours_smooth)
    }

    componentDidUpdate() {
        pieChart(this.props.data, this.props.id, colours_smooth)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_pieChart"></div>
            <div id="tooltip_pieChart" className="tooltip">
                {/* <p id="tooltip_treeMap_ticker"></p>
                <p id="tooltip_treeMap_return"></p> */}
            </div>
        </div>
    }
}

function pieChart(data, id, colours) {

    // Add loading text
    let container_loading = document.getElementById("loading_pieChart")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild);
        }

        let dataset = JSON.parse(data).pieChart

        for(let i = 0; i < dataset.length; i++){
            dataset[i].nodeData.colour = colours[i]
            for (let sd of dataset[i].subData){
                sd.nodeData.colour = colours[i]
            }
        }

        const margin = { top: 20, right: 20, bottom: 20, left: 20, }

        const width = 400 - margin.left - margin.right
        const height = 400 - margin.top - margin.bottom

        const maxRadius = Math.min(width, height) / 2;

        let svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ((width / 2) + margin.left) + "," + ((height / 2) + margin.top) + ")")

        // Format the multi-level data
        let multiLevelData = []

        let level = dataset.length
        let counter = 0
        let currentLevelData = []
        let queue = []

        for (let d of dataset) {
            queue.push(d)
        }

        while (queue.length !== 0) {
            let node = queue.shift()
            currentLevelData.push(node)
            level--

            if (node.subData) {
                for (let sd of node.subData) {
                    queue.push(sd)
                    counter++
                }
            }

            if (level === 0) {
                level = counter;
                counter = 0
                multiLevelData.push(currentLevelData)
                currentLevelData = []
            }
        }

        const pieWidth = parseInt(maxRadius / multiLevelData.length) - multiLevelData.length;

        const drawPieChart = function (_data, index) {

            let pie = d3.pie()
                .sort(null)
                .value((d) => d.nodeData.share)

            let arc = d3.arc()
                .outerRadius((index + 1) * pieWidth - 1)
                .innerRadius(index * pieWidth)

            var g = svg.selectAll(".arc" + index)
                .data(pie(_data))
                .enter()
                .append("g")
                .attr("class", "arc")

            g.append("path")
                .attr("d", arc)
                .style("fill", (d) => d.data.nodeData.colour)
        }

        for (var i = 0; i < multiLevelData.length; i++) {
            var _cData = multiLevelData[i];
            drawPieChart(_cData, i);
        }

    }
}

export default PieChart;