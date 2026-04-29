import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    try {
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        authProvider: "local",
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to save user to Firestore:", e);
    }
    
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          authProvider: "google",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Failed to check/save Google user in Firestore:", e);
    }
    
    return result;
  }

  async function loginAnonymously(formData = null) {
    const result = await signInAnonymously(auth);
    const user = result.user;
    
    try {
      const userData = {
        uid: user.uid,
        email: formData?.email || "anonymous@noemail.com",
        name: formData?.name || "Anonymous",
        authProvider: "anonymous",
        createdAt: new Date().toISOString(),
      };
      
      if (formData?.requirements) {
        userData.requirements = formData.requirements;
      }
      
      await setDoc(doc(db, "users", user.uid), userData);
    } catch (e) {
      console.warn("Failed to save anonymous user to Firestore:", e);
    }
    
    return result;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function verifyEmail() {
    return sendEmailVerification(auth.currentUser);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            user.isAdmin = userDoc.data().role === 'admin';
            user.name = userDoc.data().name || user.displayName;
          }
        } catch (e) {
          console.warn("Could not fetch user role:", e);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    // mock theme toggle
  };

  const value = {
    currentUser,
    user: currentUser,
    theme: 'light',
    toggleTheme,
    signup,
    login,
    loginWithGoogle,
    loginAnonymously,
    logout,
    resetPassword,
    verifyEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
