import React, { Component } from "react";

import { formatNav, red, green, blue } from '../utils.js';

import Header from "../components/Header";
import LineGraph from "../graphs/LineGraph";
import BarChart from "../graphs/BarChart";
import TreeMap from "../graphs/TreeMap";
import PieChart from "../graphs/PieChart";
import Card from "../components/Card";

class Overview extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "NULL",
            dateRange: "a"
        };

    }

    getData() {
        fetch("http://localhost:9000/overview")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_overview", "2010-01-01")
        this.getData();
    }

    render() {
        return (
            <div id="main_page">
                <Header />
                <div id="content">

                    <div id="content_left" className="content_panel">
                        <div id="cards_topLeft">
                            <Card id="card_selector" />
                            <Card id="card_summary" />
                        </div>
                        <Card id="card_bar" />
                    </div>

                    <div id="content_center" className="content_panel">
                        <Card id="card_line" />
                        <Card id="card_treemap" />
                    </div>

                    <div id="content_right" className="content_panel">
                        <Card id="card_input" />
                        <Card id="card_pie">
                            <PieChart
                                data={this.state.data}
                                id="pieChart"
                            />
                        </Card>
                    </div>

                    {/* <PieChart
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
                    /> */}

                </div>


            </div>
        );
    }

}

export default Overview;
