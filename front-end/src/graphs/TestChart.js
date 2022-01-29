import React, { Component } from "react";

class TestChart extends Component {
    componentDidMount() {
        testChart(this.props.data, this.props.id)
    }

    componentDidUpdate() {
        testChart(this.props.data, this.props.id)
    }

    render() {
        return <p id={this.props.id}></p>;
    }
}

function testChart(data, id) {
    let text = document.getElementById(id)
    if(data == "NULL"){
        text.innerHTML = "Loading..."
    }else{
        text.innerHTML = "*CHART*"
        console.log(JSON.parse(data))
    }
}

export default TestChart;