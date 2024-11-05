import React, {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import './profile.css'

interface MemberDTO {
  mid: number
  email: string
  name: string
  nowcash: number
  addcash: number
  level: string
  prefer: string
  likes: string
  bnotitle: string
}

const Profile: React.FC = () => {
  const [member, setMember] = useState<MemberDTO | null>(null)
  const token = useToken()
  const navigate = useNavigate()

  useEffect(() => {
    const email = sessionStorage.getItem('email')
    if (email) {
      // 회원 정보 가져오기
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

  const handleGroundClick = (likeEntry: string) => {
    const openParenIndex = likeEntry.indexOf(' (')
    const closeParenIndex = likeEntry.indexOf(')')

    if (openParenIndex === -1 || closeParenIndex === -1) {
      console.error('Invalid like format:', likeEntry)
      return
    }

    const gtitle = likeEntry.substring(0, openParenIndex).trim()
    const groundstime = likeEntry.substring(openParenIndex + 2, closeParenIndex).trim()

    fetch(
      `http://localhost:8080/api/grounds/gno?gtitle=${encodeURIComponent(
        gtitle
      )}&groundstime=${encodeURIComponent(groundstime)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(res => res.json())
      .then(gno => {
        navigate(`/grounds/read?gno=${gno}`)
      })
      .catch(err => console.log('Error:', err))
  }

  const handleBnoTitleClick = (bno: string) => {
    navigate(`/boards/read?bno=${bno}`)
  }

  if (!member) {
    return <div>Loading...</div>
  }

  const likesList = member.likes ? member.likes.split(',') : []

  // bnotitle 데이터를 파싱하여 bno와 title로 나누기
  const bnoTitleList = member.bnotitle ? member.bnotitle.split(',') : []

  return (
    <div className="profile-container">
      <h1>회원 프로필</h1>
      <p>이메일: {member.email}</p>
      <p>이름: {member.name}</p>
      <p>캐쉬: {member.nowcash.toLocaleString()} 원</p>
      <button onClick={() => navigate('/members/charge')}>캐쉬 충전</button>
      <button onClick={() => navigate('/members/modify')}>회원정보 수정</button>

      <h2>예약한 구장</h2>
      <ul>
        {likesList.map((gtitle, index) => (
          <li key={index} onClick={() => handleGroundClick(gtitle)}>
            {gtitle}
          </li>
        ))}
      </ul>

      <h2>내가 쓴 글</h2>
      <ul>
        {bnoTitleList.length > 0 ? (
          bnoTitleList.map((item, index) => {
            const [bno, title] = item.split('-') // bno와 title 분리
            return (
              <li key={index} onClick={() => handleBnoTitleClick(bno)}>
                {title}
              </li>
            )
          })
        ) : (
          <li>작성한 글이 없습니다.</li>
        )}
      </ul>
    </div>
  )
}

export default Profile
