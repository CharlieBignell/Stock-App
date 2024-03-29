import React, { Component } from "react";

import { formatNav } from '../utils.js';

import Header from "../components/Header";

class Details extends Component {

    constructor(props) {
        super(props);
        this.state = { data: "NULL" };

    }

    getData() {
        fetch("http://localhost:9000/details")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_details", "2010-01-01")
        this.getData();
    }

    render() {
        return (
            <div id="main">
                <Header />
                <div id="content">
                </div>
            </div>
        );
    }
}

export default Details;
