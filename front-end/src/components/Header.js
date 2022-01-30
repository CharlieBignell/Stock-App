import React, { Component } from "react";
import { Link } from "react-router-dom";

import '../styles/components/Header.scss';

class Header extends Component {
    render() {
        return (
            <div id="main_header">
                <div id="navItems">
                    <Link to="/overview" id="item_overview" className="item">Overview</Link>
                    <Link to="/breakdown" id="item_breakdown" className="item">Breakdown</Link>
                    <Link to="/details" id="item_details" className="item">Details</Link>
                </div>
            </div>
        );
    }
}

export default Header;
