import React, { Component } from "react";

import '../styles/components/Card.scss';

class Card extends Component {
    render() {
        return (
            <div id = {this.props.id} className="card">
                {this.props.children}
            </div>
        );
    }
}

export default Card;
