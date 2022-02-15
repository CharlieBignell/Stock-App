import React, { Component } from "react";
import '../styles/views/Overview.scss';
import { formatNav, red, green, blue } from '../utils.js';

import Header from "../components/Header";
import LineGraph from "../graphs/LineGraph";
import BarChart from "../graphs/BarChart";
import TreeMap from "../graphs/TreeMap";
import PieChart from "../graphs/PieChart";

class Overview extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "NULL",
            dateRange: "m"
        };

    }

    getData() {
        fetch("http://localhost:9000/overview")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_overview")
        this.getData();
    }

    render() {
        return (
            <div id="main_page">
                <Header />
                <div id="content">
                    <PieChart
                        data={this.state.data}
                        id="pieChart"
                    />
                    <TreeMap
                        data={this.state.data}
                        id="treeMap"
                        dateRange={this.state.dateRange}
                    />
                    <LineGraph
                        data={this.state.data}
                        id="lineGraph"
                        movingAvgWin={200}
                        lines={["value", "amount_ITM", "amount_return_cum"]}
                        colours={[blue, green, red]}
                        dateRange={this.state.dateRange}
                    />
                    <BarChart
                        data={this.state.data}
                        id="barChart"
                        dateRange={this.state.dateRange}
                    />

                </div>


            </div>
        );
    }

}

export default Overview;
