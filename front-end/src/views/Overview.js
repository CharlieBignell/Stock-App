import React, { Component } from "react"

import { formatNav } from '../utils.js'

import Header from "../components/Header"
import LineGraph from "../graphs/LineGraph"
import BarChart from "../graphs/BarChart"
import TreeMap from "../graphs/TreeMap"
import PieChart from "../graphs/PieChart"
import Card from "../components/Card"

import MultiToggle from "react-multi-toggle";
import '../styles/components/Toggle.scss';
import '../styles/components/Dropdown.scss';

const time = [
    {
        displayName: 'Week',
        value: 'w'
    },
    {
        displayName: 'Month',
        value: "m"
    },
    {
        displayName: 'Year',
        value: "y"
    },
    {
        displayName: 'All',
        value: "a"
    }
];

class Overview extends Component {

    constructor(props) {
        super(props)

        this.state = {
            data: "NULL",
            dateRange: "a",
        }

    }

    onTimeSelect = value => this.setState({ dateRange: value });

    getData() {
        fetch("http://localhost:9000/overview")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    updateDimensions = () => {
        this.setState(this.state)
    };

    componentDidMount() {
        formatNav("item_overview", "2010-01-01")
        this.getData();
        window.addEventListener('resize', this.updateDimensions);

    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);

    }

    render() {
        return (
            <div id="main_page">
                <Header />
                <div id="content">

                    <div id="content_left" className="content_panel">
                        <div id="cards_topLeft">
                            <Card id="card_selector">
                                <MultiToggle
                                    options={time}
                                    selectedOption={this.state.dateRange}
                                    onSelectOption={this.onTimeSelect}
                                />
                            </Card>
                            <Card id="card_summary" />
                        </div>
                        <Card id="card_bar">
                            <BarChart
                                data={this.state.data}
                                id="barChart"
                                dateRange={this.state.dateRange}
                            />
                        </Card>
                    </div>

                    <div id="content_center" className="content_panel">
                        <Card id="card_line">
                            <LineGraph
                                data={this.state.data}
                                id="lineGraph"
                                movingAvgWin={100}
                                dateRange={this.state.dateRange}
                            />
                        </Card>
                        <Card id="card_treemap">
                            <TreeMap
                                data={this.state.data}
                                id="treeMap"
                                dateRange={this.state.dateRange}
                            />
                        </Card>
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

                </div>


            </div>
        );
    }

}

export default Overview;
