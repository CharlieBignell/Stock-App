import React, { Component } from "react";
import '../styles/Overview.css';

import Header from "./components/Header";

class Overview extends Component {

    constructor(props) {
        super(props);
        this.state = { apiData: "" };
    }

    getData() {
        fetch("http://localhost:9000/overview")
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

export default Overview;
