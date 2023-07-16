import Button from "@/components/Button"
import Input from "@/components/Input"
import React from "react"
import LoggedMessage from "./LoggedMessage"
import { useAuth } from "@/contexts/AuthProvider"
import { useForm } from "react-hook-form"
import Card from "@/components/Card"

type Props = unknown

const LoginForm: React.FC<Props> = () => {
  const { user, login, isAuthenticated } = useAuth()

  type FormData = { username: string; password: string }
  const { register, handleSubmit } = useForm<FormData>()

  if (isAuthenticated && user) {
    return <LoggedMessage username={user.username} />
  }

  const onSubmit = (data: FormData) => {
    login(data.username, data.password)
  }

  return (
    <Card className="w-full flex flex-col flex-grow overflow-y-scroll  p-4">
      <form className="flex flex-col gap-4 mb-4 flex-wrap items-end" onSubmit={handleSubmit(onSubmit)}>
        <label className="flex flex-col w-full">
          <span className="font-semibold text-sm ">Username:</span>
          <Input className="border rounded-sm" required type="text" {...register("username")} />
        </label>
        <label className="flex flex-col w-full">
          <span className="font-semibold text-sm ">Password:</span>
          <Input className="border rounded-sm" required type="password" {...register("password")} />
        </label>
        <Button className="w-full" type="submit">
          Login
        </Button>
      </form>
    </Card>
  )
}

export default LoginForm
