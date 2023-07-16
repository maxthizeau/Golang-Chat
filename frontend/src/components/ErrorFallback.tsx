import React from "react"
import Button from "./Button"
import { FallbackProps } from "react-error-boundary"

interface Props extends FallbackProps {}

const ErrorFallback: React.FC<Props> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="w-screen h-screen fixed z-50 bg-black/80 flex justify-center items-center">
      <div className="w-128 h-full overflow-y-scroll bg-white rounded-lg shadow-lg p-8 md:max-w-fit">
        <h1 className="text-lg font-bold text-center">Something went wrong :</h1>
        <pre>{error.message}</pre>
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </div>
    </div>
  )
}

export default ErrorFallback
