import React, { Component } from "react";
import '../styles/Breakdown.css';

import Header from "../components/Header";

class Breakdown extends Component {

    constructor(props) {
        super(props);
        this.state = { apiData: "" };
    }

    getData() {
        fetch("http://localhost:9000/breakdown")
            .then(res => res.text())
            .then(res => this.setState({ apiData: res }));
    }

    componentDidMount() {
        this.getData();
    }

    render() {
        return (
            <div id="main">
                <Header></Header>
                <p>{this.state.apiData}</p>
            </div>
        );
    }

}

export default Breakdown;
