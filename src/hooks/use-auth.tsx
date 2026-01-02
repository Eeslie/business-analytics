"use client"

import { AuthService } from '../services/authService';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Claim {
    id: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

interface AuthContextType {
    claims: Claim;
    loading: boolean;
}

const claimsInit = {
    id: '',
    email: '',
    role: '',
    iat: 0, 
    exp: 0, 
}

type AuthProviderProps = React.PropsWithChildren<object>;

const AuthContext = createContext<AuthContextType>({ claims: claimsInit, loading: true });

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    console.log('called');
    
    const [claims, setClaims] = useState(claimsInit);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const response = await AuthService.getCookies();
                setClaims(response);
            } catch (error) {                
                setClaims(claimsInit);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);    

    return <AuthContext.Provider value={{ claims, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);