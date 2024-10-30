import React, {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import useToken from '../../hooks/useToken'

interface MemberDTO {
  mid: number
  email: string
  name: string
  nowcash: number
  addcash: number
  level: string
  prefer: string
}

const Profile: React.FC = () => {
  const [member, setMember] = useState<MemberDTO | null>(null)
  const token = useToken()
  const navigate = useNavigate()

  useEffect(() => {
    const email = sessionStorage.getItem('email')
    if (email) {
      fetch(`http://localhost:8080/api/members/email/${email}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          setMember(data)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [token])

  if (!member) {
    return <div>Loading...</div>
  }

  return (
    <div className="profile-container">
      <h1>회원 프로필</h1>
      <p>이메일: {member.email}</p>
      <p>이름: {member.name}</p>
      <p>캐쉬: {member.nowcash.toLocaleString()} 원</p>
      {/* <p>충전한 캐쉬: {member.addcash}</p> */}
      <p>레벨: {member.level}</p>
      <p>선호 종목: {member.prefer}</p>
      <button onClick={() => navigate('/members/charge')}>캐쉬 충전</button>
    </div>
  )
}

export default Profile
