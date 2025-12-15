import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    getAuth,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot
} from "firebase/firestore";
import { initializeApp, deleteApp, getApp } from "firebase/app";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

// Secondary App Config (same as main)
const firebaseConfig = {
    apiKey: "AIzaSyBW6vCf9il3omf_DX4pn78mEipQ7uplyVQ",
    authDomain: "prestigemerchandise-a1494.firebaseapp.com",
    projectId: "prestigemerchandise-a1494",
    storageBucket: "prestigemerchandise-a1494.firebasestorage.app",
    messagingSenderId: "22918042844",
    appId: "1:22918042844:web:8b2c68da24841d8a659019",
    measurementId: "G-K6VNE61Q00"
};

export type UserRole = 'super_admin' | 'admin' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    createAdmin: (email: string, password: string, role?: UserRole) => Promise<any>;
    deleteAdmin: (uid: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isAuthenticated: false,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
    createAdmin: async () => { },
    deleteAdmin: async () => { },
    changePassword: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, now fetch role
                const docRef = doc(db, "admins", user.uid);

                // Real-time listener for role changes
                const unsubscribeSnapshot = onSnapshot(docRef,
                    async (docSnap) => {
                        if (docSnap.exists()) {
                            setRole(docSnap.data().role as UserRole);
                        } else {
                            // AUTO-SEED LOGIC
                            console.log("🔑 Your User ID (UID):", user.uid);
                            console.log("📋 Copy this UID to update the auto-seed logic!");

                            if (user.uid === "smHc1fwooRQNTsOswZOwWu59mz12") {
                                try {
                                    await setDoc(docRef, {
                                        email: user.email,
                                        role: "super_admin",
                                        createdAt: new Date().toISOString()
                                    });
                                    setRole("super_admin");
                                } catch (err) {
                                    console.error("Auto-seed failed", err);
                                    setRole(null);
                                }
                            } else {
                                // Default to "customer" role if not in admins collection
                                // This allows valid users to log in without admin privileges
                                console.log("User logged in as Customer (No admin profile):", user.uid);
                                setRole(null); // Role is null for regular customers
                            }
                        }
                        // CRITICAL: Only stop loading after we have the role (or lack thereof)
                        setUser(user);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Firestore Role Error:", error);
                        if (error.code !== 'permission-denied') {
                            toast.error("Connection Issue: Verifying permissions...");
                        }
                        // Even on error, we must Stop loading so UI renders (likely access denied)
                        setRole(null); // Default to no role on error
                        setUser(user);
                        setLoading(false);
                    }
                );

                return () => unsubscribeSnapshot();
            } else {
                // User logged out
                setUser(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true); // Prevent race condition in AdminLayout
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setLoading(false); // Reset if firebase error (e.g. wrong password)
            throw error;
        }
    };

    const logout = async () => {
        // Clear state immediately to prevent stale data on re-login
        setRole(null);
        setUser(null);
        await firebaseSignOut(auth);
    };

    const signup = async (email: string, password: string) => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // No need to set user/role here, the onAuthStateChanged listener will handle it
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const createAdmin = async (email: string, password: string, role: UserRole = 'admin') => {
        console.log("🔵 createAdmin: Starting...");
        // 1. Initialize Secondary App
        // We use a timestamp to ensure the app name is unique every time, preventing "App already exists" errors
        const appName = `Secondary_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        console.log("🔵 createAdmin: Secondary app initialized");

        try {
            // 2. Create User in Auth
            console.log("🔵 createAdmin: Creating user in Auth...");
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            console.log("🔵 createAdmin: User created in Auth:", userCredential.user.uid);

            // 3. Sign out of secondary auth IMMEDIATELY
            // This prevents the new user from being "logged in" and avoids permission issues
            console.log("🔵 createAdmin: Signing out secondary auth...");
            await firebaseSignOut(secondaryAuth);
            console.log("🔵 createAdmin: Secondary auth signed out");

            // 4. Prepare Data
            const newAdminData = {
                uid: userCredential.user.uid,
                email,
                role,
                createdAt: new Date().toISOString()
            };

            // 5. Write to Firestore using PRIMARY auth (super admin context)
            // This ensures the write happens with super admin permissions
            console.log("🔵 createAdmin: Writing to Firestore (as super admin)...");
            await setDoc(doc(db, "admins", userCredential.user.uid), newAdminData);
            console.log("🔵 createAdmin: Firestore write complete");

            console.log("🔵 createAdmin: Success! Returning data");
            return newAdminData;
        } catch (error) {
            console.error("🔴 createAdmin: Error occurred:", error);
            throw error;
        } finally {
            // Cleanup: Always delete the secondary app
            console.log("🔵 createAdmin: Cleaning up secondary app...");
            deleteApp(secondaryApp).catch(() => { });
            console.log("🔵 createAdmin: Cleanup complete");
        }
    };

    const deleteAdmin = async (uid: string) => {
        // "Soft Delete" - Fire and Forget
        // We remove from UI immediately (optimistic), and sync to DB in background.
        (async () => {
            try {
                await deleteDoc(doc(db, "admins", uid));
            } catch (err) {
                console.error("Background Admin Delete Error:", err);
                toast.error("Sync Error: Failed to delete from database.");
            }
        })();
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (!auth.currentUser || !auth.currentUser.email) {
            throw new Error('No user is currently logged in');
        }

        try {
            // Create credential with current password
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );

            // Reauthenticate user
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Now update password
            await updatePassword(auth.currentUser, newPassword);
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            loading,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            createAdmin,
            deleteAdmin,
            changePassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};
