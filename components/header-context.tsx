// components/header-context.tsx
'use client'
import React, { createContext, useCallback, useContext, useState } from "react";

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
    const [title, setTitle] = useState<string | undefined>();
    const [subtitle, setSubtitle] = useState<string | undefined>();

    const setHeader = useCallback((newTitle?: string, newSubtitle?: string) => {
        setTitle(newTitle);
        setSubtitle(newSubtitle);
    }, []);

    return (
        <HeaderContext.Provider value={{ title, subtitle, setHeader }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    return useContext(HeaderContext);
}
