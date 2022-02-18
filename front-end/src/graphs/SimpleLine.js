import React, { Component } from "react";
import { getMovingAvgs, setRange, green, red } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/SimpleLine.scss';

class SimpleLine extends Component {
    componentDidMount() {
        simpleLine(this.props.data, this.props.id, this.props.movingAvgWin, this.props.dateRange, this.props.subject)
    }

    componentDidUpdate() {
        simpleLine(this.props.data, this.props.id, this.props.movingAvgWin, this.props.dateRange, this.props.subject)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_simpleLine"></div>
        </div>
    }
}

function simpleLine(data, id, movingAvgWin, dateRange = "a", subject = "all") {

    // Add loading text
    let container_loading = document.getElementById("loading_simpleLine")
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
        let dataset = JSON.parse(data).simpleLine

        data = []

        if (subject === "all") {
            dataset.all.forEach((d) => data.push({ date: d.date, value: d.value }))
        } else {
            let relevant = dataset.stock.filter(r => r.ticker === subject)
            relevant.forEach((d) => data.push({ date: d.date, value: parseFloat(d.close) }))
        }

        data = setRange(data, dateRange)
        data = getMovingAvgs(data, ["value"], movingAvgWin)

        const colour = parseFloat(data[0].value_ma) <= parseFloat(data[data.length - 1].value_ma) ? green : red

        const margin = { top: 50, right: 50, bottom: 50, left: 50 }
        const width = 600 - margin.left - margin.right
        const height = 500 - margin.top - margin.bottom

        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const xAccessor = (d) => d3.timeParse("%Y-%m-%d")(d.date)
        const yAccessor = (d) => parseFloat(d.value_ma)

        var x = d3.scaleTime()
            .domain(d3.extent(data, xAccessor))
            .range([0, width])

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(0))


        var y = d3.scaleLinear()
            .domain(d3.extent(data, yAccessor))
            .range([height, 0])

        svg.append("g")
            .call(d3.axisLeft(y).ticks(0))

        const area = d3.area()
            .x((d) => x(xAccessor(d)))
            .y0(height)
            .y1((d) => y(yAccessor(d)));

        const line = d3.line()
            .x((d) => x(xAccessor(d)))
            .y((d) => y(yAccessor(d)))

        // svg.append("linearGradient")
        //     .attr("id", "area-gradient")
        //     .attr("gradientUnits", "userSpaceOnUse")
        //     .attr("x1", '0%').attr("y1", '0%')
        //     .attr("x2", '0%').attr("y2", '100%')

        //     .selectAll("stop")
        //     .data([
        //         { offset: "0%", color: colour },
        //         { offset: "95%", color: "transparent" }
        //     ])
        //     .enter().append("stop")
        //     .attr("offset", function (d) { return d.offset; })
        //     .attr("stop-color", function (d) { return d.color; });


        svg.append("path")
            .datum(data)
            // .attr("class", "area")
            .attr("stroke", colour)
            .attr("d", line);
            
    }

}

export default SimpleLine;