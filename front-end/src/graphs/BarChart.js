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
            <div className="tooltip_barChart">
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

        // TODO: add value
        // Add FTSE if needed: { name: "ftse", displayName: "FTSE 100" }
        let bars = [{ name: "spy", displayName: "SPY" }, { name: "nasdaq", displayName: "NASDAQ" }, { name: "dow", displayName: "Dow" }, { name: "russell", displayName: "Russell 2k" }]
        let maxVal = 0
        let minVal = 0

        bars.forEach(function (b, i) {
            b.val = getReturns(dataset, b.name, dateRange)
            b.colour = colours[i]
            maxVal = Math.max(b.val, maxVal)
            minVal = Math.min(b.val, minVal)
        })

        let margin = { top: 50, right: 50, bottom: 50, left: 60 }
        let width = 400 - margin.left - margin.right
        let height = 400 - margin.top - margin.bottom

        // append the svg object to the body of the page
        var svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // X axis
        var x = d3.scaleBand()
            .range([0, width])
            .domain(bars.map(d => d.displayName))
            .padding(0.4)

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            // .attr("transform", "translate(-10,0)rotate(-45)")
            // .style("text-anchor", "end");
            .attr("class", "axisText")

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([(minVal), maxVal])
            .range([height, 0])


        var yAxis = d3.axisLeft(y).ticks(6)

        svg.append("g")
            .attr("class", "x axis")
            .call(yAxis);

        // Bars
        svg.selectAll(".bar")
            .data(bars)
            .enter()
            .append("path")
            .attr("class", d => d.val < 0 ? "bar negative" : "bar positive")
            .attr("fill", d => d.colour)
            .attr("stroke-width", "2px")
            .attr("stroke", "white")
            .attr("d", function (d) {
                let bx = x(d.displayName)
                let by = y(Math.max(0, d.val))
                let bw = x.bandwidth()
                let bh = Math.abs(y(d.val) - y(0))
                let r = 9
                let tl = d.val > 0 ? true : false
                let tr = d.val > 0 ? true : false
                let bl = d.val > 0 ? false : true
                let br = d.val > 0 ? false : true
                return roundedRect(bx, by, bw, bh, r, tl, tr, bl, br)
            }
            )
        // .attr("x", function (d) { return x(d.displayName); })
        // .attr("y", function (d) { return y(Math.max(0, d.val)); })
        // .attr("width", x.bandwidth())
        // .attr("height", function (d) {
        // return Math.abs(y(d.val) - y(0));
        // })


        svg.append("g")
            .attr("class", "y axis")
            .append("line")
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("x1", 0)
            .attr("x2", width);

    }
}

export default BarChart;