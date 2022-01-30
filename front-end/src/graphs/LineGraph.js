import React, { Component } from "react";

import * as d3 from 'd3'

class LineGraph extends Component {
    componentDidMount() {
        lineGraph(this.props.data, this.props.id)
    }

    componentDidUpdate() {
        lineGraph(this.props.data, this.props.id)
    }

    render() {
        return <div id={this.props.id}>
            <div id="tooltip" class="tooltip">
                <div class="tooltip-date">
                    <span id="date"></span>
                </div>
                <div class="tooltip-Internet">
                    Internet Usage: <span id="internet"></span>
                </div>
            </div>
        </div>
    }
}

function lineGraph(data, id) {
    //TODO
    // Tooltip
    // Scrollable/zoomable
    // Legemd
    // Switch view ()
    // Add moving avgs
    // Responsive dimensions

    // Add loading text
    let container = document.getElementById(id)
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        // Clear the container (i.e. the loading text)
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }

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

        // Calculate the max/min of the y-axis
        let max_all = 600000 // TODO: AUTO GENERATE
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



                
            const listeningRect = bounds
                .append("rect")
                .attr("class", "listening-rect")
                .attr("width", dimensions.boundedWidth)
                .attr("height", dimensions.boundedHeight)
                .on("mousemove", onMouseMove)
                .on("mouseleave", onMouseLeave);

            const xAxisLine = bounds
                .append("g")
                .append("rect")
                .attr("class", "dotted")
                .attr("stroke-width", "1px")
                .attr("width", ".5px")
                .attr("height", dimensions.boundedHeight);

            //.style("transform", `translate(${0}px,${-5}px)`);
            function onMouseMove() {
                const mousePosition = d3.pointer(this);
                const hoveredDate = xScale.invert(mousePosition[0]);

                const getDistanceFromHoveredDate = (d) =>
                    Math.abs(xAccessor(d) - hoveredDate);
                const closestIndex = d3.scan(
                    dataset,
                    (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
                );
                const closestDataPoint = dataset[closestIndex];
                console.table(closestDataPoint);

                const closestXValue = xAccessor(closestDataPoint);
                const closestYValue = yAccessor(closestDataPoint);

                const formatDate = d3.timeFormat("%B %A %-d, %Y");
                tooltip.select("#date").text(formatDate(closestXValue));

                const formatInternetUsage = (d) => `${d3.format(".1f")(d)} GB`;
                tooltip.select("#internet").html(formatInternetUsage(closestYValue));

                const x = xScale(closestXValue) + dimensions.margin.left;
                const y = yScale(closestYValue) + dimensions.margin.top;

                //Grab the x and y position of our closest point,
                //shift our tooltip, and hide/show our tooltip appropriately

                tooltip.style(
                    "transform",
                    `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
                );

                tooltip.style("opacity", 1);

                tooltipCircle
                    .attr("cx", xScale(closestXValue))
                    .attr("cy", yScale(closestYValue))
                    .style("opacity", 1);

                xAxisLine.attr("x", xScale(closestXValue));
            }

            function onMouseLeave() {
                tooltip.style("opacity", 0);
                tooltipCircle.style("opacity", 0);
            }

            // Add a circle under our tooltip, right over the “hovered” point
            const tooltip = d3.select("#tooltip");
            const tooltipCircle = bounds
                .append("circle")
                .attr("class", "tooltip-circle")
                .attr("r", 4)
                .attr("stroke", "#af9358")
                .attr("fill", "white")
                .attr("stroke-width", 2)
                .style("opacity", 0);
        })




    }
}

export default LineGraph;