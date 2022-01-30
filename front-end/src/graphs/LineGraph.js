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
        return <div id={this.props.id}></div>;
    }
}

function lineGraph(data, id) {

    let container = document.getElementById(id)
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container.appendChild(text)

    if (data !== "NULL") {
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }

        let dataset = JSON.parse(data)[1]

        const dateParser = d3.timeParse("%Y-%m-%d");

        let max = Math.max.apply(Math, dataset.map(function(o) { return o.spy; }))
        let min = Math.min.apply(Math, dataset.map(function(o) { return o.spy; }))

        const yAccessor = (d) => d.spy;
        const xAccessor = (d) => dateParser(d.date);

        let dimensions = {
            // TODO: Automate width/height
            width: 800,
            height: 600,
            margin: {
                top: 30,
                right: 30,
                bottom: 30,
                left: 50,
            },
        };

        dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);

        const bounds = svg
            .append("g")
            .style("transform",
                `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
            );


        const yScale = d3
            .scaleLinear()
            .domain([min, max])
            .range([dimensions.boundedHeight, 0]);

        const xScale = d3
            .scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, dimensions.boundedWidth]);

        const lineGenerator = d3
            .line()
            .x((d) => xScale(xAccessor(d)))
            .y((d) => yScale(yAccessor(d)))
            .curve(d3.curveBasis);

        const line = bounds
            .append("path")
            .attr("d", lineGenerator(dataset))
            .attr("fill", "none")
            .attr("stroke", "Red")
            .attr("stroke-width", 2);

        const yAxisGenerator = d3.axisLeft().scale(yScale);
        const yAxis = bounds.append("g").call(yAxisGenerator);

        const xAxisGenerator = d3.axisBottom().scale(xScale);
        const xAxis = bounds
            .append("g")
            .call(xAxisGenerator.tickFormat(d3.timeFormat("%b,%y")))
            .style("transform", `translateY(${dimensions.boundedHeight}px)`);
    }
}

export default LineGraph;