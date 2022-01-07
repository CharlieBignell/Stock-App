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
            <Route path="overview" element={<Overview />} />
            <Route path="details" element={<Details />} />
            <Route path="breakdown" element={<Breakdown />} />
        </Routes>
    </BrowserRouter>,

    document.getElementById("root")
);