import React, { Component } from "react";
import '../styles/views/Overview.scss';
import { formatNav, red, green, blue } from '../utils.js';

import Header from "../components/Header";
import LineGraph from "../graphs/LineGraph";

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
                    <LineGraph 
                        data={this.state.data} 
                        id="lineGraph" 
                        movingAvgWin={1} 
                        lines={["value", "amount_ITM", "amount_return_cum"]} 
                        colours={[blue, green, red]}
                        dateRange={"m"}
                    />
                </div>


            </div>
        );
    }

}

export default Overview;
