import React, { Component } from "react";
// import {  } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/TreeMap.scss';

class TreeMap extends Component {
    componentDidMount() {
        treeMap(this.props.data, this.props.id, this.props.colours, this.props.dateRange)
    }

    componentDidUpdate() {
        treeMap(this.props.data, this.props.id, this.props.colours, this.props.dateRange)
    }

    render() {
        return <div id={this.props.id}>
            <div id="loading_barChart"></div>
            <div id="tooltip_treeMap" className="tooltip">
                {/* <p id="tooltip_"></p>
                <p id="tooltip_"></p> */}
            </div>
        </div>
    }
}

function treeMap(data, id, colours, dateRange = "a") {

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
        let dataset = JSON.parse(data)[2]

        var margin = { top: 10, right: 10, bottom: 10, left: 10 },
            width = 600 - margin.left - margin.right,
            height = 445 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select(`#${id}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        data = []

        dataset.forEach(d => {
            if(d.date == "2022-02-03"){
                d.parent = "parent"
                data.push(d)
            }
            if(d.ticker == "GOOG"){
                d.value = 5000
            }
        });

        data.sort((a, b) => (parseFloat(a.value) < parseFloat(b.value)) ? 1 : -1)

        data.push({
            parent: "",
            ticker:  "parent"
        })
        
        console.log(data)
        // stratify the data: reformatting for d3.js
        const root = d3.stratify()
            .id(function (d) { return d.ticker; })   // Name of the entity (column name is name in csv)
            .parentId(function (d) { return d.parent; })   // Name of the parent (column name is parent in csv)
            (data);
        root.sum(function (d) { return +d.value })   // Compute the numeric value for each entity

        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([width, height])
            .padding(4)
            (root)

        // use this information to add rectangles:
        svg
            .selectAll("rect")
            .data(root.leaves())
            .join("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "#69b3a2");

        // and to add the text labels
        svg
            .selectAll("text")
            .data(root.leaves())
            .join("text")
            .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
            .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
            .text(function (d) { return d.data.ticker })
            .attr("font-size", "15px")
            .attr("fill", "white")


    }
}

export default TreeMap;