import React from 'react';
import { Link } from 'react-router-dom';
import './login.css';

export default function Login() {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
            <div className="bg-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full border border-slate-700text-center">
                <h2 className="text-2xl font-bold text-amber-500 mb-4">Acessar o Sistema</h2>
                <p className="text-slate-400 mb-6">Área restrita para Clientes e Administradores.</p>

                {/* Aqui depois entrarão os inputs de e-mail e senha */}

                <Link to="/" className="text-sm text-slate-400 hover:text-amber-500 transition duration-200">
                    ← Voltar para o site principal
                </Link>
            </div>
        </div>
    );
}