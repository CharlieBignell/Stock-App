import React, { Component } from "react";
import '../styles/views/Breakdown.scss';
import { formatNav } from '../utils.js';

import Header from "../components/Header";

import AreaGraph from "../graphs/AreaGraph";

class Breakdown extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "NULL",
            dateRange: "m"
        };

    }

    getData() {
        fetch("http://localhost:9000/breakdown")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_breakdown")
        this.getData();
    }

    render() {
        return (
            <div id="main_page">
                <Header />
                <div id="content">
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
