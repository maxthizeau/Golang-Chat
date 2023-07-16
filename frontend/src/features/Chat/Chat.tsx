import Button from "@/components/Button"
import { useAuth } from "@/contexts/AuthProvider"
import { WSMessageType, useWSConnection } from "@/contexts/WSConnection"
import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { twMerge } from "tailwind-merge"

import "./Chat.css"

type Props = unknown

const messagesMock = [
  {
    from: "Maxime",
    message: "Salut !",
    sent: new Date(),
  },
  {
    from: "Benoit",
    message: "Bonjour maxime !",
    sent: new Date(),
  },
]

const Chat: React.FC<Props> = () => {
  type FormData = { message: string }
  const { register, handleSubmit } = useForm<FormData>()
  const chatRef = React.useRef<HTMLUListElement>(null)

  const { sendMessage, messages } = useWSConnection()
  const { user } = useAuth()

  const onSubmit = (data: FormData) => {
    if (user) {
      sendMessage(WSMessageType.SendMessage, { from: user.username, message: data.message })
    }
  }

  useEffect(() => {
    const length = messages.length
    if (!chatRef.current || !messages[length - 1]) return
    // Do not scroll if the last message is not from the user (only scroll when the user sends a message)
    if (messages[length - 1].from !== user?.username) return
    chatRef.current.scrollBy({ behavior: "smooth", top: chatRef.current.scrollHeight })
  }, [messages, chatRef.current])

  return (
    <div className="flex-grow flex flex-col h-auto justify-between ">
      <ul className="list-none max-h-96 overflow-scroll p-6 flex flex-col gap-8 " ref={chatRef}>
        {messages.map((message, index) => {
          const imTheAuthor = message.from === user?.username
          if (message.type === "chat") {
            return (
              <li
                key={index}
                className={twMerge(
                  "flex flex-col relative z-10  w-10/12 rounded-3xl p-4 chat-bubble",
                  imTheAuthor ? "self-end bg-sky-100 chat-bubble-self" : "self-start bg-slate-100  chat-bubble-other"
                )}
              >
                <span className={twMerge("font-semibold text-sm")}>{message.from ?? `Author`}</span>
                <span>{message.message}</span>
              </li>
            )
          } else {
            return <li className="font-semibold text-sm w-full text-center">{message.message}</li>
          }
        })}
      </ul>

      <form className="bg-slate-100 p-6 align-self-end flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <textarea {...register("message")} className="w-full h-24 p-2" />
        <Button className="w-full" type="submit">
          Send
        </Button>
      </form>
    </div>
  )
}

export default Chat
