import React from 'react'
import FaceDetector from './FaceDetector'
import ErrorBoundary from './components/ErrorBoundary'

const App = () => {
  return (
    <ErrorBoundary>
      <div>
        <FaceDetector />
      </div>
    </ErrorBoundary>
  )
}

export default App