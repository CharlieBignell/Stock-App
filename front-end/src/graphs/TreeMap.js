import React, { Component } from "react";
import { colourScale, colourScale_text } from '../utils.js';

import * as d3 from 'd3'

import '../styles/graphs/TreeMap.scss';

class TreeMap extends Component {
    componentDidMount() {
        treeMap(this.props.data, this.props.id, this.props.dateRange)
    }

    componentDidUpdate() {
        treeMap(this.props.data, this.props.id, this.props.dateRange)
    }

    render() {
        return <div id={this.props.id} className="card_inner">
            <div id="loading_treeMap" className="loadingDiv"></div>
            <div id="tooltip_treeMap" className="tooltip">
                <p id="tooltip_treeMap_ticker"></p>
                <p id="tooltip_treeMap_return"></p>
            </div>
            <h2 className="cardTitle" id="title_treeMap"> Portfolio Share and Performance </h2>

        </div>
    }
}

function treeMap(data, id, dateRange = "a") {

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

        container_loading.style.height = 0;

        document.getElementById("title_treeMap").style.display = "block"

        if (document.getElementById(`#${id}_svg`)) { document.getElementById(`#${id}_svg`).remove() }

        let dataset = JSON.parse(data).treeMap

        const margin = { top: 20, right: 20, bottom: 12, left: 20 }

        const width = document.getElementById("card_treemap").clientWidth - margin.left - margin.right
        const height = document.getElementById("card_treemap").clientHeight - margin.top - margin.bottom - 48

        var svg = d3.select(`#${id}`)
            .append("svg")
            .attr("id", `#${id}_svg`)
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

        let colourDomain = [90, 95, 105, 115]
        switch (dateRange) {
            case "y":
            case "a":
                break;
            case "m":
                colourDomain = [95, 98, 102, 105]
                break;
            case "w":
                colourDomain = [97, 99.5, 100.5, 103]
                break;
        }

        var scale_rect = d3.scaleThreshold()
            .range(colourScale)
            .domain(colourDomain)

        var scale_text = d3.scaleThreshold()
            .range(colourScale_text)
            .domain(colourDomain)

        // Add rectangles
        svg
            .selectAll("rect")
            .data(root.leaves())
            .join("rect")
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .attr("class", "treeMap_rect")
            .attr('r', 10)
            .attr("fill", (d) => scale_rect(d.data.return))
            .on('mousemove', function (event, d) { onMouseMove(event, d) })
            .on("mouseout", function () { onMouseLeave() })

        // Add labels
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
            .attr("fill", (d) => scale_text(d.data.return))
            .on('mousemove', function (event, d) { onMouseMove(event, d) })


        let tooltip = d3.select(`#tooltip_treeMap`)

        function onMouseMove(event, d) {
            tooltip
                .style("opacity", "1")
                .style("transform",
                    `translate(
                    calc(-50% + ${event.x}px),
                    calc(-110% + ${event.y}px))`)

            tooltip
                .select("#tooltip_treeMap_ticker")
                .text(d.data.ticker + ` - ${d.data.share}%`)

            let prefix = d.data.return >= 100 ? "+" : ""

            tooltip
                .select("#tooltip_treeMap_return")
                .text(prefix + (d.data.return - 100).toFixed(2) + "%")

        }

        function onMouseLeave() {
            tooltip.style("opacity", "0")
        }

    }
}

export default TreeMap;