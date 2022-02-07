import React, { Component } from "react";
// import {  } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/TreeMap.scss';

class TreeMap extends Component {
    componentDidMount() {
        treeMap(this.props.data, this.props.id, this.props.colourScale, this.props.dateRange)
    }

    componentDidUpdate() {
        treeMap(this.props.data, this.props.id, this.props.colourScale, this.props.dateRange)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_treeMap"></div>
            <div id="tooltip_treeMap" className="tooltip">
                {/* <p id="tooltip_"></p>
                <p id="tooltip_"></p> */}
            </div>
        </div>
    }
}

function treeMap(data, id, colourScale, dateRange = "a") {

    // Add loading text
    let container_loading = document.getElementById("loading_treeMap")
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
        let dataset = JSON.parse(data).treeMap

        var margin = { top: 10, right: 10, bottom: 10, left: 10 },
            width = 1100 - margin.left - margin.right,
            height = 360 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        data = []

        dataset.forEach((d) => {
            if (d.dateRange == dateRange) {
                d.parent = "parent"
                data.push(d)
            }
        });

        data.sort((a, b) => (parseFloat(a.share) < parseFloat(b.share)) ? 1 : -1)

        data.push({
            parent: "",
            ticker: "parent"
        })

        const root = d3.stratify()
            .id((d) => d.ticker)
            .parentId((d) => d.parent)
            (data)

        root.sum((d) => +d.share)

        d3.treemap()
            .size([width, height])
            // .padding(0)
            (root)
        console.log(colourScale)

        let colourDomain = [90, 95, 100, 105, 100]

        switch(dateRange){
            case "y":
            case "a":
                break;
            case "m":
                colourDomain = [95, 97.5, 100, 102.5, 105]
            case "w":
                colourDomain = [98, 99, 100, 101, 102]

        }
        var scale = d3.scaleThreshold()
            .range(colourScale)
            .domain(colourDomain)

        // use this information to add rectangles:
        svg
            .selectAll("rect")
            .data(root.leaves())
            .join("rect")
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .attr("class", "treeMap_rect")
            .attr("fill", (d) => scale(d.data.return))


        // and to add the text labels
        svg
            .selectAll("text")
            .data(root.leaves())
            .join("text")
            .attr("x", (d) => d.x0 + 10)
            .attr("y", (d) => d.y0 + 20)
            .text(function (d) {
                return (16 * d.data.ticker.length) <= (d.x1 - d.x0) ? d.data.ticker : "..."
            })
            .attr("class", "treeMap_text")
    }
}

export default TreeMap;