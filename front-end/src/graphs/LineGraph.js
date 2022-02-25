import React, { Component } from "react";
import { formatValue, getMovingAvgs, setRange, red, green, blue } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/LineGraph.scss';
import MultiToggle from "react-multi-toggle";

const view = [
    {
        displayName: 'Portfolio',
        value: 'p'
    },
    {
        displayName: 'Market',
        value: "m"
    }
];

class LineGraph extends Component {

    constructor(props) {
        super(props)

        this.state = {
            view: "p",
        }

    }

    onViewSelect = value => this.setState({ view: value });

    componentDidMount() {
        lineGraph(this.props.data, this.props.id, this.props.movingAvgWin, this.props.dateRange, this.state.view)
    }

    componentDidUpdate() {
        lineGraph(this.props.data, this.props.id, this.props.movingAvgWin, this.props.dateRange, this.state.view)
    }

    render() {
        return <div id={this.props.id} className="card_inner">
            <div id="lineGraphHeader">
                <p>Legend</p>
                <p>MA dropdown</p>
                <MultiToggle
                    options={view}
                    selectedOption={this.state.view}
                    onSelectOption={this.onViewSelect}
                />
            </div>

            <div id="loading_lineGraph" className="loadingDiv"></div>
            <div className="tooltip" id="tooltip_lineGraph">
                <div className="tooltip_date">
                    <span id="date"></span>
                </div>
                <div id="portfolio_items">
                    <div className="tooltip_item"><p id="amount_ITM_name">In the Market</p><span id="amount_ITM_val"></span></div>
                    <div className="tooltip_item"><p id="amount_return_cum_name">Return</p><span id="amount_return_cum_val"></span></div>
                    <hr></hr>
                    <div className="tooltip_item"><p id="value_name">Value</p><span id="value_val"></span></div>
                </div>
                <div id="market_items">
                    <div className="tooltip_item"><p id="spy_name">SPY</p><span id="spy_val"></span></div>
                    <div className="tooltip_item"><p id="russell_name">Russell 2k</p><span id="russell_val"></span></div>
                </div>
            </div>
        </div>
    }
}

function lineGraph(data, id, movingAvgWin, dateRange, view) {

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
        container_loading.style.height = 0;

        if (document.getElementById(`#${id}_svg`)) { document.getElementById(`#${id}_svg`).remove() }

        // Extract the right dataset and generate the rquired moving avg lines
        let dataset = JSON.parse(data).lineGraph
        let lines = []

        if (view == "m") {
            lines = ["spy", "russell"]
        } else {
            lines = ["value", "amount_ITM", "amount_return_cum"]
        }

        dataset = setRange(dataset, dateRange)
        dataset = getMovingAvgs(dataset, lines, movingAvgWin)

        // Initialise dimensions

        const margin = { top: 10, right: 55, bottom: 50, left: 90 }

        const width = document.getElementById("card_line").clientWidth - margin.left - margin.right
        const height = document.getElementById("card_line").clientHeight - margin.top - margin.bottom - 88

        // Date parsers - one for the axis and one for the tooltip
        let dateParser_axis = d3.timeParse("%Y-%m-%d")
        let dateParser_tooltip = d3.timeFormat("%B %-d %Y")

        const colours = [red, green, blue]

        // For all, just show the year
        let dateFormat_axis = d3.timeFormat("%Y")

        switch (dateRange) {
            case "y":
                dateFormat_axis = d3.timeFormat("%b")
                break;
            case "m":
                dateFormat_axis = d3.timeFormat("%b %d")
                break;
            case "w":
                break;
        }

        // Add the svg element to the container
        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("id", `#${id}_svg`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)


        // Add an element to act as the bounds of the graph area
        const bounds = svg.append("g")
            .style("transform", `translate(${margin.left}px,${margin.top}px)`)

        // Add a transparent rectangle to act as a listening area for the tooltip
        svg.append("rect")
            .style("transform", `translate(${margin.left}px,${margin.top}px)`)
            .attr("class", "listeningRect_lineGraph")
            .attr("width", width)
            .attr("height", height)
            .on('mousemove', function (event) { onMouseMove(event) })
            .on("mouseout", function () { onMouseLeave() })

        // Parse the x-axis values as dates
        const xAccessor = (d) => dateParser_axis(d.date)

        // A list to record all the yAccessors, so we can later get all the y coordinates to draw the tooltip
        let yAccessors = []

        // Calculate the max/min of the y-axis
        let max_all = 0
        let min_all = 0
        lines.forEach(function (l) {

            let max = Math.max.apply(Math, dataset.map(function (i) { return i[`${l}_ma`] }))
            let min = Math.min.apply(Math, dataset.map(function (i) { return i[`${l}_ma`] }))

            max_all = max > max_all ? max : max_all
            min_all = min < min_all ? min : min_all

        })

        // Y-axis
        const yScale = d3
            .scaleLinear()
            .domain([min_all, max_all])
            .range([height, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .ticks(5)
            .tickSize(-width, 0, 0)
            .tickFormat((x) => formatValue(x))
            .tickPadding(10)

        bounds.append("g")
            .call(yAxisGenerator)
            .attr("class", "axis_lineGraph")

        // X-axis
        const xScale = d3.scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, width])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickPadding(15)

        bounds.append("g")
            .call(xAxisGenerator.tickFormat(dateFormat_axis))
            .style("transform", `translateY(${height}px)`)
            .attr("class", "axis_lineGraph")


        // The x-intercept line to folow the tooltip
        const tooltipLine = bounds
            .append("g")
            .append("rect")
            .attr("class", "tooltip_line")
            .attr("height", height)

        const tooltip = d3.select("#tooltip_lineGraph")

        // Draw each line
        lines.forEach(function (l, i) {

            // Add the accessor to later help us with the tooltip
            const yAccessor = (d) => d[`${l}_ma`]
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
                .attr("class", "line_lineGraph")
                .attr("stroke", colours[i])

            // Append the tooltip marker
            bounds
                .append("circle")
                .attr("class", "tooltip_marker_lineGraph")
                .attr("id", `${l}_circ`)
                .attr("fill", colours[i])
                .attr("r", 5)

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

            document.getElementById("market_items").style.display = "none"
            document.getElementById("portfolio_items").style.display = "none"

            const items_id = view == "m" ? "market_items" : "portfolio_items"
            document.getElementById(items_id).style.display = "flex"

            // Update the tooltip for each line
            yAccessors.forEach(function (a, i) {
                // Get the closest point
                const closestYValue = a(closestDataPoint)

                d3.select(`#${lines[i]}_val`)
                    .html(formatValue(closestYValue))

                // Update the position of the tooltip marker
                d3.select(`#${lines[i]}_circ`)
                    .attr("cx", xScale(closestXValue))
                    .attr("cy", yScale(closestYValue))
                    .style("opacity", 1)
            })

            // Format the tooltip 
            tooltip
                .select("#date")
                .text(dateParser_tooltip(closestXValue))

            tooltip
                .style("transform",
                    `translate(
                    calc(-50% + ${event.x}px),
                    calc(-100% + ${event.y}px))`)
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
            tooltip.style("opacity", 0)
            tooltipLine.style("opacity", 0)

        }
    }
}

export default LineGraph;