import React, { Component } from "react";
import { colours_smooth } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/PieChart.scss';

class PieChart extends Component {
    componentDidMount() {
        pieChart(this.props.data, this.props.id, colours_smooth, this.props.width, this.props.height)
    }

    componentDidUpdate() {
        pieChart(this.props.data, this.props.id, colours_smooth, this.props.width, this.props.height)
    }

    render() {
        return <div id={this.props.id} className="card_inner">
            <div id="loading_pieChart" className="loadingDiv"></div>
            <div id="tooltip_pieChart" className="tooltip">
                <p id="tooltip_pieChart_name"></p>
                <p id="tooltip_pieChart_share"></p>
            </div>
            <h2 className="cardTitle" id="title_pieChart"> Sectors & Industries </h2>
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
        container_loading.style.height = 0;

        if (document.getElementById(`#${id}_svg`)) { document.getElementById(`#${id}_svg`).remove() }

        document.getElementById("title_pieChart").style.display = "block"

        let dataset = JSON.parse(data).pieChart

        for (let i = 0; i < dataset.length; i++) {
            dataset[i].nodeData.colour = colours[i]
            for (let sd of dataset[i].subData) {
                sd.nodeData.colour = colours[i]
            }
        }

        const margin = { top: 20, right: 20, bottom: 20, left: 20, }

        const width = document.getElementById("card_pie").clientWidth - margin.left - margin.right
        const height = document.getElementById("card_pie").clientHeight - margin.top - margin.bottom - 48

        const maxRadius = Math.min(width, height) / 2;

        let svg = d3.select(`#${id}`)
            .append("svg")
            .attr("id", `#${id}_svg`)
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

            let g = svg.selectAll(".arc" + index)
                .data(pie(_data))
                .enter()
                .append("g")
                .attr("class", "arc")

            g.append("path")
                .attr("d", arc)
                .attr("id", (d) => d.data.nodeData.name.replace(/ /g, "_").replace('&', ''))
                .style("fill", (d) => d.data.nodeData.colour)
                .on('mousemove', function (event, d) { onMouseMove(event, d) })
                .on("mouseout", function (event, d) { onMouseLeave(event, d) })
        }

        for (var i = 0; i < multiLevelData.length; i++) {
            var _cData = multiLevelData[i];
            drawPieChart(_cData, i);
        }

        let tooltip = d3.select(`#tooltip_pieChart`)

        function onMouseMove(event, d) {
            tooltip
                .style("opacity", "1")
                .style("transform",
                    `translate(
                calc(-50% + ${event.x}px),
                calc(-110% + ${event.y}px))`)

            tooltip
                .select("#tooltip_pieChart_name")
                .text(d.data.nodeData.name)

            tooltip

                .select("#tooltip_pieChart_share")
                .text(parseFloat(d.data.nodeData.share).toFixed(0) + "%")
            let dist = 15
            let midAngle = 0

            d3.select(event.path[0])
                .transition()
                .ease(d3.easeElastic)
                .duration(750)
                .attr('transform', function (d) {
                    midAngle = ((d.endAngle - d.startAngle) / 2) + d.startAngle
                    let x = Math.sin(midAngle) * dist
                    let y = Math.cos(midAngle) * dist
                    return `translate(${x}, ${-y})`
                })

            if (d.data.subData) {
                for (let sd of d.data.subData) {
                    d3.select(`#${sd.nodeData.name.replace(/ /g, "_").replace('&', '')}`)
                        .transition()
                        .ease(d3.easeElastic)
                        .duration(750)
                        .attr('transform', function (d) {
                            let dist = 15
                            let x = Math.sin(midAngle) * dist
                            let y = Math.cos(midAngle) * dist
                            return `translate(${x}, ${-y})`
                        })
                }
            }

            d3.select("#mainTooltip").classed("hidden", false)
        }

        function onMouseLeave(event, d) {
            tooltip.style("opacity", "0")

            d3.select(event.path[0])
                .transition()
                .ease(d3.easeLinear)
                .duration(400)
                .attr('transform', 'translate(0,0)')


            if (d.data.subData) {
                for (let sd of d.data.subData) {
                    d3.select(`#${sd.nodeData.name.replace(/ /g, "_").replace('&', '')}`)
                        .transition()
                        .ease(d3.easeLinear)
                        .duration(400)
                        .attr('transform', 'translate(0,0)')
                }

                d3.select("#mainTooltip").classed("hidden", true)
            }
        }


    }

}

export default PieChart;