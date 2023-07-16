import Button from "@/components/Button"
import Card from "@/components/Card"
import Input from "@/components/Input"
import { useWSConnection } from "@/contexts/WSConnection"
import React from "react"
import { useForm } from "react-hook-form"

type Props = unknown

const EnterRoom: React.FC<Props> = () => {
  const { createRoom } = useWSConnection()

  type FormData = { roomName: string }
  const { register, handleSubmit } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    createRoom(data.roomName)
  }

  return (
    <Card>
      <p className="text-sm font-bold text-center mb-4">Create room</p>

      <form className="flex gap-2" onSubmit={handleSubmit(onSubmit)}>
        <Input {...register("roomName")} className="border  w-8/12" required type="text" placeholder="Room name" />{" "}
        <Button className="" type="submit">
          Create
        </Button>
      </form>
    </Card>
  )
}

export default EnterRoom
