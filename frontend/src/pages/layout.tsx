import Button from "@/components/Button"
import { useAuth } from "@/contexts/AuthProvider"
import { WSConnectionProvider } from "@/contexts/WSConnection"
import LoginForm from "@/features/LoginForm/LoginForm"
import { FC, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
// import useWebSocket from "react-use-websocket"

interface IProps {
  children: ReactNode
}

const RootLayout: FC<IProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  return (
    <>
      <div className=" flex-col w-screen h-screen p-8 fixed inset-0 bg-slate-900 flex justify-center items-center gap-8">
        <div className="gap-8 flex flex-col w-full items-center justify-center">
          <h1 className="text-3xl font-semibold text-white">Chatty</h1>
          <div className="flex gap-4 justify-center w-full">
            <Button
              className="w-1/2"
              variant="secondary"
              type="button"
              onClick={() => {
                navigate("/room", { replace: true })
              }}
            >
              Rooms
            </Button>
            <Button
              className="w-1/2"
              variant="secondary"
              type="button"
              onClick={() => {
                navigate("/", { replace: true })
              }}
            >
              Chat
            </Button>
          </div>
        </div>
        {/* <Card className="w-full h-full overflow-y-scroll "> */}

        {!isAuthenticated ? <LoginForm /> : isAuthenticated && <WSConnectionProvider>{children}</WSConnectionProvider>}

        {/* <EnterRoom /> */}
        {/* {children} */}
        {/* </Card> */}
      </div>
    </>
  )
}

export default RootLayout
