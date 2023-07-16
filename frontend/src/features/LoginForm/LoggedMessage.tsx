import React from "react"

type Props = {
  username: string
}

const LoggedMessage: React.FC<Props> = ({ username }) => {
  return (
    <div className="text-center font-semibold mb-4">
      You are logged as : <span className="font-semibold text-sm ">{username}</span>
    </div>
  )
}

export default LoggedMessage
