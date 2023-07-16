import React, { createContext } from "react"
import { useErrorBoundary } from "react-error-boundary"

type AuthContextProps = {
  isAuthenticated: boolean
  user: {
    username: string
    otp: string
  } | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthContextProps["user"]>(null)

  const login = async (username: string, password: string) => {
    const res = await fetch(import.meta.env.VITE_API_URL + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setUser({ username: username, otp: data.otp })
    }
  }

  const values = {
    isAuthenticated: user !== null,
    user: user,
    login: login,
    logout: () => setUser(null),
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const authContext = React.useContext(AuthContext)

  if (!authContext) {
    throw new Error("useAuth has to be used within <AuthProvider>")
  }

  return authContext
}
