import Card from "@/components/Card"
import { useAuth } from "@/contexts/AuthProvider"
import { WSConnectionProvider } from "@/contexts/WSConnection"
import Chat from "@/features/Chat/Chat"
import React from "react"

type Props = unknown

const IndexPage: React.FC<Props> = () => {
  const { user } = useAuth()

  return (
    <Card className="w-full flex flex-col flex-grow overflow-y-scroll p-0 ">
      <header className="p-4 text-center bg-slate-500 text-white">
        <h2 className="text-xl font-semibold uppercase">Général</h2>
      </header>

      <Chat />
    </Card>
  )
}

export default IndexPage
