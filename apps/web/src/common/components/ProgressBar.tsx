import React, { useEffect } from 'react'

type Props = { durationInMilliSeconds: number }

const ProgressBar: React.FC<Props> = ({ durationInMilliSeconds }) => {
  const repaintIntervalInMilliSeconds = 16.6

  const increment = 100 / (durationInMilliSeconds / repaintIntervalInMilliSeconds)
  const [progress, setProgress] = React.useState<number>(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (progress < 100) {
        setProgress((progress) => progress + increment)
      }
    }, repaintIntervalInMilliSeconds)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {}, [])

  return (
    <React.Fragment>
      <div className="mb-1 text-base font-medium dark:text-white">Small</div>
      <div className="mb-4 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-1.5 rounded-full bg-primary-600 dark:bg-primary-500"
          style={{ width: Math.min(Math.floor(progress), 100) + '%' }}
        ></div>
      </div>
    </React.Fragment>
  )
}

export default ProgressBar
