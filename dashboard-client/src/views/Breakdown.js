import React, { Component } from "react";
import '../styles/Overview.css';

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

  render(){
    return (
      <div className="App">
        <header className="App-header">
          <p className="App-intro">{this.state.apiData}</p>
        </header>
      </div>
    );
  }

}

export default Breakdown;
