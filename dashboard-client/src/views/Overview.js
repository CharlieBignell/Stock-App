import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

import '../styles/Overview.css';
import Breakdown from './Breakdown';
import Details from './Details';

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
      <div className="App">
        <header className="App-header">
          <p className="App-intro">{this.state.apiData}</p>

          <Router>
            <Routes>
              <Route path="/" element={<Overview />}>
                <Route index element={<Overview />} />
                <Route path="Breakdown" element={<Breakdown />} />
                <Route path="Details" element={<Details />} />
              </Route>
            </Routes>
          </Router>

        </header>
      </div>
    );
  }



}

export default Overview;
