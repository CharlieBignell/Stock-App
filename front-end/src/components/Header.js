import React, { Component } from "react";
import {Link} from "react-router-dom";

import '../styles/components/Header.scss';

class Header extends Component {
  render() {
    return (
      <div id = "main_header">
          <Link to="/overview" class = "navItem">Overview | </Link>
          <Link to="/breakdown" class = "navItem">Breakdown | </Link>
          <Link to="/details" class = "navItem">Details </Link>
      </div>
    );
  }
}

export default Header;
