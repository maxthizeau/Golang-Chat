/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react"
import "./styles/globals.css"
import { FileBasedRoutingProvider } from "./contexts/FilebasedRouting"
import { AuthProvider } from "./contexts/AuthProvider"

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FileBasedRoutingProvider />
    </AuthProvider>
  )
}
