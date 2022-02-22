import React, { Component } from "react"

import { formatNav } from '../utils.js'

import Header from "../components/Header"

import AreaGraph from "../graphs/AreaGraph"
import SimpleLine from "../graphs/SimpleLine"

class Breakdown extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "NULL",
            dateRange: "a",
            subject: "AAPL"
        };

    }

    getData() {
        fetch("http://localhost:9000/breakdown")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_breakdown", "2010-01-01")
        this.getData();
    }

    render() {
        return (
            <div id="main_page">
                <Header />
                <div id="content">
                    <SimpleLine
                        data={this.state.data}
                        id="simpleLine"
                        movingAvgWin={200}
                        dateRange={this.state.dateRange}
                        subject={this.state.subject}
                    />
                    <AreaGraph
                        data={this.state.data}
                        id="areaGraph"
                    />
                </div>
            </div>
        );
    }


}

export default Breakdown;
