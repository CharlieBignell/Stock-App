import React, { Component } from "react"

import { formatNav } from '../utils.js'

import Header from "../components/Header"

import AreaGraph from "../graphs/AreaGraph"
import SimpleLine from "../graphs/SimpleLine"
import Card from "../components/Card.js"
import MultiToggle from "react-multi-toggle";

const view = [
    {
        displayName: 'Companies',
        value: 'c'
    },
    {
        displayName: 'Sectors',
        value: "s"
    }
];

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

class Breakdown extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "NULL",
            dateRange: "a",
            view: "c",
            subject: "AAPL"
        }

    }
    onTimeSelect = value => this.setState({ dateRange: value });
    onViewSelect = (value) => this.setState({ view: value })

    updateDimensions = () => {
        this.setState(this.state)
    };

    getData() {
        fetch("http://localhost:9000/breakdown")
            .then(res => res.text())
            .then(res => this.setState({ data: res }));
    }

    componentDidMount() {
        formatNav("item_breakdown", "2010-01-01")
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

                    {/* <SimpleLine
                        data={this.state.data}
                        id="simpleLine"
                        movingAvgWin={200}
                        dateRange={this.state.dateRange}
                        subject={this.state.subject}
                    /> */}

                    <div id="breakdown_content_left" className="content_panel">
                        <div id="cards_topLeft">
                            <Card id="breakdown_card_selector">
                                <MultiToggle
                                    options={time}
                                    selectedOption={this.state.dateRange}
                                    onSelectOption={this.onTimeSelect}
                                    dateRange={this.state.dateRange}
                                />
                                <MultiToggle
                                    options={view}
                                    selectedOption={this.state.view}
                                    onSelectOption={this.onViewSelect}
                                />
                            </Card>

                            <Card id="card_tickSummary" />
                        </div>


                        <Card id="card_winLose" />
                    </div>

                    <div id="breakdown_content_right" className="content_panel">
                        <Card id="card_areaGraph">
                            <AreaGraph
                                data={this.state.data}
                                id="areaGraph"
                            />
                        </Card>
                    </div>

                </div>

            </div>
        );
    }


}

export default Breakdown;
