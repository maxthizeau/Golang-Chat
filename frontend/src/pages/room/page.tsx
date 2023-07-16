import Card from "@/components/Card"
import { useWSConnection } from "@/contexts/WSConnection"
import EnterRoom from "@/features/EnterRoom/EnterRoom"
import React from "react"
import { BsPeople } from "react-icons/bs"

type Props = unknown

const RoomPage: React.FC<Props> = () => {
  const { rooms, currentRoom, joinRoom } = useWSConnection()
  return (
    <>
      <div className="w-full flex flex-col flex-grow  overflow-hidden p-0 gap-8 justify-between ">
        <Card className="text-center rounded-xl p-4">
          <p className="text-sm font-bold">Current room</p> <p className="font-semibold text-xl mt-4">{currentRoom?.name}</p>
        </Card>
        <Card className="flex flex-grow flex-col overflow-y-scroll">
          <p className="text-sm font-bold text-center mb-4">Active rooms ({rooms.length})</p>
          <ul>
            {rooms.map((room, index) => (
              <li
                key={index}
                className="font-semibold w-full px-4 py-2 rounded-lg bg-slate-100 flex justify-between mb-4 cursor-pointer hover:ring-2"
                onClick={() => {
                  joinRoom(room.name)
                }}
              >
                <span>{room.name}</span>
                <div className="flex flex-row gap-1 items-center justify-center ring-1 rounded-lg px-2 bg-white text-sm">
                  <span>{room.userCount}</span>
                  <span>
                    <BsPeople />
                  </span>
                </div>
              </li>
            ))}

            {/* <li className="font-semibold">French</li>
            <li className="font-semibold">English</li>
            <li className="font-semibold">Spanish</li> */}
          </ul>
        </Card>
        {/* <Card>
          <p className="text-sm font-bold text-center mb-4">Create room</p>

          <div className="flex gap-2">
            <Input className="border  w-8/12" required type="text" placeholder="Room name" /> <Button className="">Create</Button>
          </div>
        </Card> */}
        <EnterRoom />
      </div>
      {/* </Card> */}
    </>
  )
}

export default RoomPage
