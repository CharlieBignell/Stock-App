import React, { Component } from "react";
import { getReturns, roundedRect } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/BarChart.scss';

class BarChart extends Component {
    componentDidMount() {
        barChart(this.props.data, this.props.id, this.props.colours, this.props.dateRange)
    }

    componentDidUpdate() {
        barChart(this.props.data, this.props.id, this.props.colours, this.props.dateRange)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_barChart"></div>
            <div id="tooltip_barChart" className="tooltip">
                <p id="tooltip_barChart_name"></p>
                <p id="tooltip_barChart_return"></p>
            </div>
        </div>
    }
}

function barChart(data, id, colours, dateRange = "a") {

    // Add loading text
    let container_loading = document.getElementById("loading_barChart")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild);
        }

        // Extract the right dataset and generate the rquired moving avg lines
        let dataset = JSON.parse(data)[1]

        // TODO: add value - MWRR or TWRR
        let bars = [
            { name: "spy", displayName: "SPY" },
            { name: "nasdaq", displayName: "NASDAQ" },
            { name: "dow", displayName: "Dow" },
            { name: "russell", displayName: "Russell 2k" }
            // { name: "ftse", displayName: "FTSE 100" }
        ]

        // Get return and calculate the max and min val using each bar
        let maxVal = 0
        let minVal = 0
        bars.forEach(function (b, i) {
            b.val = getReturns(dataset, b.name, dateRange)
            b.colour = colours[i]
            maxVal = Math.max(b.val, maxVal)
            minVal = Math.min(b.val, minVal)
        })

        let margin = { top: 50, right: 50, bottom: 50, left: 60 }
        let width = 460 - margin.left - margin.right
        let height = 400 - margin.top - margin.bottom

        // Append the chart area
        let svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        // X axis
        let x = d3.scaleBand()
            .range([0, width])
            .domain(bars.map(d => d.displayName))
            .padding(0.5)

        let xAxis = d3.axisBottom(x)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickPadding(12)

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("class", "axisText")

        // Y axis
        let y = d3.scaleLinear()
            .domain([(minVal), maxVal])
            .range([height, 0])

        let yAxis = d3.axisLeft(y)
            .ticks(6)
            .tickSize(-width, 0, 0)
            .tickFormat((x) => `${x}%`)
            .tickPadding(12)

        svg.append("g")
            .call(yAxis)
            .selectAll("text")
            .attr("class", "axisText")
            .attr("color", "#454B53")

        svg.append("g")
            .attr("class", "axis")
            .append("line")
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("x1", 0)
            .attr("x2", width);

        // Bars
        svg.selectAll(".bar")
            .data(bars)
            .enter()
            .append("path")
            .attr("class", "bar")
            .attr("fill", d => d.colour)
            .on('mousemove', function (event, d) { onMouseMove(event, d) })
            .on("mouseout", function () { onMouseLeave() })
            .attr("stroke", "white")
            .attr("d", function (d) {
                let bx = x(d.displayName)
                let by = y(Math.max(0, d.val))
                let bw = x.bandwidth()
                let bh = Math.abs(y(d.val) - y(0))
                let r = 8
                let tl = d.val > 0 ? true : false
                let tr = d.val > 0 ? true : false
                let bl = d.val > 0 ? false : true
                let br = d.val > 0 ? false : true
                return roundedRect(bx, by, bw, bh, r, tl, tr, bl, br)
            })

        let tooltip = d3.select(`#tooltip_barChart`)

        function onMouseMove(event, d) {
            tooltip
                .style("opacity", "1")
                .style("transform",
                    `translate(
                    calc(-50% + ${event.x}px),
                    calc(-110% + ${event.y}px))`)

            tooltip
                .select("#tooltip_barChart_name")
                .text(d.displayName)
            
            tooltip
                .select("#tooltip_barChart_return")
                .text(d.val + "%")

        }

        function onMouseLeave() {
            tooltip.style("opacity", "0")
        }




    }
}

export default BarChart;