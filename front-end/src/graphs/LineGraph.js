import React, { Component } from "react";

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
            <div className="tooltip_lineGraph">
                <div className="tooltip_date">
                    <span id="date"></span>
                </div>
                <div className="tooltip_items">
                    <div className="tooltip_item"><p>In the Market</p><span id="amount_ITM_val"></span></div>
                    <div className="tooltip_item"><p>Return</p><span id="amount_return_cum_val"></span></div>
                    <hr></hr>
                    <div className="tooltip_item"><p>Value</p><span id="value_val"></span></div>
                </div>
            </div>
        </div>
    }
}

function lineGraph(data, id) {
    //TODO
    
    // Check and format Tooltip
    // Clean code, rename where needed
    // Auto abbreviations
    // Auto max y
    // Check dimensions are correct
    // Add loading back in

    // Add moving avgs
    // Scrollable/zoomable
    // Add args (lines/data items, default date range, moving avg)

    // Add loading text
    let container = document.getElementById(id)
    // let text = document.createElement('p')
    // text.innerHTML = "Loading..."
    // container.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the container (i.e. the loading text)
        // while (container.firstChild) {
        // container.removeChild(container.lastChild);
        // }

        // Extract the right dataset
        let dataset = JSON.parse(data)[1]

        const dateParser = d3.timeParse("%Y-%m-%d");

        // Initialise dimensions
        let dimensions = {
            width: 1100,
            height: 600,
            margin: {
                top: 30,
                right: 30,
                bottom: 30,
                left: 90,
            },
        };

        dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

        // Add the svg element to the container
        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);


        const bounds = svg
            .append("g")
            .style("transform",
                `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
            );

        // The lines we want to draw
        let lines = ["value", "amount_ITM", "amount_return_cum"]
        let colours = ["#5FADD7", "#FF3165", "#65B89F"]
        let yAccessors = []
        // let lines = ["amount_ITM"]
        // let colours = ["#5FADD7"]


        // Calculate the max/min of the y-axis
        let max_all = 50000 // TODO: AUTO GENERATE
        let min_all = 0

        lines.forEach(function (l) {

            let max = Math.max.apply(Math, dataset.map(function (i) { return i[l] }))
            let min = Math.min.apply(Math, dataset.map(function (i) { return i[l] }))

            max_all = max > max_all ? max : max_all
            min_all = min < min_all ? min : min_all

        })

        // Parse the x-axis values as dates
        const xAccessor = (d) => dateParser(d.date)


        // Y-axis
        const yScale = d3
            .scaleLinear()
            .domain([min_all, max_all])
            .range([dimensions.boundedHeight, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .ticks(7)
            .tickSize(-dimensions.boundedWidth, 0, 0)
            .tickFormat(x => "£" + `${(x / 1000).toFixed(0)}` + "k")
            .tickPadding(10)


        const yAxis = bounds.append("g")
            .call(yAxisGenerator)
            .attr("color", "#676C72")
            .attr("font-size", "110%")
            .attr("font-family", "Baloo Thambi 2")
            .attr("font-weight", "500")
            .attr("margin-right", 30)


        // X-axis
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, dimensions.boundedWidth])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickPadding(15)

        const xAxis = bounds
            .append("g")
            .call(xAxisGenerator.tickFormat(d3.timeFormat("%Y")))
            .style("transform", `translateY(${dimensions.boundedHeight}px)`)
            .attr("color", "#676C72")
            .attr("font-size", "110%")
            .attr("font-family", "Baloo Thambi 2")
            .attr("font-weight", "500")

        // Draw each line
        lines.forEach(function (l, i) {
            const yAccessor = (d) => d[l];
            yAccessors.push(yAccessor)

            const lineGenerator = d3
                .line()
                .x((d) => xScale(xAccessor(d)))
                .y((d) => yScale(yAccessor(d)))
                .curve(d3.curveBasis);

            const line = bounds
                .append("path")
                .attr("d", lineGenerator(dataset))
                .attr("fill", "none")
                .attr("stroke", colours[i])
                .attr("stroke-width", 3)

            const tooltipCircle = bounds
                .append("circle")
                .attr("class", "tooltip-circle")
                .attr("id", l + "_circ")
                .attr("r", 5)
                .attr("stroke", "white")
                .attr("fill", colours[i])
                .attr("stroke-width", 3)
                .style("opacity", 0);
        })

        const listeningRect = bounds
            .append("rect")
            .attr("class", "listening_rect")
            .attr("width", dimensions.boundedWidth)
            .attr("height", dimensions.boundedHeight)
            .on('mousemove', function (event) { onMouseMove(event) })
            // .on("mouseleave", onMouseLeave)

        const xAxisLine = bounds
            .append("g")
            .append("rect")
            .attr("class", "dotted")
            .attr("stroke-width", "1px")
            .attr("width", ".5px")
            .attr("height", dimensions.boundedHeight);

        //.style("transform", `translate(${0}px,${-5}px)`);
        function onMouseMove(event) {
            const mousePosition = d3.pointer(event);
            const hoveredDate = xScale.invert(mousePosition[0]);

            const getDistanceFromHoveredDate = (d) => Math.abs(xAccessor(d) - hoveredDate);
            const closestIndex = d3.scan(dataset, (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b));
            const closestDataPoint = dataset[closestIndex];

            const closestXValue = xAccessor(closestDataPoint);

            let y = 0

            yAccessors.forEach(function (a, i) {
                const closestYValue = a(closestDataPoint)
                const formatValue = (x) => "£" + `${(x / 1000).toFixed(0)}` + "k"
                d3.select(`#${lines[i]}_val`).html(formatValue(closestYValue))
                y = Math.max(y, yScale(closestYValue))
                let circle = d3.select(`#${lines[i]}_circ`)
                circle
                    .attr("cx", xScale(closestXValue))
                    .attr("cy", yScale(closestYValue))
                    .style("opacity", 1)
            })


            const formatDate = d3.timeFormat("%B %-d %Y");
            tooltip.select("#date").text(formatDate(closestXValue));

            const x = xScale(closestXValue) + dimensions.margin.left;

            //Grab the x and y position of our closest point,
            //shift our tooltip, and hide/show our tooltip appropriately

            tooltip
                .style("transform", `translate(` + `calc( -35% + ${x}px),` + `calc(-100% + ${event.clientY}px)` + `)`)
                .style("opacity", 1)

            xAxisLine.attr("x", xScale(closestXValue));
        }

        function onMouseLeave() {
            console.log("tesxt")
            lines.forEach(function (l, i) {
                let circle = d3.select(`#${l}_circ`)
                circle.style("opacity", 0);
            })
            tooltip.style("opacity", 0);

        }

        // Add a circle under our tooltip, right over the “hovered” point
        const tooltip = d3.select(".tooltip_lineGraph");

    }
}

export default LineGraph;