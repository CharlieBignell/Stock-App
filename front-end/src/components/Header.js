import React, { Component } from "react";
import {Link} from "react-router-dom";

import '../styles/Header.css';

class Header extends Component {
  render() {
    return (
      <div>
          <Link to="/overview">Overview | </Link>
          <Link to="/breakdown">Breakdown | </Link>
          <Link to="/details">Details</Link>
      </div>
    );
  }
}

export default Header;
