import React, { Component } from "react";
import '../styles/Overview.css';

import Header from "../components/Header";
import TestChart from "../graphs/TestChart";

class Breakdown extends Component {

    constructor(props) {
        super(props);
        this.state = { data: "NULL" };

    }

    getData() {
        fetch("http://localhost:9000/breakdown")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        this.getData();
    }

    render() {
        return (
            <div id="main">
                <Header />
                <TestChart data={this.state.data} id="test_1" />
            </div>
        );
    }

}

export default Breakdown;
