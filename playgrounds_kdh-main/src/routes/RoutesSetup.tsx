import {Routes, Route} from 'react-router-dom'
import Layout from './Layout'
import Join from '../pages/members/Join'
import Bjoin from '../pages/members/Bjoin'
import Login from '../pages/members/Login'
import NoMatch from './NoMatch'

export default function RoutesSetup() {
  return (
    <Routes>
      <Route path="/" element={<Layout />} />
      <Route path="/grounds/list" element={<Layout />} />
      <Route path="/grounds/register" element={<Layout />} />
      <Route path="/grounds/modify" element={<Layout />} />
      <Route path="/grounds/read" element={<Layout />} />
      <Route path="/boards/list" element={<Layout />} />
      <Route path="/boards/register" element={<Layout />} />
      <Route path="/boards/modify" element={<Layout />} />
      <Route path="/boards/read" element={<Layout />} />
      <Route path="/members/profile" element={<Layout />} />
      <Route path="/members/charge" element={<Layout />} />
      <Route path="/join" element={<Join />} />
      <Route path="/bjoin" element={<Bjoin />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  )
}
