import './assets/styles.css'

import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Join from './pages/members/Join'
import Bjoin from './pages/members/Bjoin'
// import {ReservationProvider} from './contexts/ReservationContext'
import Layout from './routes/Layout'
import NoMatch from './routes/NoMatch'
import Login from './pages/members/Login'
import PrivateRoute from './routes/PrivateRoute'

const App: React.FC = () => {
  return (
    // <ReservationProvider>
    <Router>
      <Routes>
        {/* 로그인 페이지는 언제나 접근 가능 */}
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/bjoin" element={<Bjoin />} />

        {/* PrivateRoute를 사용하여 인증이 필요한 경로 보호 */}
        <Route path="/" element={<PrivateRoute component={Layout} />} />

        <Route path="/boards/list" element={<PrivateRoute component={Layout} />} />
        <Route path="/boards/read" element={<PrivateRoute component={Layout} />} />
        <Route path="/boards/modify" element={<PrivateRoute component={Layout} />} />
        <Route path="/boards/register" element={<PrivateRoute component={Layout} />} />

        <Route path="/grounds/read" element={<PrivateRoute component={Layout} />} />
        <Route path="/grounds/list" element={<PrivateRoute component={Layout} />} />

        <Route path="/grounds/modify" element={<PrivateRoute component={Layout} />} />
        <Route path="/grounds/register" element={<PrivateRoute component={Layout} />} />
        <Route path="/members/profile" element={<PrivateRoute component={Layout} />} />
        <Route path="/members/charge" element={<PrivateRoute component={Layout} />} />
        <Route path="*" element={<PrivateRoute component={NoMatch} />} />
      </Routes>
    </Router>
    // </ReservationProvider>
  )
}

export default App
