import React, { Component } from "react";
import { formatValue, movingAvg } from '../utils.js';

import * as d3 from 'd3'
import '../styles/graphs/LineGraph.scss';

class LineGraph extends Component {
    componentDidMount() {
        lineGraph(this.props.data, this.props.id)
    }

    componentDidUpdate() {
        lineGraph(this.props.data, this.props.id)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_lineGraph"></div>
            <div className="tooltip_lineGraph">
                <div className="tooltip_date">
                    <span id="date"></span>
                </div>
                <div className="tooltip_items">
                    <div className="tooltip_item"><p id="amount_ITM_name">In the Market</p><span id="amount_ITM_val"></span></div>
                    <div className="tooltip_item"><p id="amount_return_cum_name">Return</p><span id="amount_return_cum_val"></span></div>
                    <hr></hr>
                    <div className="tooltip_item"><p id="value_name">Value</p><span id="value_val"></span></div>
                </div>
            </div>
        </div>
    }
}

function lineGraph(data, id) {
    //TODO

    // Add moving avgs
    // only keep 1/x e.g. 1 in 7. Then smooth the points?
    // Scrollable/zoomable
    // Auto date format
    // Add args (lines/data items, default date range, moving avg)

    // Add loading text
    let container_loading = document.getElementById("loading_lineGraph")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild);
        }

        // Extract the right dataset
        const dataset = JSON.parse(data)[1]

        let values = dataset.map(r => parseFloat(r.value));
        let values_mva = movingAvg(values, 300)

        let itm = dataset.map(r => parseFloat(r.amount_ITM));
        let itm_ma = movingAvg(itm, 300)

        let returns = dataset.map(r => parseFloat(r.amount_return_cum));
        let returns_ma = movingAvg(returns, 300)

        // Need to be able to map back
        dataset.forEach(function(row, i){
            row.value_ma = values_mva[i]
            row.itm_ma = itm_ma[i]
            row.return_ma = returns_ma[i]
        })

        // Initialise dimensions
        const dimensions = {
            width: 1100,
            height: 600,
            margin: {
                top: 20,
                right: 20,
                bottom: 50,
                left: 90,
            },
        }

        dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

        const dateParser_axis = d3.timeParse("%Y-%m-%d")
        const dateParser_tooltip = d3.timeFormat("%B %-d %Y");

        // Add the svg element to the container
        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)


        // Add an element to act as the bounds of the graph area
        const bounds = svg.append("g")
            .style("transform", `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`)

        // Add a transparent rectangle to act as a listening area for the tooltip
        svg.append("rect")
            .style("transform", `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`)
            .attr("fill", "transparent")
            .attr("width", dimensions.boundedWidth)
            .attr("height", dimensions.boundedHeight)
            .attr("cursor", "crosshair")
            .on('mousemove', function (event) { onMouseMove(event) })
            .on("mouseout", function () { onMouseLeave() })

        // The lines we want to draw
        const lines = ["value_ma", "itm_ma", "return_ma"]
        const colours = ["#6bade2", "#72ca76", "#e78380"]

        // Parse the x-axis values as dates
        const xAccessor = (d) => dateParser_axis(d.date)

        // A list to record all the yAccessors, so we can later get all the y coordinates to draw the tooltip
        let yAccessors = []

        // Calculate the max/min of the y-axis
        let max_all = 0
        let min_all = 0
        lines.forEach(function (l) {

            let max = Math.max.apply(Math, dataset.map(function (i) { return i[l] }))
            let min = Math.min.apply(Math, dataset.map(function (i) { return i[l] }))

            max_all = max > max_all ? max : max_all
            min_all = min < min_all ? min : min_all

        })

        // Y-axis
        const yScale = d3
            .scaleLinear()
            .domain([min_all, max_all])
            .range([dimensions.boundedHeight, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .ticks(7)
            .tickSize(-dimensions.boundedWidth, 0, 0)
            .tickFormat((x) => formatValue(x))
            .tickPadding(10)

        bounds.append("g")
            .call(yAxisGenerator)
            .attr("color", "#676C72")
            .attr("font-size", "110%")
            .attr("font-family", "Baloo Thambi 2")
            .attr("font-weight", "500")
            .attr("margin-right", 30)


        // X-axis
        const xScale = d3.scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, dimensions.boundedWidth])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickPadding(15)

        bounds.append("g")
            .call(xAxisGenerator.tickFormat(d3.timeFormat("%Y")))
            .style("transform", `translateY(${dimensions.boundedHeight}px)`)
            .attr("color", "#676C72")
            .attr("font-size", "110%")
            .attr("font-family", "Baloo Thambi 2")
            .attr("font-weight", "500")


        // The x-intercept line to folow the tooltip
        const tooltipLine = bounds
            .append("g")
            .append("rect")
            .attr("class", "dotted")
            .attr("stroke-width", "1px")
            .attr("width", ".5px")
            .attr("height", dimensions.boundedHeight)

        // Draw each line
        lines.forEach(function (l, i) {

            // Add the accessor to later help us with the tooltip
            const yAccessor = (d) => d[l]
            yAccessors.push(yAccessor)

            // Draw the line
            const lineGenerator = d3
                .line()
                .x((d) => xScale(xAccessor(d)))
                .y((d) => yScale(yAccessor(d)))
                .curve(d3.curveBasis)

            bounds
                .append("path")
                .attr("d", lineGenerator(dataset))
                .attr("fill", "none")
                .attr("stroke", colours[i])
                .attr("stroke-width", 3)

            // Append the tooltip marker
            bounds
                .append("circle")
                .attr("class", "tooltip-circle")
                .attr("id", `${l}_circ`)
                .attr("r", 5)
                .attr("stroke", "white")
                .attr("fill", colours[i])
                .attr("stroke-width", 3)
                .style("opacity", 0)


        })

        function onMouseMove(event) {
            // Get the x-axis position
            const mousePosition = d3.pointer(event)
            const hoveredDate = xScale.invert(mousePosition[0])

            // Get the closest date point to our position
            const getDistance = (d) => Math.abs(xAccessor(d) - hoveredDate)
            const closestIndex = d3.scan(dataset, (a, b) => getDistance(a) - getDistance(b))
            const closestDataPoint = dataset[closestIndex]
            const closestXValue = xAccessor(closestDataPoint)

            // Update the tooltip for each line
            yAccessors.forEach(function (a, i) {
                // Get the closest point
                const closestYValue = a(closestDataPoint)

                d3.select(`#${lines[i]}_val`)
                    .html(formatValue(closestYValue))
                    .attr("color", "black")

                // Update the position of the tooltip marker
                d3.select(`#${lines[i]}_circ`)
                    .attr("cx", xScale(closestXValue))
                    .attr("cy", yScale(closestYValue))
                    .style("opacity", 1)
            })

            // Format the tooltip 
            d3.select(".tooltip_lineGraph").select("#date").text(dateParser_tooltip(closestXValue))

            d3.select(".tooltip_lineGraph")
                .style("transform",
                    `translate(
                    calc( -35% + ${xScale(closestXValue) + dimensions.margin.left}px),
                    calc(-100% + ${event.clientY}px))`)
                .style("opacity", 1)


            tooltipLine
                .attr("x", xScale(closestXValue))
                .style("opacity", 1)

        }

        function onMouseLeave() {
            // Remove the marker for each line
            lines.forEach(function (l, i) {
                let circle = d3.select(`#${l}_circ`)
                circle.style("opacity", 0)
            })

            // Remove the tooltip and line
            d3.select(".tooltip_lineGraph").style("opacity", 0)
            tooltipLine.style("opacity", 0)

        }
    }
}

export default LineGraph;