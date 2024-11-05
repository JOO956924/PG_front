import React, {useState, useEffect, ChangeEvent, FormEvent} from 'react'
import {useNavigate} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import './modify.css'

interface MemberDTO {
  mid: number
  // email: string
  name: string
  birth: string
  phone: string
  // nowcash: number
  // addcash: number
  // level: string
  // prefer: string
  // likes: string
}

const Modify: React.FC = () => {
  const [member, setMember] = useState<MemberDTO | null>(null)
  const [formData, setFormData] = useState<MemberDTO>({
    mid: 0,
    // email: '',
    name: '',
    birth: '',
    phone: ''
    // nowcash: 0,
    // addcash: 0,
    // level: '',
    // prefer: '',
    // likes: ''
  })
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
        .then(data => {
          setMember(data)
          setFormData(data)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [token])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:8080/api/members/${formData.mid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        navigate('/members/profile')
      } else {
        console.error('Failed to update member information')
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  if (!member) {
    return <div>Loading...</div>
  }

  return (
    <div className="modify-container">
      <h1>회원정보 수정</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이름</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>생년월일</label>
          <input
            type="text"
            name="birth"
            value={formData.birth}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>연락처</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <button type="submit">수정 완료</button>
      </form>
    </div>
  )
}

export default Modify
