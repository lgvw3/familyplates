// components/header-context.tsx
'use client'
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from 'next/navigation';

type HeaderContextType = {
    title?: string;
    subtitle?: string;
    setHeader: (title?: string, subtitle?: string) => void;
};

const HeaderContext = createContext<HeaderContextType>({
    title: undefined,
    subtitle: undefined,
    setHeader: () => { },
});

export function HeaderProvider({ children }: { children: React.ReactNode }) {
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
    const pathname = usePathname();

    // Reset header on route change
    useEffect(() => {
        setTitle(undefined);
        setSubtitle(undefined);
    }, [pathname]);

    const setHeader = (newTitle?: string, newSubtitle?: string) => {
        setTitle(newTitle);
        setSubtitle(newSubtitle);
    };

    return (
        <HeaderContext.Provider value={{ title, subtitle, setHeader }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    return useContext(HeaderContext);
}