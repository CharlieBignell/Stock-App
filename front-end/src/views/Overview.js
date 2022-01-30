import React, { Component } from "react";
import '../styles/views/Overview.scss';
import { formatNav } from '../utils.js';

import Header from "../components/Header";
import TestChart from "../graphs/TestChart";

class Overview extends Component {

    constructor(props) {
        super(props);
        this.state = { data: "NULL" };

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
                    <TestChart data={this.state.data} id="test_1" />
                </div>
            </div>
        );
    }

}

export default Overview;
