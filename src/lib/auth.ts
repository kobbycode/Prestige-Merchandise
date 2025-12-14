
export const isAuthenticated = (): boolean => {
    return localStorage.getItem("isAdminAuthenticated") === "true";
};

export const login = (password: string): boolean => {
    // Hardcoded for demo purposes
    if (password === "admin123") {
        localStorage.setItem("isAdminAuthenticated", "true");
        return true;
    }
    return false;
};

export const logout = (): void => {
    localStorage.removeItem("isAdminAuthenticated");
};
