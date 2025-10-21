import { useState } from 'react'
import Login from './Pages/Login'
import Home from './Pages/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'


function App() {


  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>

    </div>
  )
}

export default App
