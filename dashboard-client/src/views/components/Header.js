import React, { Component } from "react";
import {Link} from "react-router-dom";

import '../../styles/Header.css';

class Header extends Component {
  render() {
    return (
      <div>
          <Link to="/Overview">Overview | </Link>
          <Link to="/Breakdown">Breakdown | </Link>
          <Link to="/Details">Details</Link>
      </div>
    );
  }
}

export default Header;
