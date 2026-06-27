import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HeroSection from '../pages/HeroSection/heroSection';
import Login from '../pages/Login/login';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rota principal - Site Institucional */}
                <Route path="/" element={<HeroSection />} />

                {/* Rota da tela de Login */}
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}