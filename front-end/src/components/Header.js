import React, { Component } from "react";
import { Link } from "react-router-dom";

import '../styles/components/Header.scss';

class Header extends Component {
    render() {
        return (
            <div id="main_header">
                <div id="main_left">
                    <h1>Dashboard</h1>
                    <div id="separator"></div>
                    <div id="navItems">
                        <div>
                            <Link to="/overview" id="item_overview" className="item">Overview</Link>
                            <div id="item_overview_underline" className="underline"></div>
                        </div>

                        <div>
                            <Link to="/breakdown" id="item_breakdown" className="item">Breakdown</Link>
                            <div id="item_breakdown_underline" className="underline"></div>
                        </div>
                        <div>
                            <Link to="/details" id="item_details" className="item">Details</Link>
                            <div id="item_details_underline" className="underline"></div>
                        </div>
                    </div>
                </div>
                <div id="main_right">
                    <p id="header_right_title">Time in the Market</p>
                    <p id="TITM">2 years etc.</p>
                </div>

            </div>
        );
    }
}

export default Header;
