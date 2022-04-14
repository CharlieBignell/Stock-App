import React, { Component } from "react"
import { colours_smooth } from '../utils.js'

import * as d3 from 'd3'

import '../styles/graphs/AreaGraph.scss'

class AreaGraph extends Component {

    componentDidMount() {
        areaGraph(this.props.data, this.props.id, this.props.view, this.props.dateRange)
    }

    componentDidUpdate() {
        areaGraph(this.props.data, this.props.id, this.props.view, this.props.dateRange)
    }



    componentDidMount() {
        areaGraph(this.props.data, this.props.id, this.props.view, this.props.dateRange)
    }

    componentDidUpdate() {
        areaGraph(this.props.data, this.props.id, this.props.view, this.props.dateRange)
    }


    render() {
        return <div id={this.props.id} className="card_inner">
            <div id="loading_areaGraph" className="loadingDiv"></div>

            <div id="tooltip_areaGraph" className="tooltip">
                <div className="tooltip_date">
                    <span id="date"></span>
                </div>
                <div id="tooltip_items">

                </div>

            </div>
            <h2 className="cardTitle" id="title_areaGraph">Portfolio Share</h2>

        </div>
    }
}

function areaGraph(data, id, view, dateRange) {

    // Add loading text
    let container_loading = document.getElementById("loading_areaGraph")
    let text = document.createElement('p')
    text.innerHTML = "Loading..."
    container_loading.appendChild(text)

    // If we have the data, draw the graph
    if (data !== "NULL") {

        document.getElementById("title_areaGraph").style.display = "block"

        // Clear the loading text
        while (container_loading.firstChild) {
            container_loading.removeChild(container_loading.lastChild)
        }

        let dataset = JSON.parse(data).areaGraph
        container_loading.style.height = 0;

        if (document.getElementById(`#${id}_svg`)) { document.getElementById(`#${id}_svg`).remove() }

        const margin = { top: 50, right: 50, bottom: 50, left: 90 }

        const width = document.getElementById("card_areaGraph").clientWidth - margin.left - margin.right
        const height = document.getElementById("card_areaGraph").clientHeight - margin.top - margin.bottom - 55

        const dateParser = d3.timeParse("%Y-%m-%d")
        const dateFormatter = d3.timeFormat("%b %-d %Y")

        // Get a list of all column headers except date
        const keys = Object.keys(dataset[0])
        keys.shift()
        const stackedData = d3.stack().keys(keys)(dataset)

        // Set up the colours array
        let r = Math.ceil(keys.length / colours_smooth.length)
        let colours = [].concat(...Array.from({ length: r }, () => colours_smooth))

        for (let i = 0; i < keys.length; i++) {
            colours.push({
                key: keys[i],
                colour: colours[i]
            })
        }

        const svg = d3.select(`#${id}`)
            .append("svg")
            .attr("id", `#${id}_svg`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)

        // Add a clipPath: everything out of this area won't be drawn.
        const clip = svg
            .append("defs")
            .append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0)

        // Add brushing
        const brush = d3.brushX()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]])    // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

        const areaChart = svg.append('g')
            .attr("clip-path", "url(#clip)")
            .attr("class", "areaGraph_plot")
            .on('mousemove', (event, d) => onMouseMove(event, d))
            .on('mouseout', () => onMouseLeave())

        // Add X axis
        const xAccessor = (d) => dateParser(d.date)

        const x = d3.scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, width])

        const xAxisGenerator = d3.axisBottom(x)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickPadding(15)

        const xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxisGenerator)
            .attr("class", "axis_areaGraph")

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0])

        const yAxisGenerator = d3.axisLeft(y)
            .tickSize(-width, 0, 0)
            .tickFormat((x) => `${x}%`)
            .tickValues([0, 25, 50, 75, 100])
            .tickPadding(15)

        const yAxis = svg.append("g")
            .call(yAxisGenerator)
            .attr("class", "axis_areaGraph")


        const area = d3.area()
            .x((d) => x(xAccessor(d.data)))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))

        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .join("path")
            .style("fill", (d) => colours.find(c => c.key === d.key).colour)
            .style("stroke", (d) => colours.find(c => c.key === d.key).colour)
            .attr("d", area)

        areaChart
            .append("g")
            .attr("class", "brush")
            .call(brush)

        let idleTimeout

        function idled() { idleTimeout = null }

        // A function that update the chart for given boundaries
        function updateChart(event, d) {
            let extent = event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 300) // This allows to wait a little bit
                x.domain(d3.extent(dataset, xAccessor))
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])])
                areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and area position
            xAxis.transition()
                .duration(800)
                .call(d3.axisBottom(x))

            areaChart
                .selectAll("path")
                .transition().duration(800)
                .attr("d", area)
        }


        const yAccessor = function (date, key) {
            let n = d3.timeDay.count(dateParser(dataset[0].date), date)
            return dataset[n][key]
        }

        const tooltip = d3.select("#tooltip_areaGraph")

        const tooltipItems = d3.select("#tooltip_items")

        function onMouseMove(event) {

            // Get the x-axis position
            const mousePosition = d3.pointer(event)
            const hoveredDate = x.invert(mousePosition[0])

            // // Get the closest date point to our position
            const getDistance = (d) => Math.abs(xAccessor(d) - hoveredDate)
            const closestIndex = d3.scan(dataset, (a, b) => getDistance(a) - getDistance(b))
            const closestDataPoint = dataset[closestIndex]
            const closestXValue = xAccessor(closestDataPoint)

            tooltipItems.selectAll("*").remove()

            // Update the tooltip for each key
            keys.forEach(function (k) {
                let share = parseFloat(yAccessor(closestXValue, k)).toFixed(0)

                tooltipItems
                    .append("div")
                    .attr("id", `${k.replace(".", "")}_div`)
                    .attr("class", "itemDiv")

                d3.select(`#${k.replace(".", "")}_div`)
                    .append("p")
                    .html(k)
                    .style("color", colours.find(c => c.key === k).colour)

                d3.select(`#${k.replace(".", "")}_div`)
                    .append("p")
                    .html(`${share}%`)
                    .style("color", colours.find(c => c.key === k).colour)

            })

            // Format the tooltip 
            tooltip
                .select("#date")
                .text(dateFormatter(closestXValue))

            tooltip
                .style("transform",
                    `translate(
                    calc(-50% + ${event.x}px),
                    calc(15% + ${event.y}px))`)
                .style("opacity", 1)
        }
        // calc( -35% + ${x(closestXValue) + margin.left}px),
        // calc(10% + ${event.clientY}px))`)
        function onMouseLeave() {
            // Remove the tooltip and line
            tooltip.style("opacity", 0)
        }
    }
}

export default AreaGraph