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
  likes: string
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
        .then(res => res.json())
        .then(data => setMember(data))
        .catch(err => console.log('Error:', err))
    }
  }, [token])

  const handleGroundClick = (gtitle: string) => {
    fetch(`http://localhost:8080/api/grounds/gno?gtitle=${encodeURIComponent(gtitle)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(gno => {
        navigate(`/grounds/read?gno=${gno}`)
      })
      .catch(err => console.log('Error:', err))
  }

  if (!member) {
    return <div>Loading...</div>
  }

  const likesList = member.likes ? member.likes.split(',') : []

  return (
    <div className="profile-container">
      <h1>회원 프로필</h1>
      <p>이메일: {member.email}</p>
      <p>이름: {member.name}</p>
      <p>캐쉬: {member.nowcash.toLocaleString()} 원</p>
      <p>레벨: {member.level}</p>
      <p>선호 종목: {member.prefer}</p>
      <button onClick={() => navigate('/members/charge')}>캐쉬 충전</button>
      <h2>예약한구장</h2>
      <ul>
        {likesList.map((gtitle, index) => (
          <li key={index} onClick={() => handleGroundClick(gtitle)}>
            {gtitle}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Profile
