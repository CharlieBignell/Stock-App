import { render } from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom"

import './styles/index.css';

import Overview from "./views/Overview";
import Breakdown from "./views/Breakdown";
import Details from "./views/Details";

render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="Overview" element={<Overview />} />
            <Route path="Details" element={<Details />} />
            <Route path="Breakdown" element={<Breakdown />} />
        </Routes>
    </BrowserRouter>,

    document.getElementById("root")
);